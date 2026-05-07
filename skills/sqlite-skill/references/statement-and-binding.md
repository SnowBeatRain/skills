# Statement 与参数绑定

SQLite 安全和性能的基础是 prepared statement 与参数绑定。任何来自用户、网络、文件、扫码、剪贴板、同步数据的值，都不能拼进 SQL 字符串。

## 生命周期

典型底层生命周期：

```text
prepare SQL
  -> bind parameters
  -> step / read columns
  -> reset for reuse 或 finalize/dispose
```

无论 wrapper 是否暴露底层 API，都要确认它是否正确释放 statement/cursor。未释放的 statement 会导致锁冲突、关闭失败或内存泄漏。

## 参数绑定规则

值使用占位符：

```sql
SELECT * FROM notes WHERE owner_id = ? AND updated_at > ?;
```

动态标识符不能作为参数绑定：

```sql
-- 错误思路：表名、列名、排序方向不能用 ? 表示
SELECT * FROM ? ORDER BY ? ?;
```

表名、列名、排序字段必须白名单化：

```ts
const orderByMap = {
  updatedAt: 'updated_at',
  title: 'title'
} as const

const direction = input.direction === 'asc' ? 'ASC' : 'DESC'
const orderBy = orderByMap[input.orderBy] ?? 'updated_at'
const sql = `SELECT * FROM notes ORDER BY ${orderBy} ${direction}`
```

## 类型绑定

| JS/宿主值 | SQLite 存储建议 | 注意 |
|---|---|---|
| `null` / `undefined` | NULL | 区分未传和显式 NULL |
| boolean | INTEGER 0/1 | SQLite 无独立 BOOLEAN 存储类 |
| number 整数 | INTEGER | 注意 JS 安全整数范围 |
| number 小数 | REAL | 金额优先用整数分单位或 TEXT decimal |
| string | TEXT | 统一编码和归一化策略 |
| Uint8Array/ArrayBuffer | BLOB | 不要把大附件默认塞进数据库 |
| Date | INTEGER 或 TEXT | 推荐统一 UTC epoch ms 或 ISO-8601 |

## 批量写入

批量写入必须放进事务。优先复用 prepared statement 或 wrapper 的 batch API：

```sql
BEGIN IMMEDIATE;
INSERT INTO events(id, payload, created_at) VALUES (?, ?, ?);
-- repeated binds
COMMIT;
```

注意宿主或 SQLite limits：单条 SQL 参数数量、SQL 长度、事务耗时和返回数据量可能受限。大批量导入应分批并可恢复。

## 常见错误

- 用字符串拼接实现搜索、排序、过滤。
- 批量写入每行单独事务。
- 查询大量数据后一次性映射到内存。
- statement/cursor 未关闭。
- 把 `INSERT OR REPLACE` 当普通更新，导致 delete+insert 语义破坏外键或触发器。

