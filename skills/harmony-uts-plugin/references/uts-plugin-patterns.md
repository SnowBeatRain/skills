# UTS 鸿蒙插件实现模式

## 推荐目录

```text
uni_modules/
└── my-harmony-plugin/
    ├── package.json
    ├── index.uts                    # 可选：统一导出/注册到 uni
    ├── utssdk/
    │   ├── interface.uts            # 类型与 uni 全局接口声明
    │   └── app-harmony/
    │       ├── index.uts            # 鸿蒙实现入口
    │       ├── config.json          # 鸿蒙插件配置
    │       └── NativeHelper.ets     # 可选：复杂 ArkTS/组件/SDK 适配
    └── readme.md
```

`package.json` 中需要为鸿蒙声明 `arkts: true`：

```json
{
  "uni_modules": {
    "uni-ext-api": {
      "uni": {
        "myNativeApi": {
          "name": "myNativeApi",
          "app": {
            "js": false,
            "kotlin": false,
            "swift": false,
            "arkts": true
          }
        }
      }
    }
  }
}
```

## UTS 语法/类型补充

更完整的 UTS 强类型、`interface.uts`、callback/Promise、`UniError`、条件编译、`number`/`Long`/`Double`、JSON 调试和 tree-shaking 注意事项，见 `uts-syntax-and-types.md`。实现鸿蒙插件前如果要写或审查 UTS 代码，应先读取该文件。

## 接口设计

优先用 uni 风格 options：

```ts
export type MyApiSuccess = {
  errMsg: string
  value: string
}

export type MyApiFail = {
  errCode: number
  errMsg: string
}

export type MyApiOptions = {
  param: string
  success?: ((res: MyApiSuccess) => void) | null
  fail?: ((err: MyApiFail) => void) | null
  complete?: ((res: any) => void) | null
}

export interface Uni {
  myNativeApi(options: MyApiOptions): void
}
```

对于新项目，也可以额外提供 Promise 包装，但不要牺牲 uni 风格兼容性。

## app-harmony/index.uts 基础模板

```ts
import { BusinessError } from '@kit.BasicServicesKit'
import { hilog } from '@kit.PerformanceAnalysisKit'
import type { common } from '@kit.AbilityKit'

function getAbilityContext(): common.UIAbilityContext {
  return UTSHarmony.getUIAbilityContext() as common.UIAbilityContext
}

function callFail(options: MyApiOptions, code: number, message: string) {
  const err = { errCode: code, errMsg: message }
  options.fail?.(err)
  options.complete?.(err)
}

function callSuccess(options: MyApiOptions, data: MyApiSuccess) {
  options.success?.(data)
  options.complete?.(data)
}

export function myNativeApi(options: MyApiOptions) {
  try {
    const context = getAbilityContext()
    // 调用 @kit.* API
    callSuccess(options, { errMsg: 'myNativeApi:ok', value: 'ok' })
  } catch (e) {
    const err = e as BusinessError
    callFail(options, err.code ?? 50000, err.message ?? String(e))
  }
}
```

## 错误处理规范

- 对外返回 `{ errCode, errMsg }`。
- `errMsg` 建议形如 `apiName:ok`、`apiName:fail reason`。
- 鸿蒙平台自定义错误码优先用 5xx 段或 `50000+` 项目内编码。
- 捕获 `BusinessError` 时保留 `code` 和 `message`，但不要把内部堆栈直接抛给页面。

DCloud UniError 模式可用于更标准的 uni API 扩展：

```ts
let error = new UniError('myNativeApi', 50001, 'permission denied')
```

## Promise 与 callback 包装

HarmonyOS API 常见三类：同步、Promise、callback。统一入口时建议：

```ts
export function doAsync(options: DoAsyncOptions) {
  nativePromiseCall()
    .then((res) => {
      const data = { errMsg: 'doAsync:ok', data: normalize(res) }
      options.success?.(data)
      options.complete?.(data)
    })
    .catch((err: BusinessError) => {
      const fail = { errCode: err.code, errMsg: err.message }
      options.fail?.(fail)
      options.complete?.(fail)
    })
}
```

## ArkTS / ETS 混编

当出现以下情况，拆 `.ets`：

- 需要 `@Component` / ArkUI 原生组件。
- 生命周期和状态机复杂，如 Camera preview、WebView、地图、播放器。
- 三方 ohpm SDK 只给 ArkTS 示例，UTS 中直接适配不清晰。

结构：

```text
utssdk/app-harmony/
├── index.uts
└── NativeHelper.ets
```

```ts
// index.uts
import { NativeHelper } from './NativeHelper.ets'

export function run(options: RunOptions) {
  NativeHelper.run(options.param)
}
```

## ohpm 依赖

- ohpm 包只能在 UTS 插件 / 鸿蒙原生层中使用，页面不要直接 import。
- 依赖通常配置在生成的鸿蒙工程 `oh-package.json5` 或插件相关配置中，按 DCloud 当前版本要求处理。
- 依赖引入后，要验证 HBuilderX 运行到鸿蒙、云打包/本地打包是否都能解析。

## 条件编译与跨端兜底

如果插件只支持鸿蒙，页面调用时要写清楚兜底：

```ts
// #ifdef APP-HARMONY
import { myNativeApi } from '@/uni_modules/my-harmony-plugin'
myNativeApi({ param: 'x' })
// #endif

// #ifndef APP-HARMONY
uni.showToast({ title: '当前平台暂不支持', icon: 'none' })
// #endif
```

## 验证清单

- [ ] `package.json` 中对应 API 的 `arkts: true`。
- [ ] `utssdk/interface.uts` 类型完整，页面能获得类型提示。
- [ ] `app-harmony/index.uts` 只返回普通对象，不泄漏复杂原生对象。
- [ ] 权限已在 `module.json5` 声明，运行时请求路径已测试。
- [ ] success/fail/complete 都会被正确调用，且 `complete` 只调用一次。
- [ ] 设备不支持、权限拒绝、API 抛错路径有明确错误码。
- [ ] 页面调用处有 `#ifdef APP-HARMONY` 和非鸿蒙兜底。
- [ ] ohpm / 三方 SDK 依赖在 HBuilderX 运行、本地打包或云打包中都可解析。
- [ ] 页面卸载时释放扫描、监听、session、controller。
- [ ] 生成工程 `unpackage/dist/*/app-harmony` 中能看到预期权限、依赖和插件产物；确认后回源头修改，不长期维护生成产物。
