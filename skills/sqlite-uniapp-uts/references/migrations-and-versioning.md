# 迁移与版本

通用迁移策略见 `sqlite-skill/references/migrations.md`。

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

