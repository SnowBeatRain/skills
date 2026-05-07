# 约束与索引

约束保证数据质量，索引提升查询性能。本地库也应认真设计约束和索引，否则离线同步容易产生脏数据。

## 常用约束

```sql
CREATE TABLE IF NOT EXISTS users (
  local_id TEXT PRIMARY KEY,
  server_id TEXT UNIQUE,
  name TEXT NOT NULL CHECK (length(name) <= 50),
  age INTEGER CHECK (age IS NULL OR age >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- `PRIMARY KEY`：主键。
- `NOT NULL`：不能为空。
- `UNIQUE`：唯一。
- `CHECK`：业务约束。
- `DEFAULT`：默认值。
- `FOREIGN KEY`：外键。

## INTEGER PRIMARY KEY 与 AUTOINCREMENT

`INTEGER PRIMARY KEY` 通常已经是 rowid 别名。`AUTOINCREMENT` 会避免复用历史 rowid，但有额外开销。大多数业务不需要 `AUTOINCREMENT`。

离线同步场景建议使用 `local_id TEXT PRIMARY KEY` + `server_id TEXT UNIQUE`。

## 外键

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

SQLite 外键需要在连接上启用：

```sql
PRAGMA foreign_keys = ON;
```

通常每次打开连接后都要设置。

## 索引

```sql
CREATE INDEX IF NOT EXISTS idx_notes_sync_status
ON notes(sync_status);

CREATE INDEX IF NOT EXISTS idx_notes_updated_at
ON notes(updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_notes_server_id
ON notes(server_id)
WHERE server_id IS NOT NULL;
```

## 复合索引

```sql
CREATE INDEX IF NOT EXISTS idx_outbox_status_created_at
ON sync_outbox(status, created_at);
```

适合查询：

```sql
SELECT * FROM sync_outbox
WHERE status = ?
ORDER BY created_at ASC
LIMIT ?;
```

## 何时加索引

- 高频 `WHERE` 字段。
- `JOIN` 关联字段。
- `ORDER BY` 排序字段。
- 同步队列状态字段。
- 唯一业务键。

## 何时不要加索引

- 小表或低频查询。
- 写入极频繁但很少查询的字段。
- 选择性很差的字段，除非和其他字段组成复合索引。
- 没有实际查询路径支撑的“预防性索引”。
