# DAO / QueryBuilder 模式

## 目录

- QueryBuilder 边界
- 安全排序
- DAO / Repository 示例
- 事务边界
- 常见误区


本参考提供平台中立的数据访问层模板，避免在业务代码中散落 SQL 拼接、同步状态更新和事务边界。

## DAO 原则

- DAO 只表达数据访问，不承载 UI 和宿主平台逻辑。
- 写操作明确事务边界，必要时同时更新业务表和 outbox。
- 返回领域对象前做类型转换和默认值处理。
- 列名、排序、分页游标使用白名单，不接受任意字符串。
- 软删除、同步状态、更新时间字段保持一致。

## 轻量 QueryBuilder

适合动态条件较多但不想引入完整 ORM 的场景。

```ts
type SortKey = 'createdAt' | 'updatedAt' | 'title'

const sortColumns: Record<SortKey, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  title: 'title'
}

function buildTaskListQuery(input: {
  status?: string
  keyword?: string
  sort?: SortKey
  beforeUpdatedAt?: number
  limit: number
}) {
  const where: string[] = ['deleted_at IS NULL']
  const params: unknown[] = []

  if (input.status) {
    where.push('status = ?')
    params.push(input.status)
  }

  if (input.keyword) {
    where.push('title LIKE ?')
    params.push(`%${input.keyword}%`)
  }

  if (input.beforeUpdatedAt) {
    where.push('updated_at < ?')
    params.push(input.beforeUpdatedAt)
  }

  const orderBy = sortColumns[input.sort ?? 'updatedAt']
  params.push(Math.min(input.limit, 100))

  return {
    sql: `SELECT local_id, server_id, title, status, updated_at
          FROM tasks
          WHERE ${where.join(' AND ')}
          ORDER BY ${orderBy} DESC
          LIMIT ?`,
    params
  }
}
```

注意：`ORDER BY ${orderBy}` 只能来自白名单。

## Repository 示例

```ts
class TaskRepository {
  constructor(private db: LocalDatabase) {}

  async create(input: { title: string }) {
    const now = Date.now()
    const localId = createId()
    const mutationId = createId()

    await this.db.transaction(async tx => {
      await tx.execute(
        `INSERT INTO tasks (local_id, title, status, sync_status, created_at, updated_at)
         VALUES (?, ?, 'open', 'pending', ?, ?)`,
        [localId, input.title, now, now]
      )

      await tx.execute(
        `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload, status, created_at, updated_at)
         VALUES (?, 'task', ?, 'create', ?, 'pending', ?, ?)`,
        [mutationId, localId, JSON.stringify({ localId, ...input }), now, now]
      )
    })

    return { localId }
  }
}
```

## Upsert 注意

优先使用明确冲突目标：

```sql
INSERT INTO tasks (local_id, server_id, title, updated_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(server_id) DO UPDATE SET
  title = excluded.title,
  updated_at = excluded.updated_at;
```

在不确定 SQLite 版本或 wrapper 支持时，先能力探测；必要时用事务内 `UPDATE` 后检查影响行数，再 `INSERT`。

## 慢查询记录

DAO 层可统一记录耗时，但日志应脱敏：

```text
query=TaskRepository.list duration_ms=87 rows=50 plan=uses idx_tasks_updated_at
```

不要把完整用户输入、token、证件号、手机号或未脱敏 payload 写入日志。
