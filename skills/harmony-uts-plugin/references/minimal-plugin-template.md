# 鸿蒙 UTS 插件最小模板

> 用途：给 Agent 一个可复制改造的骨架。真实项目中应按具体 HBuilderX / uni-app x 版本调整字段与导入。

## 目录结构

```text
uni_modules/my-harmony-plugin/
├── package.json
├── index.uts
├── utssdk/
│   ├── interface.uts
│   └── app-harmony/
│       ├── index.uts
│       ├── config.json
│       └── NativeHelper.ets          # 可选
└── readme.md
```

## package.json

```json
{
  "id": "my-harmony-plugin",
  "displayName": "My Harmony Plugin",
  "version": "0.1.0",
  "description": "A HarmonyOS UTS plugin for uni-app x",
  "uni_modules": {
    "uni-ext-api": {
      "uni": {
        "getHarmonyDeviceInfo": {
          "name": "getHarmonyDeviceInfo",
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

## index.uts

```ts
export * from './utssdk/interface.uts'
export { getHarmonyDeviceInfo } from './utssdk/app-harmony/index.uts'
```

如果采用挂载到 `uni.xxx` 的扩展 API，需要确保 `package.json`、`interface.uts` 和实现函数名三处一致。

## utssdk/interface.uts

```ts
export type HarmonyFail = {
  errCode: number
  errMsg: string
}

export type GetHarmonyDeviceInfoSuccess = {
  errMsg: string
  brand?: string | null
  manufacturer?: string | null
  osFullName?: string | null
  sdkApiVersion?: number | null
}

export type GetHarmonyDeviceInfoOptions = {
  success?: ((res: GetHarmonyDeviceInfoSuccess) => void) | null
  fail?: ((err: HarmonyFail) => void) | null
  complete?: ((res: any) => void) | null
}

export interface Uni {
  getHarmonyDeviceInfo(options: GetHarmonyDeviceInfoOptions): void
}
```

## utssdk/app-harmony/index.uts

```ts
import { BusinessError } from '@kit.BasicServicesKit'
import deviceInfo from '@ohos.deviceInfo'
import type { GetHarmonyDeviceInfoOptions, GetHarmonyDeviceInfoSuccess, HarmonyFail } from '../interface.uts'

function callSuccess(options: GetHarmonyDeviceInfoOptions, data: GetHarmonyDeviceInfoSuccess) {
  options.success?.(data)
  options.complete?.(data)
}

function callFail(options: GetHarmonyDeviceInfoOptions, code: number, message: string) {
  const err: HarmonyFail = {
    errCode: code,
    errMsg: `getHarmonyDeviceInfo:fail ${message}`
  }
  options.fail?.(err)
  options.complete?.(err)
}

export function getHarmonyDeviceInfo(options: GetHarmonyDeviceInfoOptions) {
  try {
    callSuccess(options, {
      errMsg: 'getHarmonyDeviceInfo:ok',
      brand: deviceInfo.brand,
      manufacturer: deviceInfo.manufacturer,
      osFullName: deviceInfo.osFullName,
      sdkApiVersion: deviceInfo.sdkApiVersion
    })
  } catch (e) {
    const err = e as BusinessError
    callFail(options, err.code ?? 50000, err.message ?? String(e))
  }
}
```

> 注意：不同 HarmonyOS SDK 版本对 `deviceInfo` 的导入路径可能不同；若当前 SDK 支持 `@kit.BasicServicesKit` 下的导入形式，优先按当前官方文档更新。

## 示例页面 pages/index/index.uvue

```vue
<template>
  <view class="page">
    <button @click="onGetInfo">获取鸿蒙设备信息</button>
    <text>{{ resultText }}</text>
  </view>
</template>

<script setup lang="uts">
import { ref } from 'vue'
// #ifdef APP-HARMONY
import { getHarmonyDeviceInfo } from '@/uni_modules/my-harmony-plugin'
// #endif

const resultText = ref('')

function onGetInfo() {
  // #ifdef APP-HARMONY
  getHarmonyDeviceInfo({
    success: (res) => {
      resultText.value = JSON.stringify(res)
    },
    fail: (err) => {
      resultText.value = JSON.stringify(err)
    }
  })
  // #endif

  // #ifndef APP-HARMONY
  uni.showToast({ title: '当前平台暂不支持', icon: 'none' })
  // #endif
}
</script>

<style>
.page {
  padding: 24rpx;
}
</style>
```

## 权限型 API 改造点

如果模板要改造成相机、定位、蓝牙、通知等权限型 API：

1. 在 `harmony-configs/entry/src/main/module.json5` 或 DCloud 当前要求的源头声明权限。
2. 在调用原生能力前执行运行时权限申请。
3. 将拒权、不再询问、设置页返回仍拒绝都映射成 `fail`。
4. 不要在插件 import 或应用启动时批量申请权限。

## 订阅型 API 改造点

如果模板要改造成 BLE 扫描、NFC 发现、传感器监听：

```ts
startXxx(options)
stopXxx()
onXxxChange(callback)
offXxxChange(callback?)
```

- 用 `Set` 或等价结构管理回调，避免重复注册。
- `stop/off` 支持幂等调用。
- 页面 `onUnload` 必须释放资源。
