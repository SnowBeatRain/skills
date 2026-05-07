# 常用模板

## 目录

- 初始化数据库
- 创建表
- 插入或更新
- 查询分页
- 软删除
- 查询待同步任务
- 标记同步结果
- 健康检查


## 创建离线业务表

```sql
CREATE TABLE IF NOT EXISTS tasks (
  local_id TEXT PRIMARY KEY,
  server_id TEXT UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  base_version INTEGER,
  server_version INTEGER,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(sync_status);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
```

## 创建同步队列

```sql
CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 离线新增伪代码

```ts
async function createTask(input: CreateTaskInput) {
  const now = Date.now()
  const localId = createId()
  const mutationId = createId()

  await db.transaction(async () => {
    await db.execute(
      `INSERT INTO tasks (local_id, title, status, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [localId, input.title, 'open', now, now]
    )

    await db.execute(
      `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload, status, created_at, updated_at)
       VALUES (?, 'task', ?, 'create', ?, 'pending', ?, ?)`,
      [mutationId, localId, JSON.stringify({ localId, ...input }), now, now]
    )
  })
}
```

## 查询待同步任务

```sql
SELECT id, entity_type, entity_id, operation, payload, retry_count
FROM sync_outbox
WHERE status = 'pending'
  AND (next_retry_at IS NULL OR next_retry_at <= ?)
ORDER BY created_at ASC
LIMIT ?;
```

## 软删除

```sql
UPDATE tasks
SET deleted_at = ?, sync_status = 'pending', updated_at = ?
WHERE local_id = ?;
```

## Keyset 分页

```sql
SELECT local_id, title, updated_at
FROM tasks
WHERE deleted_at IS NULL
  AND updated_at < ?
ORDER BY updated_at DESC
LIMIT ?;
```

## 迁移模板

```ts
type Migration = {
  version: number
  name: string
  up(db: LocalDatabase): Promise<void>
}
```

## 查询计划

```sql
EXPLAIN QUERY PLAN
SELECT local_id, title FROM tasks WHERE sync_status = ? ORDER BY updated_at DESC;
```

## 最小 Adapter 契约

```ts
export interface LocalDatabase {
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected?: number }>
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
  transaction<T>(fn: (tx: LocalDatabase) => Promise<T>): Promise<T>
}
```

## 能力探测

```sql
SELECT sqlite_version();
PRAGMA compile_options;
PRAGMA foreign_keys;
PRAGMA journal_mode;
PRAGMA user_version;
```

## 健康检查

```sql
PRAGMA quick_check;
PRAGMA integrity_check;
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;
```

估算数据库大小：`page_count * page_size`。检查结果写日志时避免记录敏感 payload。
