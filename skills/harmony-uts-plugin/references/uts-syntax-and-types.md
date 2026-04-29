# UTS 语法与类型要点（鸿蒙插件专用）

> 本文件提炼自现有 `uniapp-skill` 的 UTS 资料，并聚焦 `utssdk/app-harmony` 开发。目标是让 Agent 写鸿蒙插件时同时遵守 UTS 强类型、uni API 扩展规范和 ArkTS 互操作约束。

## UTS 在鸿蒙插件里的定位

- UTS 语法接近 TypeScript，但不是普通 TS；它会编译到平台原生语言。
- 鸿蒙平台编译目标是 ArkTS/ETS，插件实现通常在 `uni_modules/<plugin>/utssdk/app-harmony/index.uts`。
- 页面 `.uvue` 或插件 `index.uts` 都要写强类型代码；不要按 JavaScript 弱类型习惯随意传对象。
- `@kit.*`、ohpm 包、ArkTS/ETS helper 只能在鸿蒙原生层/UTS 插件中使用，页面不要直接 import ohpm 包。

## 基础语法

```ts
let count = 0
let name: string = 'uni-app x'
let enabled: boolean = true

function add(a: number, b: number): number {
  return a + b
}

class User {
  name: string
  age: number

  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }

  greet(): string {
    return `Hello, ${this.name}`
  }
}

type ApiResult = {
  errMsg: string
  value: string
}

interface NativeOptions {
  id: string
  timeout?: number | null
}
```

## 与 TypeScript/JavaScript 的关键差异

- UTS 更接近 Kotlin/Swift/ArkTS 的强类型系统，不要假设 TS 的所有结构类型/联合类型技巧都可用。
- 变量声明后类型不可随意变化，少用 `any`。
- `null` / `undefined` 更严格，可空字段要显式写 `?` 或 `| null`。
- JSON、Map、Array、对象字面量在不同 HBuilderX 版本中的类型推导能力不同；复杂结构建议显式定义 `type`。
- 调试时对象可能显示为 ETS/ArkTS 风格；日志输出对象建议 `JSON.stringify(obj)`。

## 常用类型写法

```ts
type StringMap = Map<string, string>
type NumberList = Array<number>

type FileInfo = {
  path: string
  name?: string | null
  size?: number | null
  mimeType?: string | null
}

type SuccessCallback<T> = (res: T) => void
type FailCallback = (err: { errCode: number, errMsg: string }) => void
```

### number / Long / Double 注意

- UTS 里的 `number` 到不同平台会映射到原生数值类型。
- 鸿蒙 ArkTS API 文档里可能出现整数/浮点、`number`、`long` 语义差异；与 Android/iOS 的 `/Long/Double` 经验类似，不能把所有数值都当无损 JS number 处理。
- 涉及时间戳、文件大小、媒体时长、蓝牙 payload 长度、native SDK id 时，明确单位和范围。
- 页面层返回 DTO 时尽量用 `number`，但内部调用 native API 前做范围校验。

## interface.uts 设计规范

`utssdk/interface.uts` 用于声明跨平台类型和扩展 `Uni` 接口。推荐模式：

```ts
export type OpenNativeSuccess = {
  errMsg: string
  value: string
}

export type OpenNativeFail = {
  errCode: number
  errMsg: string
}

export type OpenNativeSuccessCallback = (res: OpenNativeSuccess) => void
export type OpenNativeFailCallback = (err: OpenNativeFail) => void
export type OpenNativeCompleteCallback = (res: any) => void

export type OpenNativeOptions = {
  id: string
  success?: OpenNativeSuccessCallback | null
  fail?: OpenNativeFailCallback | null
  complete?: OpenNativeCompleteCallback | null
}

export interface Uni {
  openNative(options: OpenNativeOptions): void
}
```

要点：

- 对外 API 名、Options、Success、Fail 类型保持稳定。
- 可选 callback 用 `?` + `| null`，调用时用 `options.success?.(res)`。
- `complete` 结果类型可宽一些，但 success/fail 要尽量精确。
- 不把 `common.UIAbilityContext`、`Want`、`BusinessError`、`PixelMap`、`CameraInput` 等原生对象暴露到页面层。

## uni 风格 callback 与 Promise

插件优先兼容 uni 风格 options：

```ts
function callSuccess<T>(options: { success?: ((res: T) => void) | null, complete?: ((res: any) => void) | null }, res: T) {
  options.success?.(res)
  options.complete?.(res)
}

function callFail(options: { fail?: ((err: any) => void) | null, complete?: ((res: any) => void) | null }, code: number, message: string) {
  const err = { errCode: code, errMsg: message }
  options.fail?.(err)
  options.complete?.(err)
}
```

如果额外提供 Promise 包装，应作为补充，不要牺牲 uni API 兼容性。

## UniError 规范

DCloud UniError 更适合做标准 uni API 扩展错误：

```ts
let error = new UniError('openNative', 50001, 'permission denied')
error.data = { permission: 'ohos.permission.CAMERA' }
```

错误码建议：

| 平台 | 建议段 |
|---|---|
| 跨平台 | 6xx / 60000+ |
| Android | 7xx / 70000+ |
| iOS | 8xx / 80000+ |
| Web | 9xx / 90000+ |
| HarmonyOS | 5xx / 50000+ |

普通插件也可以返回 `{ errCode, errMsg }`；但要保留鸿蒙 `BusinessError.code/message`，不要吞掉真实错误。

## Harmony API 导入写法

推荐：

```ts
import { BusinessError } from '@kit.BasicServicesKit'
import { hilog } from '@kit.PerformanceAnalysisKit'
import type { common, Want } from '@kit.AbilityKit'
import { abilityAccessCtrl } from '@kit.AbilityKit'
```

要点：

- 纯类型用 `import type`，减少运行时依赖混乱。
- 复杂 SDK / ArkUI 组件可拆到 `.ets` helper。
- 官方旧式 `@ohos.*` 文档可能仍存在；新项目优先查 `@kit.*` 入口。

## 条件编译

页面或跨端入口中要用条件编译隔离鸿蒙能力：

```ts
// #ifdef APP-HARMONY
import { openNative } from '@/uni_modules/my-harmony-plugin'
openNative({ id: 'demo' })
// #endif

// #ifndef APP-HARMONY
uni.showToast({ title: '当前平台暂不支持', icon: 'none' })
// #endif
```

不要在非鸿蒙分支 import `@kit.*` 或 ohpm 包。

## 插件导入与 tree-shaking

- 如果插件通过 `package.json` 扩展到 `uni.*`，仍需要在任意页面或入口处至少 import 一次插件。
- 否则插件代码可能被 tree-shaking 移除，导致 `uni.xxx` 不存在。

```ts
// pages/index/index.uvue 或应用入口中
import '@/uni_modules/my-harmony-plugin'
```

也可以直接导入函数：

```ts
import { openNative } from '@/uni_modules/my-harmony-plugin'
```

## JSON 与日志

- `console.log(obj)` 在鸿蒙调试中可能不直观，优先 `console.log(JSON.stringify(obj))`。
- `JSON.parse` 的类型能力随 HBuilderX 版本变化；解析后建议显式转成业务类型或手动校验。
- 不要把 `BusinessError`、SDK 回调对象直接 `JSON.stringify` 后返回页面，先 normalize。

```ts
function normalizeError(e: any): { errCode: number, errMsg: string } {
  const err = e as BusinessError
  return {
    errCode: err.code ?? 50000,
    errMsg: err.message ?? String(e)
  }
}
```

## ArkTS / ETS 混编边界

适合放 `.ets` 的内容：

- `@Component` / ArkUI 原生组件。
- Camera/WebView/播放器/地图等复杂生命周期。
- ohpm SDK 官方只提供 ArkTS 示例，UTS 直写不清晰。
- 需要持有 controller/session/listener 的状态机。

UTS 入口负责：

- 校验参数。
- 权限申请。
- 调用 `.ets` helper。
- 把结果转换成普通 DTO。
- 触发 success/fail/complete。

## 常见坑

- 不要把 `.vue` 页面示例照搬到 uni-app x；鸿蒙 App 页面通常是 `.uvue`，如 `pages/index/index.uvue`。
- 不要在页面直接 import ohpm 包。
- 不要在跨端文件顶层 import `@kit.*`，必须放到 `app-harmony` 或 `APP-HARMONY` 条件分支。
- 不要遗漏 `package.json` 里的 `"arkts": true`。
- 不要把插件 API 只实现 `success`，遗漏 `fail` / `complete`。
- 不要让扫描、监听、session、controller 没有关闭方法。
