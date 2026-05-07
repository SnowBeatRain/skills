# 迁移与版本

本文件自包含 UTS 插件迁移与版本最小策略。业务 schema 归业务 DAO，但插件需要提供稳定版本读取、迁移执行、失败回滚和重复启动恢复能力。

## 推荐机制

- 简单项目可用 `PRAGMA user_version`。
- 复杂项目可用 `schema_migrations` 表记录每个 migration。
- 插件可提供 `getUserVersion`、`setUserVersion`、`migrate`，但业务 schema 归业务 DAO 管。

## 插件 migrate 行为

```ts
export interface Migration {
  version: number
  statements: SqlStatement[]
}
```

执行规则：

1. 读取当前版本。
2. 按版本升序执行未应用 migration。
3. 每个 migration 或整个迁移过程放入事务。
4. 成功后更新版本。
5. 失败时回滚并返回 `SQLITE_MIGRATION_FAILED`。

## 验证场景

- 新装建库。
- 旧版本逐级升级。
- migration 中途失败后再次启动。
- 重复执行不会重复插入或破坏数据。
- Android/iOS/HarmonyOS 三端版本一致。

## 版本更新事务绑定

每个 migration 的 schema 变更和版本号更新必须在同一个事务中提交：

```text
BEGIN
  执行 migration statements
  更新 user_version 或插入 schema_migrations(version)
COMMIT
```

失败时必须整体回滚，不能推进版本号。若整个升级链放入一个大事务，最终版本更新也必须在该事务内；若每个 migration 单独事务，则每个 migration 的版本记录和 SQL 必须同事务提交。

`statements` 中不允许业务自行传入 `BEGIN`、`COMMIT`、`ROLLBACK` 等事务控制语句，事务边界由插件层统一管理。
