# 鸿蒙 UTS 插件调试与发布排障

> 用途：当插件已经写出基本代码，但在 HBuilderX 运行、DevEco 编译、真机权限、ohpm 依赖、本地打包/云打包阶段出问题时，按本文件排查。

## 一、先定位失败阶段

| 阶段 | 典型表现 | 优先检查 |
|---|---|---|
| UTS 编译前 | HBuilderX 不识别插件、`uni.xxx is not a function` | `uni_modules/<plugin>/package.json`、`uni-ext-api`、是否 import 插件入口 |
| UTS → ArkTS 转译 | 类型报错、导入报错、对象字面量不匹配 | `interface.uts` 类型、`@kit.*` 导入、`uts-syntax-and-types.md` |
| DevEco / hvigor 编译 | `module.json5`、`oh-package.json5`、依赖解析失败 | 生成的 `unpackage/dist/dev/app-harmony` 工程、ohpm 依赖位置 |
| 安装启动 | 白屏、闪退、Ability 找不到 | `harmony-configs`、包名、签名、Ability 配置、运行日志 |
| 运行时调用 | 权限拒绝、设备能力不可用、`BusinessError` | 权限声明 + 运行时请求 + 真机能力 |
| 发布打包 | 本地打包或云打包失败 | 签名证书、DCloud 授权、依赖是否可被打包环境解析 |

## 二、HBuilderX / 生成工程排查

1. 先用 HBuilderX “运行到鸿蒙 App”触发生成工程。
2. 查看生成目录（常见位置）：

```text
unpackage/dist/dev/app-harmony/
unpackage/dist/build/app-harmony/
```

3. 在生成工程里确认：

- `entry/src/main/module.json5` 是否包含权限声明。
- `oh-package.json5` 是否包含 ohpm 依赖。
- `entry/src/main/ets/` 或对应生成目录中是否出现插件 ArkTS 产物。
- `resources/`、`AppScope/app.json5` 是否包含项目需要的配置。

> 不要直接把 `unpackage` 当长期源码维护；它是生成产物。确认问题后，回到 `harmony-configs/`、`uni_modules/<plugin>/utssdk/app-harmony/` 或 DCloud 指定配置源头修改。

## 三、常见错误与处理

| 问题 | 可能原因 | 处理 |
|---|---|---|
| `uni.myApi is not a function` | `package.json` 未声明 `uni-ext-api`；插件未被 import；API 名不一致 | 检查 `arkts: true`、`interface.uts`、入口导出；页面至少 import 一次插件 |
| `Cannot find module '@kit.XxxKit'` | SDK/API Level 不匹配；Kit 名称或导入路径旧 | 对照当前 HarmonyOS SDK 文档，改用当前 `@kit.*` 导入 |
| `BusinessError: permission denied` | `module.json5` 未声明或运行时未请求 | 同时补声明和 `UTSHarmony.requestSystemPermission` |
| `requestPermissionOnSetting` 无效 | 上下文不对或权限不可在设置页授权 | 确认使用 `UIAbilityContext`，并查权限等级 |
| ohpm 包运行可用但打包失败 | 依赖只写进生成工程或本地缓存 | 将依赖配置固化到 DCloud 支持的插件/项目配置源头，并验证云打包 |
| 模拟器正常、真机失败 | 权限、硬件、系统版本、厂商 SDK 限制不同 | 以真机为准，记录设备型号/API Level |
| 回调重复触发 | start/on 多次注册未去重 | 增加状态机和 listener Set；stop/off 时清理 |
| 页面返回后仍耗电/占用相机 | session/controller/listener 未释放 | 在 `onUnload` 调用 stop/release/off，失败路径也释放 |

## 四、日志建议

- 插件内部可用 `hilog` 输出分阶段日志：参数校验、权限结果、原生 API 调用、错误码。
- 日志不要包含 token、手机号、精确定位、联系人、文件绝对路径、签名证书等敏感信息。
- 对页面返回的 `errMsg` 面向业务可读；底层 SDK 原始错误可放到 `sdkCode` / `sdkMessage`，不要泄漏堆栈。

示例：

```ts
import { hilog } from '@kit.PerformanceAnalysisKit'

const DOMAIN = 0x0001
const TAG = 'MyHarmonyPlugin'

function logInfo(message: string) {
  hilog.info(DOMAIN, TAG, message)
}
```

## 五、真机验证矩阵

至少记录：

| 项 | 示例 |
|---|---|
| HBuilderX 版本 | 5.x |
| DevEco Studio 版本 | 5.x |
| HarmonyOS SDK / API Level | API 12/13/14 等 |
| 设备型号 | Mate / Pura / Nova / 开发板 |
| 系统版本 | HarmonyOS NEXT / OpenHarmony 版本 |
| 运行方式 | HBuilderX 运行、本地打包、云打包 |
| 权限状态 | 首次授权、拒绝、不再询问、设置页开启 |

## 六、发布前门禁

- [ ] `npm run validate` 或仓库 skill 校验通过。
- [ ] 示例页面能在 `APP-HARMONY` 条件编译下运行。
- [ ] 成功、参数错误、拒权、不再询问、设备不可用、API 抛错路径均验证。
- [ ] 订阅/扫描/相机/WebView/音频等资源在页面卸载后释放。
- [ ] ohpm/三方 SDK 依赖在本地打包和目标发布方式中都可解析。
- [ ] 文档没有密钥、证书密码、token、真实用户隐私数据。
