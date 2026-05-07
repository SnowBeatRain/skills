# HarmonyOS Adapter

HarmonyOS 侧必须能力核查优先。不要默认 Android SQLite 方案可迁移到鸿蒙，也不要默认所有 HarmonyOS 目标都能使用同一 RDB/SQLite wrapper。

## 官方资料入口

- DCloud UTS 插件与 app-harmony 文档：优先查当前 HBuilderX / uni-app x 官方文档。
- HarmonyOS / OpenHarmony 关系型数据库、ArkTS、ohpm、Kit 文档：以目标 SDK/API Level 官方文档为准。

## 适配路线

1. 确认目标是 `APP-HARMONY`，不是 `MP-HARMONY`。
2. 确认 UTS 是否支持当前 app-harmony 插件目录和 ArkTS/ETS helper。
3. 确认可用数据库能力：关系型数据库 API、SQLite wrapper、ohpm 依赖或项目已有封装。
4. 定义 `app-harmony/index.uts` 作为 UTS API 门面。
5. 复杂连接、事务、结果集状态机拆到 ArkTS/ETS helper。

## 必查问题

- 数据库文件路径如何获取，是否有沙盒/备份/清理限制。
- 是否支持参数绑定。
- 是否支持事务，事务是否能绑定同一 store/connection。
- 查询结果如何关闭或释放。
- 原生错误码如何获取。
- WAL、FTS5、JSON、加密是否支持或不可用。

## 风险清单

- 把 `APP` / `APP-PLUS` / `APP-HARMONY` 条件编译混淆。
- 在鸿蒙元服务上套用鸿蒙 App UTS 插件方案。
- ohpm 或 Kit 能力未随插件声明和打包。
- API Level 差异导致真机可用性不同。
- 只在模拟器验证数据库文件和锁行为。

