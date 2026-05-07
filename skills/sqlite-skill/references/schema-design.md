# Schema 设计

## 目录

- 设计步骤
- 常用字段
- 示例 schema
- 同步字段
- 多账号隔离
- 变更与兼容


SQLite schema 设计要先明确实体、查询路径、同步方式和数据生命周期。本地离线场景尤其要区分本地身份与服务端身份。

## 命名建议

- 表名：英文小写复数或业务名，如 `tasks`、`sync_outbox`。
- 字段名：snake_case，如 `created_at`、`server_id`。
- 索引名：`idx_<table>_<columns>`。
- 唯一索引名：`ux_<table>_<columns>`。

## 主键策略

普通本地表可用：

```sql
id INTEGER PRIMARY KEY
```

离线同步表建议使用稳定的本地 ID：

```sql
local_id TEXT PRIMARY KEY,
server_id TEXT UNIQUE
```

原因：离线新增时还没有服务端 ID，多设备同时新增也不能依赖本地自增 ID 全局唯一。

## 离线业务表模板

```sql
CREATE TABLE IF NOT EXISTS notes (
  local_id TEXT PRIMARY KEY,
  server_id TEXT UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  base_version INTEGER,
  server_version INTEGER,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_sync_status
ON notes(sync_status);

CREATE INDEX IF NOT EXISTS idx_notes_updated_at
ON notes(updated_at);
```

## 时间字段

统一一种格式，不要混用：

- UTC ISO-8601 文本：便于调试和排序。
- Unix 毫秒时间戳：便于计算和跨语言传输。

建议所有端明确约定时区和秒/毫秒单位。

## 软删除

离线同步下不建议直接物理删除。使用：

```sql
deleted_at TEXT
```

删除流程：本地设置 `deleted_at`，写入同步队列；服务端确认后再按策略清理。

## 同步字段

常见字段：

| 字段 | 用途 |
|---|---|
| `local_id` | 本地唯一 ID |
| `server_id` | 服务端 ID |
| `sync_status` | `pending/syncing/synced/failed/conflicted` |
| `base_version` | 本地修改基于哪个服务端版本 |
| `server_version` | 服务端当前版本 |
| `deleted_at` | 软删除时间 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

## 附件设计

大量图片、音频、视频和文档通常不要直接存 BLOB。建议文件系统存文件，SQLite 存路径、hash、大小、同步状态。

```sql
CREATE TABLE IF NOT EXISTS attachments (
  local_id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_local_id TEXT NOT NULL,
  local_path TEXT NOT NULL,
  remote_url TEXT,
  file_hash TEXT,
  size_bytes INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
```
