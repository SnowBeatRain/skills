# UTS 鸿蒙插件开发审查清单

> 用途：真实落地或审查 `uni_modules/*/utssdk/app-harmony` 插件时逐项检查，避免“能写示例但不能上线”。

## 一、需求判断

- [ ] 是否已有 `uni.*` API 覆盖？若有，优先用 `uni.*`。
- [ ] 是否已有成熟 DCloud 插件/官方插件？若有，先评估复用。
- [ ] 是否必须调用 OpenHarmony/HarmonyOS Kit、ohpm 包或厂商鸿蒙 SDK？
- [ ] 目标是 `APP-HARMONY` 还是 `MP-HARMONY`？元服务不要默认套 App UTS 插件方案。
- [ ] 是否需要真机能力（相机、NFC、蓝牙、传感器、定位）？模拟器不可作为最终验证。

## 二、版本与环境

- [ ] HBuilderX 版本支持目标能力，尤其鸿蒙和 UTS 混编能力。
- [ ] DevEco Studio / HarmonyOS SDK / API Level 与官方 docs 中 API 起始版本匹配。
- [ ] 项目是否是 uni-app x / `.uvue`，还是传统 uni-app。传统项目和 uni-app x 对 UTS 支持、页面形态不同。
- [ ] 页面示例路径使用 `pages/index/index.uvue`，不要误写成只适用于 Web/Vue 的 `.vue` 示例。

## 三、目录与配置

- [ ] 插件目录位于 `uni_modules/<plugin>/`。
- [ ] 有 `utssdk/interface.uts` 定义类型与 `Uni` 扩展。
- [ ] 有 `utssdk/app-harmony/index.uts` 作为鸿蒙实现入口。
- [ ] `package.json` 的 `uni_modules.uni-ext-api.uni.<api>.app.arkts` 为 `true`。
- [ ] 如需权限，已在 `harmony-configs/entry/src/main/module.json5` 或 DCloud 当前要求的配置位置声明。
- [ ] 如需 ohpm，已确认 `oh-package.json5` / 插件配置 / 生成工程依赖位置，并验证运行和打包都可解析。
- [ ] 如需 `.ets` helper，放在 `utssdk/app-harmony/` 下，并由 `index.uts` 明确导入。

## 四、接口设计

- [ ] 对外接口使用稳定的 `Options`、`Success`、`Fail`、`Complete` 类型。
- [ ] `success` / `fail` / `complete` 都可选并允许 `null`。
- [ ] 对外只返回普通 DTO，不返回 `UIAbilityContext`、`Want`、`BusinessError`、`PixelMap`、Camera session/controller 等原生对象。
- [ ] 错误统一为 `{ errCode, errMsg }` 或 `UniError`。
- [ ] 鸿蒙平台自定义错误码使用 `5xx` / `50000+` 区间。
- [ ] 异步 API 不让页面直接面对多层 callback hell；插件内部 normalize 后再回调。

## 五、权限与隐私

- [ ] 每个敏感能力都有对应权限声明和运行时请求。
- [ ] 用户拒绝、拒绝且不再询问、设置页返回后仍拒绝，都有明确 fail 路径。
- [ ] 不在插件初始化时批量申请无关权限；按功能触发申请。
- [ ] 定位、联系人、日历、电话、短信、相册、麦克风等高敏感能力有页面层用途说明。
- [ ] 不记录或回传敏感数据：token、手机号、精确定位、联系人详情、文件绝对路径、签名证书等。
- [ ] 官方 docs 标记 `-sys.md` / “系统接口” / ACL / privileged 的能力没有被当作普通三方能力使用。

## 六、生命周期与资源释放

- [ ] 扫描/监听/订阅类 API 必须成对提供 stop/off/unsubscribe。
- [ ] Camera/WebView/Audio/BLE/NFC/session/controller 在页面卸载或失败时释放。
- [ ] 多次调用 start 不会重复注册监听器或泄漏资源。
- [ ] 处理应用前后台切换、权限被系统回收、设备关闭（蓝牙/NFC/GPS）等状态变化。
- [ ] 高频回调（传感器、定位、BLE 扫描）有节流或过滤策略。

## 七、兼容与兜底

- [ ] 页面调用处用 `#ifdef APP-HARMONY` 隔离鸿蒙插件。
- [ ] 非鸿蒙平台有明确兜底提示或替代实现。
- [ ] 若插件通过 `uni.xxx` 挂载，至少在入口或页面 import 一次，避免 tree-shaking 移除。
- [ ] API Level 不满足时返回明确错误，而不是崩溃。
- [ ] 设备不支持（无 NFC、无蓝牙、无相机）时返回明确错误。

## 八、测试路径

至少验证：

- [ ] 成功路径。
- [ ] 参数缺失 / 参数类型不对。
- [ ] 权限未声明。
- [ ] 用户首次拒权。
- [ ] 用户拒绝且不再询问。
- [ ] 设备能力关闭或不存在。
- [ ] API 抛 `BusinessError`。
- [ ] 页面卸载后的资源释放。
- [ ] 真机运行。
- [ ] 本地打包或云打包。

## 九、文档与示例

- [ ] 示例页面使用 `pages/index/index.uvue`。
- [ ] 示例包括直接 import 和挂载到 `uni` 两种调用方式时，说明各自前提。
- [ ] 示例中对象日志使用 `JSON.stringify()`。
- [ ] 不复制大段官方文档，只记录 API 文件、权限、调用顺序和注意事项。
