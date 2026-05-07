# 连接生命周期

SQLite 连接不是普通对象缓存。连接数量、打开模式、事务边界、statement 释放、WAL 和宿主线程模型都会影响锁、性能和数据可靠性。

## 连接策略

| 场景 | 推荐策略 | 注意 |
|---|---|---|
| 单用户本地 App | 每个数据库文件维护少量长连接 | 避免每次 SQL 都 open/close |
| 多账号/多租户 | 按账号隔离数据库文件或连接命名空间 | 切换账号时关闭旧连接并清理敏感缓存 |
| 后台同步 | 复用受控连接或串行写队列 | 避免 UI 写入和同步写入互相抢锁 |
| 一次性脚本 | 显式 open/close | finally 中关闭连接 |

不要默认“连接越多越快”。SQLite 支持多读，但通常同一时间只有一个写事务。移动端、桌面端和 WASM wrapper 还可能额外限制线程或队列。

## 打开数据库

打开前确认：

- 数据库文件路径是否属于当前用户/租户。
- 父目录是否存在、可写、可备份或可排除备份。
- 是否需要只读、读写、创建、独占等打开模式。
- 是否需要初始化 PRAGMA：`foreign_keys`、`journal_mode`、`busy_timeout`、`synchronous`。

打开后读取并记录：

```sql
SELECT sqlite_version();
PRAGMA user_version;
PRAGMA foreign_keys;
PRAGMA journal_mode;
```

`PRAGMA foreign_keys = ON` 需要在每个连接上启用并读取确认。`journal_mode = WAL` 需要检查返回值，不能只看执行是否报错。

## 关闭数据库

关闭前确认：

- 没有未提交事务。
- 没有未 finalize/dispose 的 statement。
- 没有正在迭代的 cursor/result set。
- 后台同步、订阅、定时健康检查已停止或切换连接。

关闭失败通常说明仍有 statement 或事务占用。不要吞掉关闭失败；记录诊断信息，避免下一次打开出现 locked/misuse。

## 事务中的连接

事务回调内部必须复用同一连接或同一事务上下文。以下模式是危险的：

```text
BEGIN
  DAO A 使用 connection-1 写入
  DAO B 自己 open connection-2 写入
COMMIT
```

正确做法是将事务上下文传入 DAO：

```ts
await db.transaction(async (tx) => {
  await userDao.save(tx, user)
  await outboxDao.enqueue(tx, event)
})
```

## 崩溃恢复

- 应假设 App 可能在任意 SQL 后崩溃。
- migration、批量导入、业务写入和 outbox 状态更新应放进事务。
- 启动时可检查 `PRAGMA quick_check;`、最近迁移版本、最近未完成同步任务。
- 对 `SQLITE_FULL`、`SQLITE_IOERR`、`SQLITE_CORRUPT` 先停止写入，避免扩大损坏。

