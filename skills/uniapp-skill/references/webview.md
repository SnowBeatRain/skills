# web-view 组件深度参考

`<web-view>` 是承载网页的容器组件，会自动铺满整个页面（nvue 需手动指定宽高）。

官方文档：https://uniapp.dcloud.net.cn/component/web-view.html

## 核心属性

| 属性 | 类型 | 说明 | 平台差异 |
|------|------|------|---------|
| src | String | 网页链接 | |
| fullscreen | Boolean | 是否铺满整个页面，默认 true | H5 3.5.4+、App-HarmonyOS |
| webview-styles | Object | webview 的样式 | App-vue |
| update-title | Boolean | 是否自动更新页面标题，默认 true | App-vue 3.3.8+（小程序恒为true，H5/nvue 恒为false） |
| @message | EventHandler | 网页 postMessage 时触发 | 抖音/H5 不支持，HarmonyOS 用此接收 |
| @onPostMessage | EventHandler | 网页向应用**实时** postMessage | **仅 App-nvue** |
| @load | EventHandler | 网页加载成功时触发 | 非 App 端 |
| @error | EventHandler | 网页加载失败时触发 | 非 H5 端 |

## src 来源支持

| 来源 | App | H5 | 各小程序 |
|------|:---:|:--:|:-------:|
| 网络 | ✅ | ✅ | ✅ |
| 本地 | ✅ | ✅ | ❌ |

## 双向通信

### 应用 → web-view（通过 evalJS）

```html
<template>
  <web-view ref="webview" src="/hybrid/html/local.html"></web-view>
</template>

<script setup>
import { ref } from 'vue'
const webview = ref(null)

// 向 web-view 注入 JS
const sendToWebView = () => {
  webview.value.evalJS("document.body.style.background = 'red'")
  // 或调用 web-view 内网页定义的函数
  webview.value.evalJS("handleAppMessage('hello from app')")
}
</script>
```

### web-view → 应用（postMessage）

**App 端（vue 页面）**：通过 `@message` 事件接收，在后退、组件销毁、分享时触发：

```html
<template>
  <web-view src="https://example.com" @message="onMessage"></web-view>
</template>

<script setup>
const onMessage = (event) => {
  // event.detail.data 是数组，包含所有 post 的消息
  console.log(event.detail.data)
}
</script>
```

**App-nvue 页面**：通过 `@onPostMessage` 接收**实时消息**：

```html
<template>
  <web-view ref="webview" class="webview" @onPostMessage="handlePostMessage"></web-view>
</template>

<script>
export default {
  methods: {
    handlePostMessage(data) {
      console.log("收到消息：" + JSON.stringify(data.detail))
    }
  }
}
</script>

<style>
.webview { flex: 1 }  /* nvue 必须指定宽高 */
</style>
```

**HarmonyOS**：使用 `@message` 接收。

**小程序端**：在后退、组件销毁、分享时触发 `@message`。

### web-view 内的网页代码

网页中需要引入 `uni.webview.js` 才能调用 uni API：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
  <title>网络网页</title>
</head>
<body>
  <button id="navigate">跳转</button>
  <button id="postMessage">发消息</button>

  <!-- 小程序 SDK（按需引入） -->
  <script src="https://res.wx.qq.com/open/js/jweixin-1.4.0.js"></script>
  <!-- uni 的 SDK -->
  <script src="https://gitcode.com/dcloud/uni-app/tree/uni-app-vue2-dev/dist/uni.webview.1.5.8.js"></script>

  <script>
    document.addEventListener('UniAppJSBridgeReady', function() {
      // 获取当前环境
      uni.getEnv(function(res) {
        console.log('当前环境：' + JSON.stringify(res))
        // res.plus = true (App)
        // res.miniprogram = true (微信/支付宝/抖音小程序)
        // res.harmony = true (uni-app 鸿蒙 1.5.7+)
        // res.nvue = true (App-nvue, 1.5.4+)
      })

      // 向应用发消息
      document.getElementById('postMessage').addEventListener('click', function() {
        uni.postMessage({
          data: { action: 'message', payload: 'hello' }
        })
      })

      // 路由跳转
      document.getElementById('navigate').addEventListener('click', function() {
        uni.navigateTo({ url: '/pages/detail/detail?id=1' })
      })
    })
  </script>
</body>
</html>
```

网页中可使用的 uni API：

| 方法 | 说明 | 平台差异 |
|------|------|---------|
| uni.navigateTo | 跳转页面 | |
| uni.redirectTo | 替换页面 | |
| uni.reLaunch | 重启应用 | |
| uni.switchTab | 切换 tab | |
| uni.navigateBack | 返回 | |
| uni.postMessage | 向应用发消息 | 抖音/H5 不支持 |
| uni.getEnv | 获取当前环境 | 抖音/飞书不支持 |

## 高级用法：App 端动态创建 webview

每个 vue 页面其实都是一个 webview，页面中的 `<web-view>` 组件是父 webview 的子 webview。

### 控制 web-view 大小/样式

```html
<template>
  <web-view src="https://www.baidu.com"></web-view>
</template>

<script setup>
import { onReady } from '@dcloudio/uni-app'

let wv
onReady(() => {
  // #ifdef APP-PLUS
  var currentWebview = this.$scope.$getAppWebview()
  setTimeout(() => {
    wv = currentWebview.children()[0]
    wv.setStyle({ top: 150, height: 300 })  // 调整大小位置
    wv.setStyle({ scalable: true })         // 支持双指缩放
  }, 1000)
  // #endif
})
</script>
```

### 不依赖组件直接创建

```html
<template>
  <view></view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

let wv
onLoad(() => {
  // #ifdef APP-PLUS
  wv = plus.webview.create("", "custom-webview", {
    plusrequire: "none",       // 禁止远程网页使用 plus API
    'uni-app': 'none',         // 不加载 uni-app 渲染层
    top: uni.getSystemInfoSync().statusBarHeight + 44
  })
  wv.loadURL("https://www.baidu.com")
  var currentWebview = this.$scope.$getAppWebview()
  currentWebview.append(wv)    // 必须 append 才能跟随页面动画
  // #endif
})
</script>
```

## web-view 层级问题

web-view 在 App 和小程序中层级较高，覆盖方案：

| 方案 | 说明 |
|------|------|
| 原生弹出菜单 | actionsheet 等，小程序也支持 |
| plus.nativeObj.view | App 端原生覆盖层 |
| subNVue 原生子窗体 | App 端高性能原生子窗口 |
| evalJS 注入 | 为 web-view 注入 JS 弹出其 div 层 |

```js
// evalJS 方案：为 web-view 注入 JS
wv.evalJS(`
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;';
  overlay.innerHTML = '<p style="color:white;text-align:center;margin-top:50%;">原生覆盖内容</p>';
  document.body.appendChild(overlay);
`)
```

## 本地网页

App 端加载本地 HTML 时，文件放在 `hybrid/html/` 目录：

```
├─hybrid
│  └─html
│     ├─css/test.css
│     ├─img/icon.png
│     ├─js/test.js
│     └─local.html
├─pages/index/index.vue
└─...
```

```html
<template>
  <web-view src="/hybrid/html/local.html"></web-view>
</template>
```

本地网页中可以运行 plus API，但注意：
- App-vue 的 web-view 加载的 HTML 可以运行 plus API
- App-nvue 的 web-view **不能**运行 plus API
- 若 HTML 监听了 `plus.key`（back 键），会造成冲突，需移除

## 浏览器内核

| 平台 | 内核 |
|------|------|
| H5 | 当前浏览器的 iframe |
| 小程序 | 各平台自带内核 |
| App Android | 系统 WebView（可配置为腾讯 X5 内核） |
| App iOS | WKWebView（2.2.5+ 默认） |

## 关键注意事项

1. **小程序仅支持网络网页**，不支持本地 HTML
2. **App-vue 不支持 v-show**，用 v-if 替代
3. **小程序 web-view 一定有原生导航栏**，`navigationStyle: custom` 无效
4. **nvue 的 web-view 必须指定宽高**（或 `flex: 1`）
5. 小程序 `src` 指向的链接需在后台配置域名白名单
6. HarmonyOS 不支持 `plus` 对象，使用 `uni.createWebviewContext` 替代
7. `uni.webview.js` 最新版本：[下载](https://gitcode.com/dcloud/uni-app/tree/uni-app-vue2-dev/dist/uni.webview.1.5.8.js)
8. **建议下载到自己的服务器**，不要直接引用 CDN 链接
