# 同步模式与冲突处理

离线优先不是简单缓存，而是本地可写、网络恢复后最终一致的数据系统。

## Outbox Pattern

本地写业务数据时，同一个事务写入同步队列。

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

CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_created_at
ON sync_outbox(status, created_at);
```

## 同步状态

```text
pending     待同步
syncing     同步中
synced      已同步
failed      同步失败，可重试
conflicted  冲突，需要处理
```

## 推送流程

```text
读取 pending outbox
  → 按 created_at 排序
  → 调用远端 API
  → 成功：更新业务表 server_id/server_version/sync_status
  → 标记 outbox synced 或删除
  → 失败：记录 last_error、retry_count、next_retry_at
```

## 拉取流程

```sql
CREATE TABLE IF NOT EXISTS sync_cursor (
  scope TEXT PRIMARY KEY,
  cursor TEXT,
  last_sync_at INTEGER
);
```

```text
读取 cursor
  → 请求服务端增量
  → 事务中 upsert 本地表
  → 更新 cursor
```

## 软删除 Tombstone

离线删除先写：

```sql
UPDATE notes
SET deleted_at = ?, sync_status = 'pending', updated_at = ?
WHERE local_id = ?;
```

服务端确认删除后，再按业务策略清理本地记录。

## 幂等

每次本地变更应有唯一 `mutation_id` 或 outbox id。服务端应支持重复提交同一个 mutation 不产生重复数据。

## 冲突检测

常用字段：

- `base_version`
- `server_version`
- `updated_at`
- `etag`
- `last_modified`

提交时携带本地修改基于哪个服务端版本。服务端发现版本不一致时返回冲突。

## 冲突策略

| 策略 | 适用场景 |
|---|---|
| Last Write Wins | 低价值缓存 |
| Server Wins | 服务端权威数据 |
| Client Wins | 端侧采集为准 |
| Field-level Merge | 多字段独立编辑 |
| Manual Resolve | 高价值业务数据 |
| CRDT / OT | 协同编辑，高复杂度 |

无法自动解决时：

```text
sync_status = conflicted
conflict_payload 保存服务端数据、本地数据和差异
UI 引导用户处理
```

## 附件同步

结构化数据和附件分离。先同步业务记录，再同步附件或使用独立附件 outbox。失败重试不能阻塞所有业务数据，除非业务强依赖附件。
