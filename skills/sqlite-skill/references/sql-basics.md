# SQLite SQL 基础

本文件覆盖常用 SQLite SQL。建表基础可参考官方 SQL 语法和第三方教程，例如 <https://www.runoob.com/sqlite/sqlite-create-table.html>，但实现时以 SQLite 官方文档和当前运行环境为准。

## 创建表

```sql
CREATE TABLE IF NOT EXISTS todo (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

常用约束：

- `PRIMARY KEY`
- `NOT NULL`
- `UNIQUE`
- `DEFAULT`
- `CHECK`
- `FOREIGN KEY`

## 增删改查

```sql
INSERT INTO todo (title, completed, created_at, updated_at)
VALUES (?, 0, ?, ?);

SELECT id, title, completed
FROM todo
WHERE completed = ?
ORDER BY updated_at DESC
LIMIT ? OFFSET ?;

UPDATE todo
SET title = ?, updated_at = ?
WHERE id = ?;

DELETE FROM todo
WHERE id = ?;
```

## UPSERT

```sql
INSERT INTO note (local_id, server_id, title, updated_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(local_id) DO UPDATE SET
  server_id = excluded.server_id,
  title = excluded.title,
  updated_at = excluded.updated_at;
```

## JOIN

```sql
SELECT o.id, o.total_amount, c.name AS customer_name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.deleted_at IS NULL
ORDER BY o.created_at DESC;
```

## 聚合

```sql
SELECT status, COUNT(*) AS count
FROM sync_outbox
GROUP BY status
HAVING COUNT(*) > 0;
```

## 修改表结构

```sql
ALTER TABLE note ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';
```

SQLite 的 `ALTER TABLE` 能力有限，复杂变更见 `migrations.md`。

## CLI 常用命令

```text
.tables
.schema table_name
.indexes table_name
.mode column
.headers on
```

## 参数化原则

用户输入只能进入参数，不要拼接 SQL：

```sql
SELECT * FROM user WHERE name = ?;
```

动态排序字段不能用参数占位替代表名/列名，必须使用白名单映射。
