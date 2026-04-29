# 鸿蒙 UTS 插件 API 设计配方

> 用途：把具体鸿蒙原生能力设计成稳定的 uni 风格 API。先设计类型，再写 `app-harmony/index.uts`。

## 基础命名

| 类型 | 命名 |
|---|---|
| API | `doSomething` |
| 参数 | `DoSomethingOptions` |
| 成功 | `DoSomethingSuccess` |
| 失败 | `DoSomethingFail` |
| 成功回调 | `DoSomethingSuccessCallback` |
| 失败回调 | `DoSomethingFailCallback` |
| 完成回调 | `DoSomethingCompleteCallback` |

## 单次异步 API

适合：获取包信息、打开设置、查询设备能力、执行一次 SDK 调用。

```ts
export type GetNativeInfoSuccess = {
  errMsg: string
  value: string
}

export type GetNativeInfoFail = {
  errCode: number
  errMsg: string
}

export type GetNativeInfoOptions = {
  id?: string | null
  success?: ((res: GetNativeInfoSuccess) => void) | null
  fail?: ((err: GetNativeInfoFail) => void) | null
  complete?: ((res: any) => void) | null
}

export interface Uni {
  getNativeInfo(options: GetNativeInfoOptions): void
}
```

实现要点：

- 先校验参数，不合法直接 `fail`。
- Promise / callback / sync 原生 API 都转成同一种 success/fail/complete。
- `complete` 只调用一次。

## 订阅类 API

适合：BLE 扫描、传感器、连续定位、NFC 发现、网络状态监听。

推荐拆成：

```ts
startXxx(options)
stopXxx()
onXxxChange(callback)
offXxxChange(callback?)
```

要点：

- `start` 负责权限和启动硬件能力。
- `on` 负责注册页面回调。
- `off` 支持移除指定 callback 或全部 callback。
- `stop` 释放原生资源。
- 页面卸载必须调用 `stop/off`。

## 权限型 API

适合：相机、位置、麦克风、蓝牙、通知。

```ts
export type RequestXPermissionSuccess = {
  errMsg: string
  granted: boolean
  grantedList: Array<string>
}

export type RequestXPermissionFail = {
  errCode: number
  errMsg: string
  doNotAskAgain?: boolean | null
  grantedList?: Array<string> | null
}
```

要点：

- 权限 API 不等于业务 API；复杂场景建议拆成 `requestPermission` + `doBusiness`。
- 用户拒绝且不再询问时，不要循环弹窗；返回 `doNotAskAgain: true`，由页面引导设置。

## 打开 Ability / 系统页面

对外参数：

```ts
type OpenAbilityOptions = {
  bundleName?: string | null
  abilityName?: string | null
  uri?: string | null
  action?: string | null
  parameters?: Map<string, any> | null
  success?: ((res: { errMsg: string }) => void) | null
  fail?: ((err: { errCode: number, errMsg: string }) => void) | null
  complete?: ((res: any) => void) | null
}
```

要点：

- 不让页面传任意未校验 Want 到原生层。
- 如果是打开设置页，优先使用官方权限设置 API；避免硬编码私有 Ability。
- 拉起第三方应用前确认包名、Ability 名和失败码。

## 文件/媒体 API

对外 DTO：

```ts
type NativeFile = {
  path?: string | null
  uri?: string | null
  name?: string | null
  size?: number | null
  mimeType?: string | null
}
```

要点：

- 不返回 fd、内部沙箱绝对路径或长期有效 URI，除非业务确实需要且说明生命周期。
- 媒体库优先 picker；避免申请过宽媒体权限。
- 文件大小、时间戳等数值明确单位。

## 三方 SDK / ohpm API

模式：

1. 页面调用 UTS API。
2. `index.uts` 校验参数和权限。
3. `.ets` helper 调用 SDK。
4. SDK 结果映射为统一 DTO。
5. SDK 错误码保留在 `data` 或 `cause`，但 `errMsg` 面向业务可读。

错误示例：

```ts
type PayFail = {
  errCode: number
  errMsg: string
  sdkCode?: string | null
  sdkMessage?: string | null
}
```

## 选择 callback 还是 Promise

- 要挂载到 `uni.xxx`：优先 callback options。
- 项目内部插件函数：可同时提供 Promise 包装。
- 不要只返回 Promise 而丢失 `success/fail/complete`，否则和 uni API 风格不一致。

## 返回值 normalize 原则

- 原生对象 → DTO。
- `BusinessError` → `{ errCode, errMsg }`。
- 二进制/图片 → path / uri / base64 / ArrayBuffer，按业务选择。
- Map → 普通对象或 `Map<string, T>`，避免混合 key 类型。
- 时间 → number timestamp，并说明 ms/s。
