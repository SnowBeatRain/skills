---
name: sqlite-uniapp-uts
description: 用于 uni-app / uni-app x 中通过 UTS 开发 iOS、Android、HarmonyOS 三端共用 SQLite 插件；当用户提到 sqlite-uniapp-uts、UTS SQLite、uni_modules SQLite 数据库插件、app-android/app-ios/app-harmony、SQLite 本地数据库原生封装、三端统一 SQLite API、SQLite 插件事务迁移或真机验证时使用。
---

# SQLite UniApp UTS

## 意图

帮助 Agent 架构、实现、审查和验证一个三端共用的 uni-app / uni-app x SQLite UTS 插件。核心是统一插件 API、平台 Adapter、能力矩阵、错误模型、迁移策略和真机验证，而不是重复 SQLite 通用教程。

## 协作边界

本 skill 可以单独分发和使用，必须自包含完成 SQLite UTS 插件工程的最小决策。若运行环境也安装了其他 skill，可按需协作：

- 涉及复杂 schema、SQL 优化、迁移、同步、PRAGMA、WAL、FTS、JSON、安全或 SQLite 错误码时，可参考 `sqlite-skill`，但本 skill 的最小契约仍以当前 references 为准。
- 涉及 uni-app 项目结构、`manifest.json`、条件编译、页面调用、HBuilderX 或发布时，可参考 `uniapp-skill`。
- 涉及 `utssdk/app-harmony/`、ArkTS/ETS、HarmonyOS Kit、ohpm、权限和真机调试时，可参考 `harmony-uts-plugin`。

本 skill 只负责把 SQLite 能力工程化封装为 iOS、Android、HarmonyOS 三端一致的 UTS 插件；不要把其他 skill 视为硬依赖。

## 架构原则

```text
业务页面 / DAO
  -> sqlite-uniapp-uts public API
  -> 统一 Core Contract
  -> Android Adapter / iOS Adapter / HarmonyOS Adapter
  -> 平台 SQLite 或关系型数据库能力
```

1. 先设计统一 API 和错误模型，再写平台实现。
2. 先输出能力矩阵，再承诺 WAL、FTS5、JSON、加密、backup 等能力。
3. 平台 Adapter 必须满足连接可控、statement/cursor 可释放、参数绑定、稳定结果映射、统一错误模型和同一事务上下文等最小 SQLite 契约。
4. 对外只暴露普通 DTO，不泄漏 Android、iOS、HarmonyOS 原生对象。
5. 三端行为不一致时，以能力探测、显式降级和文档说明处理，不静默伪装一致。
6. 涉及真实文件、隐私数据、同步队列和迁移时，必须规划真机验证。

## 工作流

### 1. 需求与能力边界

读取 `references/architecture.md`、`references/capability-matrix.md`、`references/official-docs.md`。

1. 确认目标是 uni-app 还是 uni-app x，目标平台是否包括 `APP-ANDROID`、`APP-IOS`、`APP-HARMONY`。
2. 确认插件 API 范围：基础 SQL、事务、批处理、迁移、备份、加密、FTS、JSON、同步辅助。
3. 明确最低 HBuilderX、uni-app / uni-app x、Android API、iOS 版本、HarmonyOS SDK / API Level。
4. 区分必须三端一致的能力与可选增强能力。

### 2. API 契约设计

读取 `references/public-api-contract.md`、`references/error-model.md`、`references/result-mapping.md`。

1. 定义 `openDatabase`、`closeDatabase`、`execute`、`query`、`transaction`、`batch`、`migrate`、`getCapabilities`。
2. 所有外部值通过参数绑定；动态表名、列名、排序字段交给业务白名单或 DAO。
3. 统一返回 `rowsAffected`、`lastInsertRowid`、`rows`、`columns`、`elapsedMs`。
4. 统一错误为 `errCode`、`errMsg`、`platform`、`nativeCode`、`retryable`。

### 3. 插件结构与平台 Adapter

读取 `references/plugin-structure.md`。按目标平台读取：

- Android：`references/android-adapter.md`
- iOS：`references/ios-adapter.md`
- HarmonyOS：`references/harmony-adapter.md`
- 三端差异总览：`references/native-api-comparison.md`

1. `index.uts` 做公共类型和 API 门面，平台目录只做 Adapter。
2. Android 优先核查 `SQLiteOpenHelper` / `SQLiteDatabase` 可用路径。
3. iOS 优先核查 SQLite C API wrapper 与资源释放。
4. HarmonyOS 必须先核查 RDB/SQLite wrapper、UTS 编译边界和 API Level。

### 4. 可靠性与性能

读取 `references/connection-lifecycle.md`、`references/transactions-and-locking.md`、`references/performance-and-limits.md`、`references/migrations-and-versioning.md`。

1. 明确连接缓存、关闭、账号隔离、后台同步和页面卸载策略。
2. 事务内部复用同一连接/事务上下文。
3. 批量写入必须事务化并分批。
4. 迁移必须覆盖新装、旧库升级、失败回滚、重复启动恢复。

### 5. 安全、测试与发布

读取 `references/security-and-privacy.md`、`references/testing-matrix.md`、`references/release-and-docs.md`、`references/common-recipes.md`。

1. 不记录敏感参数，不把 SQLite 当加密存储。
2. 真机验证成功、失败、拒权、磁盘满、锁冲突、迁移失败和崩溃恢复。
3. 插件文档必须列出平台能力矩阵、最低版本、已知限制和降级策略。

## 交付门禁

- [ ] 已确认三端目标版本、UTS 编译边界和官方文档入口。
- [ ] 已定义公共 API、DTO、错误码和能力矩阵。
- [ ] 已内置 SQLite 插件最小数据层规则；如参考其他 skill，未造成硬依赖或冲突版本。
- [ ] 已按平台实现 Adapter，且不向业务泄漏原生对象。
- [ ] 已验证参数绑定、事务回滚、批量写入、迁移失败恢复和连接关闭。
- [ ] 已在 Android、iOS、HarmonyOS 真机或目标真实环境执行验证计划。
- [ ] 已记录未支持能力和 fallback，不承诺未实测功能。

## References

| 场景 | 读取 |
|---|---|
| 架构与能力边界 | `references/architecture.md`、`references/capability-matrix.md`、`references/official-docs.md` |
| 公共 API 契约 | `references/public-api-contract.md` |
| 错误模型 | `references/error-model.md` |
| 结果映射 | `references/result-mapping.md` |
| 插件结构 | `references/plugin-structure.md` |
| Android Adapter | `references/android-adapter.md` |
| iOS Adapter | `references/ios-adapter.md` |
| HarmonyOS Adapter | `references/harmony-adapter.md` |
| 三端 API 差异 | `references/native-api-comparison.md` |
| 连接生命周期 | `references/connection-lifecycle.md` |
| 事务与锁 | `references/transactions-and-locking.md` |
| 迁移与版本 | `references/migrations-and-versioning.md` |
| 性能与限制 | `references/performance-and-limits.md` |
| 安全与隐私 | `references/security-and-privacy.md` |
| 测试矩阵 | `references/testing-matrix.md` |
| 发布与文档 | `references/release-and-docs.md` |
| 常用模板 | `references/common-recipes.md` |
