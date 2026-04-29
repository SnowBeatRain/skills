# 鸿蒙适配与迁移实战

> 相关文档：`references/harmony-basics.md`（基础与快速参考）、`references/harmony-development.md`（核心开发）、`references/harmony-advanced.md`（进阶功能与发布）

---

## 一、日常开发鸿蒙适配指南

本节是日常写代码时的鸿蒙适配速查手册。写每一行代码时，如果项目需要适配鸿蒙，请对照以下规则。

### 1.1 运行时平台检测

```js
const { osName } = uni.getSystemInfoSync()
const isHarmony = osName === 'harmonyos'

// 用于 UI 差异化渲染
if (isHarmony) {
  // 鸿蒙特有逻辑
}
```

**注意：** `uniPlatform` 在鸿蒙上返回 `app`（与 Android/iOS 相同），不能用来区分；必须用 `osName`。

### 1.2 API 兼容性速查表

**必须条件编译规避（鸿蒙不支持）：**

| API / 组件 | 状态 | 替代方案 |
|-----------|------|---------|
| `plus.*` 全部 | 不支持 | 统一使用 `uni.*` API |
| `uni.vibrateShort` / `uni.vibrateLong` / `uni.vibrate` | 不支持 | 条件编译跳过 |
| `uni.createAnimation` | 不支持 | CSS transition/animation 替代 |
| `uni.shareWithSystem` | 不支持 | 条件编译跳过 |
| `uni.configMTLS` | 不支持 | 条件编译跳过 |
| 蓝牙（经典 + BLE）| 不支持 | 条件编译跳过或通过 UTS 插件实现 |
| Wi-Fi API | 不支持（元服务） | 条件编译跳过 |
| `<camera>` 组件 | 不支持 | 用 `uni.chooseImage` / `uni.chooseVideo` |
| `<ad>` 组件 | 不支持 | `<!-- #ifndef APP-HARMONY -->` 规避 |
| `<list>` 组件 | 不支持（nvue 专属） | 用 `<scroll-view>` 替代 |

**需要额外权限的 API：**

| API | 所需权限 | 权限类型 |
|-----|---------|---------|
| `uni.onNetworkStatusChange` / `uni.getNetworkType` | `ohos.permission.GET_NETWORK_INFO` | system_grant（自动） |
| `uni.chooseImage`（访问相册） | `ohos.permission.READ_IMAGEVIDEO` | ACL（需华为审批） |
| `uni.setClipboardData` / `uni.getClipboardData` | `ohos.permission.READ_PASTEBOARD` | ACL（需华为审批） |
| `uni.getLocation` | `ohos.permission.APPROXIMATELY_LOCATION` + `ohos.permission.LOCATION`（**必须成对**） | user_grant |
| `uni.addPhoneContact` | `ohos.permission.WRITE_CONTACTS` | ACL（需华为审批） |

**有使用限制的 API：**

| API | 限制 |
|-----|------|
| `uni.request` | 大 JSON 时设 `dataType` 非默认值，手动 `JSON.parse` |
| `uni.navigateTo` 的 EventChannel | 不支持 `events` + `eventChannel` 页面通信 |
| `uni.getLocation` | 鸿蒙 5 用系统定位（无第三方依赖）；鸿蒙 4.x 需第三方 SDK |
| `uni.chooseLocation` | 仅腾讯地图；不支持安全网络，直接用 manifest.json key |
| `uni.share`（4.77+）| 图片 ≤ 100KB、视频 ≤ 64KB、标题 ≤ 512B、摘要 ≤ 1024B |
| `uni.setScreenBrightness` / `uni.getScreenBrightness` | 需 HBuilderX 4.81+ |
| video `requestFullScreen` | 不支持 `{direction}` 参数 |
| `<map>` 组件 | 仅腾讯地图（WebView 渲染）；华为花瓣地图需 UTS 插件 |

### 1.3 条件编译写法模板

**JS/TS 中（最常用）：**

```js
// 鸿蒙专属逻辑
// #ifdef APP-HARMONY
import { something } from '@/uni_modules/harmony-plugin'
// #endif

// 非鸿蒙逻辑（Android + iOS）
// #ifndef APP-HARMONY
plus.push.createMessage('title', 'content')
// #endif

// 所有 App 平台（含鸿蒙）
// #ifdef APP
uni.showToast({ title: 'hello' })
// #endif

// 仅 Android + iOS（不含鸿蒙）
// #ifdef APP-PLUS
const nativeResult = plus.bridge.exec(...)
// #endif

// 多平台组合
// #ifdef APP-PLUS || MP-WEIXIN
// Android/iOS + 微信小程序
// #endif
```

**Vue Template 中：**

```html
<!-- 鸿蒙用自定义导航栏 -->
<!-- #ifdef APP-HARMONY -->
<custom-navbar :title="title" />
<!-- #endif -->

<!-- 非鸿蒙用原生导航栏按钮 -->
<!-- #ifndef APP-HARMONY -->
<!-- app-plus:titleNView 配置 -->
<!-- #endif -->

<!-- 广告组件规避 -->
<!-- #ifndef APP-HARMONY -->
<ad unit-id="xxx" />
<!-- #endif -->

<!-- 振动反馈规避 -->
<!-- #ifndef APP-HARMONY -->
<button @click="vibrate">振动</button>
<!-- #endif -->
```

**CSS 中：**

```css
/* 鸿蒙特有样式 */
/* #ifdef APP-HARMONY */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
/* #endif */

/* 非鸿蒙样式 */
/* #ifndef APP-HARMONY */
.plus-only {
  /* Android/iOS 专属样式 */
}
/* #endif */
```

**pages.json 中：**

```json
{
  "pages": [
    // #ifdef APP-HARMONY
    { "path": "pages/harmony/permission", "style": { "navigationBarTitleText": "权限管理" } },
    // #endif
    { "path": "pages/index/index" }
  ],
  "globalStyle": {
    "navigationBarTitleText": "MyApp",
    "app-harmony": {
      "softinputMode": "adjustResize"
    }
  }
}
```

### 1.4 pages.json 鸿蒙专属配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "app-harmony": {
          "softinputMode": "adjustResize"
        }
      }
    }
  ]
}
```

`app-harmony` 支持的属性：
| 属性 | 值 | 说明 |
|------|---|------|
| `softinputMode` | `adjustResize` / `adjustPan` | 键盘弹出时页面调整方式 |

### 1.5 manifest.json 鸿蒙配置

```json
{
  "app-harmony": {
    "bundleName": "com.example.app",
    "icons": {
      "foreground": "static/icon-foreground.png",
      "background": "static/icon-background.png"
    },
    "splashScreens": {
      "startWindowBackground": "#FFFFFF",
      "startWindowIcon": "static/splash-icon.png"
    },
    "safearea": {
      "background": "#ffffff",
      "backgroundDark": "#1a1a1a",
      "bottom": { "offset": "none" }
    },
    "darkmode": true,
    "themeLocation": "theme.json",
    "useragent": {
      "value": "uni-app",
      "concatenate": true
    }
  }
}
```

**与 app-plus 的关键差异：**
- 图标需要 **前景 + 背景两张** 分层图片（1024x1024px），非单个图标
- 安全区在 `app-harmony.safearea` 下单独配置
- 暗黑模式在 `app-harmony.darkmode` 中单独控制

### 1.6 导航栏适配

鸿蒙**不支持** `app-plus.titleNView`（原生导航栏按钮）。需要自定义导航栏：

```vue
<template>
  <view class="page">
    <!-- #ifdef APP-HARMONY -->
    <custom-navbar title="页面标题" />
    <!-- #endif -->

    <!-- 页面内容 -->
  </view>
</template>
```

pages.json 中关闭鸿蒙原生导航栏（使用自定义时）：

```json
{
  "path": "pages/detail/detail",
  "style": {
    // #ifdef APP-HARMONY
    "navigationStyle": "custom"
    // #endif
  }
}
```

### 1.7 WebView 通信适配

```vue
<template>
  <web-view :src="url" @message="onMessage" id="web"></web-view>
</template>

<script setup>
// #ifdef APP-HARMONY
const webviewCtx = uni.createWebviewContext('web')

const callWebView = (fn, ...args) => {
  webviewCtx.evalJs(`${fn}(${args.map(a => JSON.stringify(a)).join(',')})`)
}
// #endif

// #ifndef APP-HARMONY
const callWebView = (fn, ...args) => {
  const wv = plus.webview.currentWebview()
  wv.evalJS(`${fn}(${args.map(a => JSON.stringify(a)).join(',')})`)
}
// #endif
</script>
```

### 1.8 页面通信适配（EventChannel 不可用）

鸿蒙不支持 `navigateTo` 的 `events` + `eventChannel`，需改用全局事件：

```js
// 发送方
uni.navigateTo({ url: '/pages/edit/edit' })
uni.$emit('editData', data)

// 接收方（edit 页面）
import { onLoad, onUnload } from '@dcloudio/uni-app'

onLoad(() => {
  uni.$on('editData', (data) => { /* 处理 */ })
})

// 完成后回传
uni.$emit('editResult', result)
uni.navigateBack()

// 发送方监听结果
onShow(() => {
  uni.$on('editResult', (result) => { /* 处理 */ })
})
onUnload(() => {
  uni.$off('editResult')
})
```

### 1.9 地图适配

```vue
<template>
  <!-- 鸿蒙仅支持腾讯地图 -->
  <map
    :latitude="lat"
    :longitude="lng"
    :markers="markers"
  />
</template>
```

manifest.json 配置腾讯地图 key：

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "maps": {
          "qqmap": { "key": "YOUR_TENCENT_MAP_KEY" }
        }
      }
    }
  }
}
```

**注意：** 申请腾讯地图 key 时域名白名单留空（鸿蒙通过 WebView 加载地图）。

### 1.10 定位权限适配

鸿蒙定位权限必须 **精确+粗略成对声明**：

```json5
// harmony-configs/entry/src/main/module.json5
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.APPROXIMATELY_LOCATION" },
      { "name": "ohos.permission.LOCATION" }
    ]
  }
}
```

代码中申请定位：

```js
// #ifdef APP-HARMONY
// 通过 UTS 插件请求权限（见第三节）
// #endif

uni.getLocation({
  type: 'gcj02',
  success(res) { /* res.latitude, res.longitude */ }
})
```

### 1.11 NVUE 页面在鸿蒙上的差异

```
鸿蒙上 nvue 不走原生渲染，走 Web 渲染（自动注入兼容样式）
这意味着：
- Android/iOS 上 nvue 的 flex-only 限制在鸿蒙上不存在
- nvue 的 CSS 子集在鸿蒙上实际可用完整 CSS
- 但也失去了 nvue 的原生渲染性能优势
```

**适配策略：** 如果 nvue 页面是冲着原生性能来的，鸿蒙上可能需要用 uvue 页面（uni-app x）。

### 1.12 网络请求大 JSON 适配

```js
// #ifdef APP-HARMONY
// 鸿蒙上大 JSON 需手动解析
const [err, res] = await uni.request({
  url: '/api/bigdata',
  dataType: 'text'  // 不自动解析
})
if (!err) {
  const data = JSON.parse(res.data)
  // 使用 data
}
// #endif

// #ifndef APP-HARMONY
const [err, res] = await uni.request({
  url: '/api/bigdata'
  // dataType 默认 json，自动解析
})
// #endif
```

### 1.13 分享适配

```js
// #ifdef APP-HARMONY
// 鸿蒙分享有大小限制
uni.share({
  provider: 'harmony',
  type: 0, // 文字
  title: title.substring(0, 512),     // 标题最大 512 字节
  summary: summary.substring(0, 1024), // 摘要最大 1024 字节
  href: url,
  success() { },
  fail() { }
})
// #endif
```

### 1.14 静态资源适配

```
static/
├── app-harmony/        鸿蒙 App 专属资源
│   └── splash.png      （如鸿蒙需要不同的启动图）
├── app-plus/           Android/iOS 专属资源
│   └── splash.png
├── mp-harmony/         鸿蒙元服务专属资源
└── common.png          所有平台共用
```

### 1.15 UA 检测适配

如果你的代码通过 UA 判断平台，需要加上鸿蒙：

```js
const systemInfo = uni.getSystemInfoSync()
// 错误写法（漏了鸿蒙）
const isAndroid = systemInfo.platform === 'android'

// 正确写法
const osName = systemInfo.osName // 'ios' | 'android' | 'harmonyos'
```

### 1.16 新项目默认适配模板

创建新项目时，建议在以下位置做好鸿蒙默认适配：

**App.vue：**

```vue
<script>
export default {
  onLaunch() {
    // #ifdef APP-HARMONY
    console.log('鸿蒙平台启动')
    // 初始化鸿蒙特有的逻辑
    // #endif
  }
}
</script>
```

**manifest.json 模板：**

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "maps": { "qqmap": { "key": "" } }
      }
    }
  },
  "app-harmony": {
    "bundleName": "",
    "icons": {
      "foreground": "",
      "background": ""
    },
    "splashScreens": {
      "startWindowBackground": "#FFFFFF"
    },
    "safearea": {
      "background": "#ffffff",
      "bottom": { "offset": "none" }
    }
  }
}
```

**utils/platform.js（推荐创建）：**

```js
/**
 * 平台检测工具
 * 在所有需要平台判断的地方使用，避免硬编码
 */
const info = uni.getSystemInfoSync()

export const isHarmony = info.osName === 'harmonyos'
export const isIOS = info.osName === 'ios'
export const isAndroid = info.osName === 'android'
export const isApp = !!info.appBaseInfo // App 平台（含鸿蒙）

/**
 * 安全振动（鸿蒙不支持振动 API）
 */
export function safeVibrate(type = 'short') {
  // #ifndef APP-HARMONY
  if (type === 'short') uni.vibrateShort()
  else uni.vibrateLong()
  // #endif
}

/**
 * 安全 Webview 通信
 */
export function getWebviewBridge() {
  // #ifdef APP-HARMONY
  return {
    evalJs(id, code) {
      uni.createWebviewContext(id).evalJs(code)
    }
  }
  // #endif
  // #ifdef APP-PLUS
  return {
    evalJs(id, code) {
      plus.webview.currentWebview().evalJS(code)
    }
  }
  // #endif
}
```

---

## 二、老项目适配鸿蒙实战方案

本节是给**现有老项目**做鸿蒙适配的完整实战指南，按阶段拆解，包含每一步的经验和坑。

### 2.1 适配前评估清单

在动手之前，先评估项目鸿蒙适配的难度等级：

| 评估项 | 低风险 | 高风险 |
|--------|--------|--------|
| Vue 版本 | Vue3 | **Vue2（必须先迁移 Vue3）** |
| `plus.*` 使用量 | 零星几处 | **大量使用（工作量翻倍）** |
| nvue 页面数 | 0-2 个 | **大量 nvue 且依赖原生组件** |
| subNVue 子窗体 | 无 | **有（鸿蒙不支持）** |
| titleNView 自定义按钮 | 无 | **有（鸿蒙不支持）** |
| 原生插件 | 无 / 纯 JS 插件 | **有 Android/iOS 原生插件（需重写 UTS）** |
| 地图 | 无 / 腾讯地图 | **高德/百度/Google 地图（需切换）** |
| 蓝牙/Wi-Fi | 无 | **有（鸿蒙不支持，需 UTS 插件重实现）** |
| 条件编译 | `APP-PLUS` 为主 | **大量 `APP-PLUS`（鸿蒙不匹配，需逐条改）** |

**难度评级：**
- 低（0-2 高风险）：1-2 周
- 中（3-4 高风险）：2-4 周
- 高（5+ 高风险）：1-2 月 + 需评估可行性

### 2.2 阶段一：前置条件准备

#### 1. Vue2 → Vue3 迁移（如果是 Vue2 项目）

鸿蒙**仅支持 Vue3**，这是硬性前置条件，没有绕过的可能。

**主要改动点：**

```js
// 1. main.js 重写
// Vue2:
import Vue from 'vue'
import App from './App'
Vue.use(Pinia)
const app = new Vue({ ...App })
app.$mount()

// Vue3:
import { createSSRApp } from 'vue'
import App from './App.vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia)
  return { app }
}
```

```js
// 2. 环境变量
// Vue2: process.env.VUE_APP_XXX → Vue3: import.meta.env.VITE_XXX

// 3. 全局属性
// Vue2: Vue.prototype.$http = http → Vue3: app.config.globalProperties.$http = http

// 4. v-model
// Vue2: props.value + $emit('input') → Vue3: props.modelValue + $emit('update:modelValue')

// 5. 生命周期
// destroyed → unmounted, beforeDestroy → beforeUnmount

// 6. 过滤器移除
// {{ date | formatDate }} → {{ formatDate(date) }}

// 7. 事件修饰符
// @click.native → @click（组件需声明 emits）

// 8. 插槽语法
// <template slot="xxx"> → <template #xxx>
```

**坑：** Vue2 迁移 Vue3 时 Promise 处理行为变化 —— Vue3 中 `uni.xxx()` 的失败走 `.catch()` 而不是 `.then()` 的第二个参数。

```js
// Vue2 风格（仍然可用但注意行为差异）
uni.request({
  url: '/api/test',
  success(res) { /* 成功 */ },
  fail(err) { /* 失败 */ }
})

// 推荐写法（Vue3 + uni-app）
const [err, res] = await uni.request({ url: '/api/test' })
if (!err) { /* 成功 */ }
```

#### 2. 创建 index.html

Vue3 项目**必须在根目录创建 index.html**：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
    <!--preload-links-->
    <!--app-context-->
  </head>
  <body>
    <div id="app"><!--app-html--></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```

#### 3. HBuilderX 版本升级

建议升级到 **HBuilderX 4.81+**（获得完整鸿蒙支持）：
- 4.81+ JSVM 逻辑层在子线程（不卡主线程）
- 4.81+ 元服务支持热重载
- 4.61+ uni-app x 鸿蒙 + 调试
- 4.31+ JSVM 架构（API 行为正确）

### 2.3 阶段二：`plus.*` API 全面排查与替换

这是老项目适配鸿蒙**最大的工作量来源**。`plus` 对象在鸿蒙上完全不可用。

**全局搜索排查：**

```
搜索关键字: "plus.", "plus ", "plus webview", "plus.os", "plus.runtime"
           "plus.push", "plus.share", "plus.payment", "plus.oauth"
           "plus.navigator", "plus.screen", "plus.storage", "plus.io"
           "plus.camera", "plus.gallery", "plus.audio", "plus.video"
           "plus.geolocation", "plus.bluetooth", "plus.key"
```

**替换方案对照表：**

| plus API | 鸿蒙替代方案 | 需条件编译 |
|----------|-------------|-----------|
| `plus.webview.currentWebview()` | `uni.createWebviewContext(id)` | 是 |
| `plus.webview.evalJS()` | `webviewCtx.evalJs()` | 是 |
| `plus.runtime.version` | `uni.getAppBaseInfo().appVersion` | 是 |
| `plus.runtime.channel` | 无直接替代，需自行实现 | 是 |
| `plus.push.*` | `uni.*PushMessage()` / `uni.getPushClientId()` | 否（uni API 全平台） |
| `plus.share.*` | `uni.share()` | 否 |
| `plus.payment.*` | `uni.requestPayment()` | 否 |
| `plus.oauth.*` | `uni.login()` / `uni.getUserInfo()` | 否 |
| `plus.navigator.*` | `uni.setNavigationBarTitle()` 等 | 否 |
| `plus.screen.*` | `uni.getSystemInfoSync()` | 否 |
| `plus.storage.*` | `uni.setStorage()` / `uni.getStorage()` | 否 |
| `plus.io.*` | `uni.getFileSystemManager()` | 否 |
| `plus.gallery.*` | `uni.chooseImage()` / `uni.chooseFile()` | 否 |
| `plus.geolocation.*` | `uni.getLocation()` | 否 |
| `plus.key.addEventListener()` | `onBackPress` 页面生命周期 | 否 |
| `plus.camera.*` | `uni.chooseImage()` / `uni.chooseVideo()` | 否 |
| `plus.bluetooth.*` | **无替代**（鸿蒙不支持蓝牙 API） | 跳过 |
| `plus.android.*` / `plus.ios.*` | UTS 插件 | 重写 |

**替换模板：**

```js
// --- plus.webview 替换 ---

// 旧代码
const wv = plus.webview.currentWebview()
wv.evalJS('callback("data")')
wv.back()

// 新代码（兼容鸿蒙）
function evalWebviewJs(webviewId, code) {
  // #ifdef APP-HARMONY
  uni.createWebviewContext(webviewId).evalJs(code)
  // #endif
  // #ifdef APP-PLUS
  plus.webview.currentWebview().evalJS(code)
  // #endif
}
```

```js
// --- plus.runtime 替换 ---

// 旧代码
const version = plus.runtime.version
const channel = plus.runtime.channel

// 新代码
const appInfo = uni.getAppBaseInfo()
const version = appInfo.appVersion
// channel 需自行实现（如通过 manifest.json 或环境变量）
```

### 2.4 阶段三：条件编译全面修正

老项目中大量 `APP-PLUS` 条件编译**不会在鸿蒙上生效**。这是极易遗漏的坑。

**必须全局搜索并逐条检查：**

```
搜索: "#ifdef APP-PLUS", "#ifndef APP-PLUS", "APP-PLUS"
```

**常见错误模式与修正：**

```js
// ❌ 错误：APP-PLUS 不包含鸿蒙，鸿蒙上这段代码不执行
// #ifdef APP-PLUS
someNativeFunction()
// #endif

// ✅ 修正方案 A：如果鸿蒙也需要执行
// #ifdef APP
someNativeFunction()
// #endif

// ✅ 修正方案 B：如果鸿蒙需要不同的实现
// #ifdef APP-PLUS
plusNativeFunction()
// #endif
// #ifdef APP-HARMONY
harmonyNativeFunction()
// #endif

// ✅ 修正方案 C：如果鸿蒙不需要这个功能
// 不用改，APP-PLUS 自动排除了鸿蒙
```

**特别注意 `#ifndef APP-PLUS`：**

```js
// ❌ 错误：这段代码在鸿蒙上会执行（因为 APP-PLUS 不包含鸿蒙）
// #ifndef APP-PLUS
console.log('非 App 平台') // 鸿蒙上也会执行这行！
// #endif

// ✅ 如果真的只想在小程序和 H5 执行
// #ifdef H5 || MP
console.log('仅 H5 和小程序')
// #endif
```

### 2.5 阶段四：不支持功能逐一排查

#### 4.1 subNVue（子窗体）→ 完全不支持

```
搜索: "subnvue", "subNVue", "getSubNVueById", "getCurrentSubNVue"
```

**替代方案：**
- 使用 Vue 组件替代子窗体浮层
- 使用 `<cover-view>` + `<cover-image>` 覆盖原生组件
- 使用固定定位的弹窗组件

```vue
<!-- 旧：subNVue 方案（鸿蒙不可用） -->
<!-- 在 pages.json 中配置 subNVues -->

<!-- 新：Vue 组件方案 -->
<template>
  <view class="page">
    <map />
    <!-- 用 Vue 组件覆盖在 map 之上 -->
    <cover-view class="overlay">
      <cover-view class="btn" @click="handleClick">操作</cover-view>
    </cover-view>
  </view>
</template>
```

#### 4.2 titleNView（原生导航栏按钮）→ 不支持

```
搜索: "titleNView", "titleImage", "searchInput", "buttons"
```

**替代方案：** 自定义导航栏组件

```json
// pages.json 关闭原生导航栏
{
  "path": "pages/detail/detail",
  "style": {
    // #ifdef APP-HARMONY
    "navigationStyle": "custom"
    // #endif
  }
}
```

```vue
<!-- 自定义导航栏 -->
<template>
  <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="navbar-inner" :style="{ height: navBarHeight + 'px' }">
      <view class="navbar-left" @click="goBack">
        <text class="icon-back">&#xe600;</text>
      </view>
      <text class="navbar-title">{{ title }}</text>
      <view class="navbar-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>
```

#### 4.3 nvue 原生组件 → 鸿蒙全部降级为 Web 渲染

```
搜索: "<list", "<cell", "<waterfall", "<recycle-list", "<refresh", "<barcode"
```

这些 nvue 专用组件在鸿蒙上**全部不可用**：

| 组件 | 替代方案 |
|------|---------|
| `<list>` + `<cell>` | `<scroll-view>` + `v-for` |
| `<waterfall>` | CSS columns / 第三方瀑布流组件 |
| `<recycle-list>` | `<scroll-view>` + 手动虚拟列表 |
| `<refresh>` | `scroll-view` 的 `refresher-enabled` |
| `<barcode>` | 条件编译跳过或用图片替代 |

```vue
<!-- 旧：nvue 原生列表 -->
<!-- <list> <cell v-for="item in list"> ... </cell> </list> -->

<!-- 新：跨平台兼容 -->
<scroll-view
  scroll-y
  style="flex: 1"
  :refresher-enabled="true"
  :refresher-triggered="refreshing"
  @refresherrefresh="onRefresh"
  @scrolltolower="loadMore"
>
  <view v-for="item in list" :key="item.id">
    <!-- 列表项 -->
  </view>
  <uni-load-more :status="loadStatus" />
</scroll-view>
```

#### 4.4 振动 API → 不支持

```
搜索: "vibrateShort", "vibrateLong", "uni.vibrate"
```

直接用条件编译包裹，鸿蒙上跳过：

```js
// #ifndef APP-HARMONY
uni.vibrateShort()
// #endif
```

#### 4.5 EventChannel 页面通信 → 不支持

```
搜索: "eventChannel", "events:", "onEvent"
```

改用全局事件：

```js
// 旧：EventChannel
uni.navigateTo({
  url: '/pages/edit/edit',
  events: { result: (data) => { /* 处理 */ } },
  success: (res) => res.eventChannel.emit('init', data)
})

// 新：全局事件
uni.$emit('editInit', data)
uni.navigateTo({ url: '/pages/edit/edit' })

// 编辑页
onLoad(() => {
  uni.$on('editInit', (data) => { /* 处理 */ })
})
// 完成后
uni.$emit('editResult', result)
uni.navigateBack()
```

#### 4.6 广告组件 → 暂不支持

```
搜索: "<ad", "uni.createAd"
```

```html
<!-- #ifndef APP-HARMONY -->
<ad unit-id="xxx" ad-intervals="30" />
<!-- #endif -->
```

#### 4.7 一键登录特有样式 → 部分不支持

```
搜索: "univerifyStyle", "onButtonsClick", "offButtonsClick"
```

`univerifyStyle` 和 `onButtonsClick/offButtonsClick` 在鸿蒙上不可用。改用 `getUniverifyManager`。

### 2.6 阶段五：地图与定位适配

如果老项目用了高德/百度地图：

```
搜索: "amap", "baidu", "高德", "百度地图", "amapKey", "baiduKey"
```

**必须切换到腾讯地图**（鸿蒙唯一支持）：

1. 申请腾讯地图 key（域名白名单**留空**）
2. manifest.json 配置：
```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "maps": { "qqmap": { "key": "YOUR_KEY" } }
      }
    }
  }
}
```
3. 地图组件不需要改（`<map>` API 统一），但地图样式/功能可能有差异需测试

**定位权限：** 鸿蒙必须成对声明精确+粗略权限（见 1.10）。

### 2.7 阶段六：原生插件适配

如果老项目用了 Android/iOS 原生插件（非 UTS）：

```
搜索: "nativePlugins", "nativeplug", ".aar", ".framework"
```

**这类插件在鸿蒙上完全不可用，必须用 UTS 插件重写。**

路径：
1. 创建 UTS 插件目录 `uni_modules/xxx/utssdk/app-harmony/`
2. `package.json` 中设置 `"arkts": true`
3. 用 ArkTS 重写原有原生逻辑
4. 如需调用鸿蒙第三方库，通过 ohpm 安装后在 UTS 插件中 import

### 2.8 阶段七：Release 模式特殊坑

**Composition API + Release 模式会崩溃：**

```
错误信息：Cannot read property route of undefined
```

这是 ArkTS 代码混淆导致的 bug。在鸿蒙项目中添加禁用混淆规则：

```
// harmony-configs/entry/src/main/obfuscation-rules.txt
-disable-obfuscation
```

### 2.9 阶段八：项目路径清理

鸿蒙工具链对路径有严格要求：

```
❌ 项目路径含中文：E:\我的项目\myApp
❌ 项目路径含特殊字符：E:\my-app (1)\myApp
❌ 项目路径过长：超过 ~110 字符
❌ 用户目录含中文：C:\Users\张三\.ohos\

✅ 正确：D:\projects\my-app
```

**坑：** 如果 Windows 用户名是中文，自动生成的证书会存在 `C:\Users\中文用户名\.ohos\config` 下，可能导致问题。建议修改 `.ohos` 目录位置或创建新的 Windows 用户。

### 2.10 白屏/闪退排查

如果鸿蒙上安装后白屏或闪退：

**官方推荐二分法排查：**
1. 在 pages.json 中注释掉一半页面
2. 如果不崩了，问题在被注释的那一半里
3. 继续二分，直到定位到具体页面
4. 检查该页面使用的不支持组件/API

**常见闪退原因：**
- 使用了 `<list>`/`<waterfall>` 等 nvue 组件
- JS 层直接调用了鸿蒙原生接口（需通过 UTS 插件）
- 条件编译遗漏导致鸿蒙执行了不兼容的代码

### 2.11 完整适配工作流

```
第1周：评估 + 前置准备
  ├── 评估项目难度等级（见 2.1 清单）
  ├── Vue2 → Vue3 迁移（如需要）
  ├── 升级 HBuilderX 到 4.81+
  └── 安装 DevEco Studio，配置鸿蒙运行环境

第2周：核心代码适配
  ├── 全局搜索 plus.* 并替换（最大工作量）
  ├── 全局搜索 APP-PLUS 条件编译并修正
  ├── 处理不支持的 API（振动、EventChannel、蓝牙等）
  └── 处理不支持的组件（list、camera、ad 等）

第3周：UI 与功能适配
  ├── subNVue → Vue 组件替代
  ├── titleNView → 自定义导航栏
  ├── 地图/定位切换到腾讯地图
  ├── 原生插件用 UTS 重写（如需要）
  └── WebView 通信方式改写

第4周：测试与修复
  ├── 鸿蒙真机/模拟器全功能测试
  ├── 修复白屏/闪退问题
  ├── 添加 Release 模式禁用混淆规则
  ├── 签名证书配置
  └── 构建发布版本
```

### 2.12 经验总结：Top 20 坑

| # | 坑 | 表现 | 解决 |
|---|---|------|------|
| 1 | Vue2 项目直接跑鸿蒙 | 编译报错或运行崩溃 | 必须先迁 Vue3 |
| 2 | `plus.*` 调用 | 鸿蒙直接报 "plus is not defined" | 全部替换为 uni API + 条件编译 |
| 3 | `APP-PLUS` 条件编译以为包含鸿蒙 | 鸿蒙上平台特有功能不执行 | 改为 `APP` 或 `APP-HARMONY` |
| 4 | `#ifndef APP-PLUS` 鸿蒙会执行 | 非预期的代码在鸿蒙上运行 | 逐条检查逻辑是否正确 |
| 5 | nvue 的 `<list>` 组件 | 白屏/崩溃 | 改为 `<scroll-view>` |
| 6 | subNVue 子窗体 | API 返回 undefined | 用 Vue 组件替代 |
| 7 | titleNView 导航栏按钮 | 按钮不显示 | 自定义导航栏 |
| 8 | EventChannel 传参 | 页面间数据丢失 | 改用 `uni.$emit/$on` |
| 9 | 高德/百度地图 | 地图不显示 | 切腾讯地图 |
| 10 | 蓝牙功能 | API 报错 | 无解，需 UTS 插件或砍功能 |
| 11 | `uni.vibrateShort` | API 报错 | 条件编译跳过 |
| 12 | 路径含中文 | 构建失败/签名失败 | 改英文路径 |
| 13 | Release 模式白屏 | "Cannot read property route of undefined" | 加 `-disable-obfuscation` |
| 14 | 相册权限 `READ_IMAGEVIDEO` | `chooseImage` 失败 | ACL 权限需华为审批 |
| 15 | 剪贴板权限 `READ_PASTEBOARD` | `getClipboardData` 失败 | ACL 权限需华为审批 |
| 16 | 定位只申请了一个权限 | 应用商店审核被拒 | 必须 APPROXIMATELY + LOCATION 成对 |
| 17 | 签名证书不匹配 | "bundleName 与签名证书不符" | 确认三处 bundleName 一致 |
| 18 | x86 模拟器（4.31-4.50） | 应用无法安装 | 用 arm64 真机或 API 19+ 模拟器 |
| 19 | 大 JSON 请求解析失败 | 数据显示异常 | 设 `dataType: 'text'` 手动 parse |
| 20 | `osName` 检测遗漏鸿蒙 | 平台判断逻辑走错分支 | 检查 `=== 'harmonyos'` |

---

## 三、架构师深度实战笔记

> 以下内容来自真实生产环境适配经验，涵盖官方文档未明说的架构决策、性能调优、生态兼容、审核被拒、团队协作等维度。

### 3.1 架构决策：uni-app 还是 uni-app x 做鸿蒙？

这是项目启动前最重要的决策，做错了后期要推倒重来。

| 维度 | uni-app（传统） | uni-app x |
|------|---------------|-----------|
| 鸿蒙渲染 | **WebView**（JSVM + WebView） | **原生渲染**（uvue 引擎） |
| 性能天花板 | 中等（WebView 有 Bridge 开销） | 高（同层运行，无 Bridge） |
| 生态成熟度 | 成熟，大量现成插件 | 仍在完善，插件需 UTS 重写 |
| 学习成本 | 低，标准 Vue3 | 中，需学 UTS 强类型 |
| 鸿蒙 API 调用 | 必须通过 UTS 插件桥接 | 可直接在页面用 UTS 调用 |
| 适合场景 | 存量项目适配鸿蒙、业务型 App | **新项目** + 性能敏感场景 |
| 鸿蒙最低版本 | API 12+ | API 14+ |

**决策建议：**
- 老项目适配鸿蒙 → **必须用 uni-app**（迁移到 uni-app x 成本过高）
- 新项目且鸿蒙是核心目标 → **优先考虑 uni-app x**
- 团队只有 JS 经验 → uni-app
- 团队有 Kotlin/Swift/ArkTS 经验 → uni-app x

### 3.2 JSVM 深度解析（4.31+）

理解 JSVM 对写出正确的鸿蒙代码至关重要。

**架构图：**

```
┌─────────────────────────────────────────────────────┐
│                    Harmony App                       │
│                                                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   主线程 (ArkTS)   │    │   子线程 (JSVM) 4.81+  │ │
│  │                    │    │                        │ │
│  │  UTS 插件代码      │    │  Vue 框架              │ │
│  │  原生组件          │    │  业务 JS/TS 代码        │ │
│  │  defineNativeEmbed │    │  uni.* API 调用         │ │
│  │                    │    │                        │ │
│  └────────┬───────────┘    └───────────┬────────────┘ │
│           │                            │              │
│           │      Bridge 通信            │              │
│           └────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

**JSVM 对业务代码的影响：**

```js
// JSVM 运行标准 JS，之前在 ArkTS 下有问题的代码现在能正常工作了
// 但这也意味着：

// 1. 不能直接调用鸿蒙原生 API（JSVM 环境内没有 @kit.XXX）
// ❌ 直接在页面 JS 中写
import { something } from '@kit.AbilityKit' // 编译报错

// ✅ 必须通过 UTS 插件（运行在 ArkTS 环境）
// utssdk/app-harmony/index.uts 中写原生调用

// 2. JSVM 是单线程（4.81 之前在主线程，之后在子线程）
// 4.81 前：耗时 JS 操作会卡 UI（因为 JSVM 在主线程）
// 4.81 后：JSVM 在子线程，不卡 UI，但 Bridge 通信有微小延迟

// 3. 调试时的差异
// DevEco Studio 的断点调试只对 ArkTS 层（UTS 插件）有效
// JSVM 内的业务代码调试使用 HBuilderX 自带调试器
```

### 3.3 第三方库兼容性实战

以下是经过真实项目验证的常用库兼容情况：

#### 纯 JS 库（大概率可用）

| 库 | 状态 | 注意事项 |
|----|------|---------|
| lodash / lodash-es | ✅ 可用 | 推荐 lodash-es（ES Module） |
| dayjs | ✅ 可用 | 无 DOM 依赖，完全兼容 |
| axios | ⚠️ 不推荐 | 底层用 XMLHttpRequest，鸿蒙 WebView 中可能异常；用 `uni.request` |
| qs | ✅ 可用 | 纯字符串处理 |
| crypto-js | ✅ 可用 | 纯计算库 |
| pinia | ✅ 可用 | Vue3 标准状态管理 |
| vue-router | ❌ 不适用 | uni-app 用自己的路由系统 |
| z-paging | ✅ 可用 | uni-app 原生组件 |
| uview-plus / uview2 | ⚠️ 部分可用 | 某些组件依赖 `plus`，需逐个测试 |

#### 有 DOM 依赖的库（大概率不可用）

| 库 | 状态 | 替代方案 |
|----|------|---------|
| echarts | ⚠️ 部分可用 | **鸿蒙必须通过 WebView 嵌入**，不支持 RenderJS；Android/iOS 可用 RenderJS |
| html2canvas | ❌ 不可用 | 4.87 前不可用，之后修复 |
| clipboard.js | ❌ 不需要 | 用 `uni.setClipboardData` |
| jquery | ❌ 不可用 | 无 DOM 环境 |

#### 原生能力相关

| 功能 | 鸿蒙方案 |
|------|---------|
| 支付宝支付 | ohpm 包 `@cashier_alipay/cashiersdk`，通过 UTS 插件调用 |
| 微信支付 | 条件编译，鸿蒙不支持微信支付 SDK |
| 华为支付 | uni-pay 配置 `clientType: "app-harmony"` |
| 极光推送 | 不支持；用 uniPush（内置） |
| 腾讯 IM | 需通过 UTS 插件集成 ohpm 版本 |
| 友盟统计 | 不支持；用 uni 统计（内置） |

### 3.4 CSS 渲染差异实测

鸿蒙上的 WebView 渲染引擎与 Chrome 有细微差异，以下是实测发现的问题：

```
1. flex 布局
   -鸿蒙 WebView 的 flex 实现基本完整
   - nvue 页面在鸿蒙上走 Web 渲染，但 Android/iOS 上 nvue 的 CSS 限制不适用

2. 安全区
   - env(safe-area-inset-bottom) 在鸿蒙上可用
   - 但需要在 manifest.json 的 app-harmony.safearea 中正确配置背景色

3. 1px 边框
   - 某些设备上 border: 0.5px 可能不显示，建议用 transform: scaleY(0.5) 方案

4. 圆角 + overflow: hidden
   - 某些鸿蒙版本上 overflow: hidden 可能裁切不准，需测试

5. position: fixed
   - 在键盘弹出时，fixed 元素可能被推上去
   - 需配合 softinputMode: "adjustResize" 处理

6. animation / transition
   - CSS animation 基本可用
   - 但 uni.createAnimation() API 不可用（必须用 CSS）

7. 字体
   - 自定义 @font-face 可用
   - iconfont 图标字体正常显示
   - 但 .woff2 格式在某些旧鸿蒙版本可能有兼容问题，建议同时提供 .ttf

8. 渐变
   - linear-gradient 正常
   - radial-gradient 可能与 Chrome 渲染有细微差异
```

### 3.5 键盘与软输入踩坑

```js
// pages.json 中配置鸿蒙键盘行为
{
  "path": "pages/chat/chat",
  "style": {
    "app-harmony": {
      "softinputMode": "adjustResize"  // 或 "adjustPan"
    }
  }
}

// adjustResize：页面整体上移，fixed 元素位置不变（推荐聊天页面）
// adjustPan：只平移焦点元素（可能导致 fixed 按钮被键盘遮挡）
```

**踩坑记录：**
- `uni.onKeyboardHeightChange` 需要 HBuilderX 5.05+ 才支持鸿蒙
- 键盘弹出时 `<input>` 的 `adjust-position: true` 在滚动容器内行为可能不一致
- `focus` 属性设为 `true` 时可能不自动弹键盘（4.87 有回归 bug，后续版本修复）

### 3.6 推送（uniPush）完整配置

```json5
// 1. harmony-configs/entry/src/main/module.json5 添加权限
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.APP_TRACKING_CONSENT" }
    ]
  }
}

// 2. string.json5 添加权限说明（审核需要）
{
  "string": [
    { "name": "Reason_TRACKING", "value": "用于接收推送消息" }
  ]
}

// 3. manifest.json 启用 uniPush 2.0
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "push": { "unipush": {} }
      }
    }
  }
}
```

```js
// 4. 代码中使用
const clientId = uni.getPushClientId()
uni.onPushMessage((message) => {
  // message.type: 'receive' | 'click'
  // 跳转到指定页面等
})
```

**注意：** `uni.createPushMessage` 本地通知在鸿蒙上不支持 `icon`、`sound`、`cover`、`delay`、`when`、`channelId` 参数。

### 3.7 暗黑模式适配

```json
// manifest.json
{
  "app-harmony": {
    "darkmode": true,
    "themeLocation": "theme.json",
    "safearea": {
      "background": "#ffffff",
      "backgroundDark": "#1a1a1a",
      "bottom": { "offset": "none" }
    }
  }
}
```

```css
/* CSS 中使用媒体查询 */
.container {
  background-color: #ffffff;
}
@media (prefers-color-scheme: dark) {
  .container {
    background-color: #1a1a1a;
  }
}
```

```js
// JS 监听主题变化
uni.onThemeChange((result) => {
  // result.theme: 'light' | 'dark'
})
```

**踩坑：** `onThemeChange` 在鸿蒙上 4.81-alpha 前不触发，需升级。页面关闭时可能闪白，通过 `backgroundDark` 配置解决。

### 3.8 生物认证

```js
// 检查设备是否支持
uni.checkIsSupportSoterAuthentication({
  success(res) {
    // res.supportMode: ['fingerPrint', 'facial']
  }
})

// 指纹/人脸验证
uni.startSoterAuthentication({
  requestAuthModes: ['fingerPrint'],
  challenge: 'random-string',
  authContent: '请验证指纹',
  success(res) { /* 验证成功 */ },
  fail(err) { /* 验证失败 */ }
})
```

**鸿蒙注意：** 需添加权限 `ohos.permission.ACCESS_BIOMETRIC`。元服务不支持生物认证 API。

### 3.9 隐私合规（应用商店审核关键）

**被拒常见原因：**

```
1. 隐私协议只写了 Android/iOS，没提鸿蒙 → 被拒
2. 隐私协议中的应用名与 AGC 注册名不一致 → 被拒
3. 隐私协议中声明的权限与 module.json5 中 requestPermissions 不匹配 → 被拒
4. 首次启动无隐私弹窗 → 被拒
5. 使用了 beta API（而非 release API）→ 被拒
6. 应用图标不是华为标准底板 → 被拒（元服务）
7. deviceTypes 配置与 AGC 不一致 → 被拒
8. 未完成内容分级 → 被拒
9. 华为账号登录应用，登录页非标准样式 → 被拒
10. 平板/折叠设备未支持 Tab 键焦点导航 → 被拒
```

**隐私弹窗两种实现：**

```vue
<!-- 方式一：自行实现（推荐，灵活度高） -->
<template>
  <uni-popup ref="privacyPopup" :is-mask-click="false">
    <view class="privacy-dialog">
      <text class="title">隐私政策</text>
      <text class="content">
        请您审阅《隐私政策》和《用户协议》。
        <!-- 注意：协议中必须包含鸿蒙平台描述 -->
      </text>
      <view class="buttons">
        <button @click="disagree">拒绝</button>
        <button type="primary" @click="agree">同意</button>
      </view>
    </view>
  </uni-popup>
</template>
```

方式二：华为托管隐私协议 —— 在 AGC 后台配置，调试时需额外加三个参数。

### 3.10 企业内部分发

鸿蒙**不支持侧载**（类似 iOS），但支持企业内部分发：

```
1. 申请内部测试证书（AGC → 证书管理）
2. 通过 HBuilderX 调试运行获取 .hap 包
3. 编写分发描述文件，上传到内部服务器
4. 或使用 AGC 白名单测试：AGC → 应用测试 → 版本列表
   - 添加测试设备 UDID 到白名单
   - 白名单用户可直接下载安装
```

获取设备 UDID：`hdc shell bm get -u`

### 3.11 调试黑科技

```bash
# 1. 查看鸿蒙日志（真机无 WiFi 时用 hdc）
hdc shell hilog -T JSAPP

# 2. 杀死 hdc server（热重载连不上时）
hdc kill -r

# 3. 查看元服务 ASCF 运行时版本
hdc shell bm dump-shared -n com.huawei.hms.ascfruntime
# 需要 >= 1.0.13.310

# 4. 二分法定位白屏页面
# 在 pages.json 中注释一半页面 → 不崩则在另一半 → 继续二分
```

### 3.12 生产环境代码审查清单

每次 PR 合并前，对照以下清单检查鸿蒙兼容性：

```
□ 新增的 API 调用是否检查了鸿蒙兼容性？
□ 新增的组件是否在鸿蒙上可用？
□ 是否有新增的 plus.* 调用？（鸿蒙不可用）
□ 条件编译是否使用了正确的标识？
  - 包含鸿蒙用 APP 或 APP-HARMONY
  - 排除鸿蒙用 #ifndef APP-HARMONY
  - APP-PLUS 不包含鸿蒙！
□ 新增的权限是否在 harmony-configs/module.json5 中声明？
□ 隐私协议是否同步更新？
□ WebView 通信是否使用 uni.createWebviewContext（非 plus）？
□ 页面间通信是否使用 uni.$emit/$on（非 EventChannel）？
□ 导航栏是否使用自定义组件（非 titleNView）？
□ 新增的 nvue 组件是否使用了鸿蒙不支持的标签？
□ Release 模式测试是否通过？（混淆问题）
□ 路径是否不含中文和特殊字符？
```

### 3.13 常见构建错误速查（FAQ 升级版）

| 错误关键词 | 原因 | 解决 |
|-----------|------|------|
| `EPERM copyfile` | 资源文件只读属性 | 移除只读属性，删除 unpackage |
| `pnpm install failed` | DevEco 依赖未安装 | 先在 DevEco 中运行一次项目 |
| `Schema validate failed` | DevEco 版本不匹配或 build-profile 错误 | 升级 DevEco 或修正 build-profile |
| `EntryBackupAbility.ets not exist` | 从错误位置复制了 build-profile | 从 unpackage 复制，不从 DevEco 复制 |
| `useNormalizedOHMUrl` | 依赖 URL 格式不兼容 | 在 build-profile.json5 中设置 |
| `beta API rejected` | 使用了 beta 版 SDK | 用 release 版 DevEco 重新构建 |
| `higher api version` | 4.51 版本兼容性 | build-profile 加 `compatibleSdkVersionStage: "beta6"` |
| `launcher plugin corrupt` | 运行插件损坏 | 卸载重装"鸿蒙真机运行"插件 |
| `hdc server` 连不上 | hdc 进程卡死 | `hdc kill -r` |
| Mac 外置硬盘构建失败 | `._` 资源分支文件 | 4.81+ 自动清理；手动：`find . -name "._*" -delete` |
| `Tab` 焦点导航未通过审核 | 平板/折叠设备要求 | 组件加 `tabindex` 或 `deviceTypes` 限制仅手机 |

### 3.14 完整适配工作流（增强版）

```
┌─────────────────────────────────────────────────────────────────┐
│                     老项目鸿蒙适配全景图                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 0: 评估（1-2天）                                          │
│  ├── 盘点项目技术栈（Vue版本、plus使用量、nvue页面数、原生插件）     │
│  ├── 确定适配方案（uni-app / uni-app x）                          │
│  ├── 评估工作量和排期                                             │
│  └── 搭建鸿蒙开发环境（HBuilderX + DevEco + 模拟器/真机）          │
│                                                                  │
│  Phase 1: 基础迁移（1-2周）                                      │
│  ├── Vue2 → Vue3（如需要）                                       │
│  ├── 升级 HBuilderX 到 4.81+                                     │
│  ├── 安装鸿蒙依赖，首次运行到鸿蒙                                  │
│  ├── 生成 harmony-configs 目录                                    │
│  └── 配置 bundleName、签名证书、基本权限                           │
│                                                                  │
│  Phase 2: 代码改造（2-3周）                                      │
│  ├── 全局搜索替换 plus.* → uni API + 条件编译                      │
│  ├── 全局搜索 APP-PLUS → 修正为 APP / APP-HARMONY                 │
│  ├── subNVue → Vue 组件                                          │
│  ├── titleNView → 自定义导航栏                                    │
│  ├── nvue 原生组件 → 标准 Vue 组件                                │
│  ├── EventChannel → uni.$emit/$on                                │
│  ├── 原生插件 → UTS 插件重写                                      │
│  └── 第三方 SDK 适配（支付、推送、地图等）                          │
│                                                                  │
│  Phase 3: UI 适配（1-2周）                                       │
│  ├── 自定义导航栏适配鸿蒙状态栏                                    │
│  ├── 安全区适配（safe-area-inset）                                │
│  ├── 键盘弹起行为适配（softinputMode）                             │
│  ├── 暗黑模式适配                                                 │
│  ├── 振动、动画等降级处理                                          │
│  └── 响应式布局验证（不同鸿蒙设备尺寸）                             │
│                                                                  │
│  Phase 4: 功能验证（1-2周）                                      │
│  ├── 登录/授权流程（华为账号登录）                                  │
│  ├── 支付流程                                                     │
│  ├── 推送通知                                                     │
│  ├── 定位/地图                                                    │
│  ├── WebView 内嵌页面                                             │
│  ├── 文件上传/下载                                                │
│  └── 分享功能                                                     │
│                                                                  │
│  Phase 5: 审核 & 上线（1周）                                      │
│  ├── 隐私协议补充鸿蒙平台描述                                      │
│  ├── 隐私弹窗实现                                                 │
│  ├── Release 模式构建（禁用混淆）                                   │
│  ├── 华为应用商店提审                                              │
│  ├── 处理审核反馈                                                  │
│  └── 正式发布                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.15 鸿蒙特有的设备类型适配

```json5
// harmony-configs/entry/src/main/module.json5
// 限制设备类型（避免平板/折叠设备审核被拒）
{
  "module": {
    "deviceTypes": ["phone"]  // 只支持手机
    // 可选: "phone", "tablet", "tv", "wearable", "car"
  }
}
```

如果支持平板/折叠设备，必须处理 Tab 键/方向键焦点导航：

```vue
<!-- 给所有可交互元素加 tabindex -->
<button tabindex="0" @click="handleClick">按钮</button>
<input tabindex="1" />
```

### 3.16 推送 Badge 角标

```js
// 鸿蒙独有 API（iOS/Android 用 plus.runtime.setBadgeNumber）
// #ifdef APP-HARMONY
uni.setAppBadgeNumber(3)  // 设置角标数字
// #endif

// #ifdef APP-PLUS
plus.runtime.setBadgeNumber(3)
// #endif
```

### 3.17 WebView 嵌套深度优化

鸿蒙的 WebView 是应用渲染的核心载体（uni-app 项目），优化 WebView 性能至关重要：

```
1. 减少页面 DOM 节点数（虚拟列表、懒加载）
2. 避免大量 CSS 选择器计算（减少嵌套层级）
3. 图片使用 webp 格式，降低解码开销
4. 避免频繁操作 style（用 class 切换替代）
5. 长列表用 scroll-view + 分页加载（避免一次性渲染）
6. WebView 内页面避免重排（批量 DOM 操作用 requestAnimationFrame）
```

### 3.18 文件访问限制

鸿蒙的文件访问模型与 Android 完全不同：

```
Android: 应用有私有目录 + 可访问公共存储（需权限）
鸿蒙:   应用只能访问自己的沙箱目录
        不能直接读写用户公共目录
        必须通过系统 Picker（选择器）访问媒体文件
        READ_MEDIA / WRITE_MEDIA 权限已废弃
```

```js
// ❌ 鸿蒙上不能这样做
// 直接用文件路径读取相册图片

// ✅ 正确方式
uni.chooseImage({
  count: 1,
  success(res) {
    // res.tempFilePaths 是系统返回的临时路径
    // 这个路径可以用 uni.uploadFile 上传
  }
})

// 保存到相册
uni.saveImageToPhotosAlbum({
  filePath: tempFilePath,
  success() { /* 保存成功 */ }
})
// 需要权限: ohos.permission.READ_IMAGEVIDEO（ACL，需审批）
```

### 3.19 从源文档提取的已修复 Bug 列表（供历史参考）

以下是历史版本中遇到过、已修复的鸿蒙 Bug，如果遇到类似问题可尝试升级版本：

| Bug | 版本 | 修复版本 |
|-----|------|---------|
| `uni.request` 响应体为空字符串崩溃 | 早期 | 4.31+ |
| HEAD 请求失败 | 早期 | 4.31+ |
| WebSocket 发送 ArrayBuffer 无效 | 早期 | 4.31+ |
| compressImage 生成的图片变形 | 早期 | 4.41+ |
| chooseImage 选择 GIF 但未选"原图"导致 GIF 不显示 | 早期 | 4.41+ |
| canvas measureText 文字宽度不准 | 早期 | 4.51+ |
| 两个以上 video 组件显示异常 | 早期 | 4.51+ |
| swiper 初始化 100+ 项时卡顿 | 早期 | 4.51+ |
| text 组件动态改 line-height 不刷新 | 早期 | 4.61+ |
| button disabled=true 仍触发点击 | 早期 | 4.61+ |
| switch 组件设置属性导致页面 image 加载失败 | 早期 | 4.61+ |
| textarea padding 渲染不正确 | 早期 | 4.61+ |
| getBackgroundAudioManager onEnded 中调 play 失败 | 早期 | 4.71+ |
| input font-size 不影响 placeholder | 早期 | 4.71+ |
| web-view 不遵守 viewport meta | 早期 | 4.71+ |
| web-view 音频不能自动播放 | 早期 | 4.71+ |
| web-view 侧滑返回直接退出应用 | 早期 | 4.71+ |
| html2canvas 不工作 | 早期 | 4.87+ |
| file:// 协议在 API 20+ 设备上失败 | 早期 | 4.81+ |
| input focus=true 不弹键盘（回归 bug） | 4.87 | 后续版本 |
| onThemeChange 运行期间不触发 | 4.81 前 | 4.81+ |
| adjust-position 在滚动容器内不生效 | 早期 | 4.81+ |
| base64 SVG 不显示 | 早期 | 5.0+ |

### 3.20 给后来者的忠告

```
1. 不要试图绕过 JSVM 限制直接在 JS 层调原生 API —— 老老实实写 UTS 插件
2. 不要等全部改完再测试 —— 每改完一个模块就在鸿蒙上跑一遍
3. 不要忽视 Release 模式 —— Debug 模式正常不代表 Release 也正常
4. 不要低估隐私合规 —— 华为审核比 Google Play 更严
5. 不要用 x86 模拟器当主力测试 —— 用真机或 API 19+ 的 arm64 模拟器
6. 路径问题第一时间排查 —— 中文路径/长路径是 90% 构建问题的元凶
7. 签名证书早申请 —— ACL 权限需华为人工审批，可能等几天
8. 条件编译全局搜索 —— APP-PLUS 必须逐条确认，不能批量替换
9. 第三方库先测再用 —— npm 包在鸿蒙 JSVM 中的行为可能与浏览器不同
10. 应用图标用华为工具生成 —— 手工做的图标大概率不符合规范
```
