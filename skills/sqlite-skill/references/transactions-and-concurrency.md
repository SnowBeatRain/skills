# 事务与并发

SQLite 支持 ACID 事务。端侧离线写入、同步队列、迁移和批量导入必须重视事务。

## 基础事务

```sql
BEGIN TRANSACTION;

INSERT INTO notes (local_id, title, sync_status, created_at, updated_at)
VALUES (?, ?, 'pending', ?, ?);

INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload, status, created_at, updated_at)
VALUES (?, 'note', ?, 'create', ?, 'pending', ?, ?);

COMMIT;
```

失败时执行：

```sql
ROLLBACK;
```

## 批量写入

不要循环单条提交。批量插入、服务端增量落库、迁移数据复制都应放到同一个事务中。

## SAVEPOINT

需要局部回滚时可用：

```sql
SAVEPOINT part1;
-- do work
ROLLBACK TO part1;
RELEASE part1;
```

## 并发模型

SQLite 支持多读，但通常同一时间只允许一个写事务。移动端多页面、多任务同时写库时，建议：

- 通过单例 database service 管理连接。
- 写操作排队。
- 长事务中不要做网络请求。
- UI 线程不要执行大量同步阻塞操作。

## WAL

WAL 可改善读写并发：

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
```

注意：

- WAL 会产生 `-wal` 和 `-shm` 文件。
- 备份数据库时要考虑相关文件。
- 插件或平台不一定支持 WAL，必须实测。
- 小型简单库不一定需要手动启用 WAL。

## 锁等待

`busy_timeout` 可以让连接遇到锁时等待一段时间。但根因仍应通过缩短事务、队列化写入、避免并发写解决。
