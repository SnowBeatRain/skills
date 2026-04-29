# OpenHarmony / HarmonyOS 原生 API 索引（UTS 插件视角）

> 用途：在写 `utssdk/app-harmony` 时快速选 Kit、模块、权限和封装方式。具体签名以当前 HarmonyOS SDK / OpenHarmony docs 为准。

## 快速选型

| 场景 | 常用 Kit / 模块 | 常见导入 | 典型权限 / 配置 | UTS 封装建议 |
|---|---|---|---|---|
| 上下文、Ability、应用跳转 | AbilityKit | `common`, `Want`, `abilityAccessCtrl` from `@kit.AbilityKit` | `module.json5` skills/abilities | 对外隐藏 `UIAbilityContext`，只暴露业务参数 |
| 包信息、应用信息 | AbilityKit | `bundleManager` from `@kit.AbilityKit` | 通常无 | 返回 bundleName/version 等普通对象 |
| 权限申请 | AbilityKit | `abilityAccessCtrl`, `Permissions` from `@kit.AbilityKit` | `module.requestPermissions` | 先声明再请求；处理拒绝和“不再询问” |
| 日志、性能分析 | PerformanceAnalysisKit | `hilog` from `@kit.PerformanceAnalysisKit` | 无 | 插件内部日志，避免泄漏隐私 |
| 错误类型 | BasicServicesKit | `BusinessError` from `@kit.BasicServicesKit` | 无 | 转成 `{ errCode, errMsg }` |
| 网络请求 / HTTP | NetworkKit | `http` from `@kit.NetworkKit` | `ohos.permission.INTERNET`, `GET_NETWORK_INFO` | 优先用 `uni.request`；仅特殊网络能力才封装 |
| 文件与沙箱 | CoreFileKit | `fileIo`, `fs`, `picker` 等（按 SDK） | 文件/媒体相关权限视场景 | 不暴露绝对路径；返回临时路径/业务路径 |
| 图片/视频选择 | CoreFileKit / MediaLibraryKit | Photo picker / media APIs | 读写媒体权限可能受限 | 优先用 `uni.chooseImage/chooseVideo`，缺失能力再封装 |
| 相机 | CameraKit | camera manager/session/input/output | `ohos.permission.CAMERA`, 麦克风视视频而定 | 生命周期复杂，建议 ETS helper 承担状态机 |
| 位置 | LocationKit | geoLocationManager 等 | `LOCATION`, `APPROXIMATELY_LOCATION` 等 | 明确精确/模糊定位、前台/后台定位 |
| 蓝牙 / BLE | ConnectivityKit | bluetooth / ble APIs | `ACCESS_BLUETOOTH` 等 | 扫描/连接/监听要提供 stop/close |
| NFC | ConnectivityKit | NFC controller/tag APIs | NFC 相关配置/权限 | 对外抽象 tag 信息和读写结果 |
| 网络状态 | NetworkKit | connection / netConnection | `GET_NETWORK_INFO` | 通常用 `uni.getNetworkType`；特殊监听再封装 |
| 传感器 | SensorServiceKit | sensor APIs | 视传感器而定 | 订阅类 API 必须提供取消订阅 |
| 通知 | NotificationKit | notificationManager | `ohos.permission.NOTIFICATION` | 先请求通知授权，再发布/取消 |
| 剪贴板 | BasicServicesKit / MiscServicesKit | pasteboard APIs | 读剪贴板可能受限 | 优先用 `uni.setClipboardData/getClipboardData` |
| 设备信息 | DeviceInfoKit / BasicServicesKit | deviceInfo 等 | 通常无，敏感标识受限 | 不采集不可恢复/敏感设备标识 |
| 窗口、屏幕、UI | ArkUI / Window Kit | window APIs, ArkUI components | 无或系统配置 | 页面级优先用 uni API；原生组件用 ETS |
| WebView / 原生嵌入 | ArkWeb / Runtime | webview/Controller APIs | 网络、文件视内容而定 | 复杂 UI 用 `.ets` + UTS API 包装 |
| 三方 SDK / ohpm | oh-package / ohpm 包 | `import { X } from '@scope/pkg'` | `oh-package.json5` 依赖 | 页面不能直接用 ohpm，必须经 UTS 插件中转 |

## 官方细查表

更完整的 Kit/API/权限/官方文件定位见 `official-kit-api-reference.md`。当用户提出具体能力时，优先从该文件定位官方目录和 API 文件，再回到官方 docs 确认函数签名、API Level、权限等级和是否系统接口。

## Ability 与 Want

常见用途：打开系统设置、拉起其他 Ability、应用市场、分享/支付 SDK 回调等。

核心概念：

- `common.UIAbilityContext`：当前 Ability 上下文，通常通过 `UTSHarmony.getUIAbilityContext()` 或 `getContext()` 获取。
- `Want`：鸿蒙的意图对象，包含 `bundleName`、`abilityName`、`uri`、`action`、`parameters` 等字段。
- `startAbility(want)`：通过上下文启动目标 Ability。

封装建议：

```ts
import type { common, Want } from '@kit.AbilityKit'
import { BusinessError } from '@kit.BasicServicesKit'

export function openAbility(options: OpenAbilityOptions) {
  const context = UTSHarmony.getUIAbilityContext() as common.UIAbilityContext
  const want: Want = {
    bundleName: options.bundleName,
    abilityName: options.abilityName,
    parameters: options.parameters
  }
  context.startAbility(want).then(() => {
    options.success?.({ errMsg: 'openAbility:ok' })
  }).catch((err: BusinessError) => {
    options.fail?.({ errCode: err.code, errMsg: err.message })
  })
}
```

## 权限 API

优先使用 DCloud 在鸿蒙 UTS 中提供的 `UTSHarmony.requestSystemPermission` 简化运行时权限流程；需要设置页二次授权时再结合 `abilityAccessCtrl.createAtManager()`。

```ts
import { abilityAccessCtrl, Permissions } from '@kit.AbilityKit'

const permissions: Permissions[] = ['ohos.permission.CAMERA']
const context = UTSHarmony.getUIAbilityContext()
const atManager = abilityAccessCtrl.createAtManager()

UTSHarmony.requestSystemPermission(
  permissions,
  (allRight: boolean, grantedList: Array<string>) => {},
  async (doNotAskAgain: boolean, grantedList: Array<string>) => {
    if (doNotAskAgain) {
      await atManager.requestPermissionOnSetting(context, permissions)
    }
  }
)
```

## 文件 / 媒体

原则：

- 普通选择图片、拍照、录音、保存相册，先尝试 `uni.*` API。
- 只有需要鸿蒙独有文件能力、特定 picker 行为、沙箱目录、三方 SDK 文件交互时才写插件。
- 返回给页面的数据应是稳定 DTO，例如 `{ path, name, size, mimeType }`，避免直接暴露 file descriptor 或鸿蒙对象。

## 相机

CameraKit 通常涉及 manager、输入、输出、session、surface/preview 生命周期。UTS 入口不要堆满状态机：

- 简单拍照：优先使用 `uni.chooseImage({ sourceType: ['camera'] })`。
- 自定义预览/扫码/特殊参数：建议 `app-harmony/index.uts` 只暴露 API，复杂生命周期放 `.ets` helper 或原生组件。
- 必须处理：权限、设备不可用、前后台切换、释放 session。

## 位置

封装前先确认：

- 是否需要精确定位还是模糊定位。
- 是否需要后台定位（通常更敏感，审核要求更高）。
- 是否可直接使用 `uni.getLocation`。

对外接口建议：

```ts
type LocationResult = {
  latitude: number
  longitude: number
  accuracy?: number | null
  timestamp?: number | null
}
```

## 蓝牙 / NFC / 传感器订阅类 API

凡是“开始扫描/监听/订阅”的 API，都必须设计对应的停止函数：

- `startBluetoothScan` / `stopBluetoothScan`
- `onSensorChange` / `offSensorChange`
- `startNfcDiscovery` / `stopNfcDiscovery`

并在页面 `onUnload` 或组件卸载时释放资源。

## 通知

流程通常是：

1. `module.json5` 声明通知权限。
2. 运行时请求 `ohos.permission.NOTIFICATION`。
3. 调用 NotificationKit 发布通知。
4. 提供取消通知/清空通知能力。

注意通知渠道、前后台行为、点击回调在不同系统版本可能有差异，最终以设备实测为准。
