# 社区最佳实践参考（DCloud 精华帖汇总）

## 1. 热更新 / wgt 升级

### 原理

wgt（Widget）是 uni-app 的资源包格式，包含编译后的 JS/CSS/页面等资源，不含原生引擎。通过 wgt 热更新可以跳过应用商店审核，快速修复 bug 和发布新功能。

**限制**：仅能更新前端资源，不能更新原生插件、SDK 版本或 manifest.json 中的原生配置。

### 生成 wgt 包

HBuilderX → 发行 → 原生 App-制作应用 wgt 包

### 服务端设计

```js
// 版本检查 API 设计
// GET /api/app/checkUpdate?version=1.0.0&platform=android
{
  "hasUpdate": true,
  "wgtUrl": "https://cdn.example.com/update/app_v1.1.0.wgt",
  "version": "1.1.0",
  "versionCode": 110,
  "forceUpdate": false,        // 是否强制更新
  "updateLog": "1. 修复首页加载 bug\n2. 新增订单功能",
  "minVersion": "1.0.0",       // 最低支持热更新的版本
  "needFullUpdate": false,     // 是否需要整包更新（原生变化时）
  "fullUpdateUrl": "https://..."
}
```

### 客户端实现

```js
// App.vue onLaunch 中检查更新
const checkUpdate = () => {
  // #ifdef APP-PLUS
  const { appVersion } = uni.getAppBaseInfo()
  uni.request({
    url: '/api/app/checkUpdate',
    data: { version: appVersion, platform: uni.getSystemInfoSync().platform },
    success: ({ data }) => {
      if (!data.hasUpdate) return
      if (data.needFullUpdate) {
        // 整包更新：引导用户下载
        uni.showModal({
          title: '发现新版本',
          content: data.updateLog,
          success: ({ confirm }) => {
            if (confirm) plus.runtime.openURL(data.fullUpdateUrl)
          }
        })
        return
      }
      // wgt 热更新
      const modalOpts = {
        title: '发现新版本 v' + data.version,
        content: data.updateLog,
        showCancel: !data.forceUpdate
      }
      uni.showModal({
        ...modalOpts,
        success: ({ confirm }) => {
          if (!confirm && !data.forceUpdate) return
          uni.showLoading({ title: '下载中...' })
          uni.downloadFile({
            url: data.wgtUrl,
            success: (downloadRes) => {
              if (downloadRes.statusCode !== 200) return
              plus.runtime.install(downloadRes.tempFilePath, {
                force: true
              }, () => {
                uni.hideLoading()
                uni.showModal({
                  title: '更新完成',
                  content: '是否立即重启？',
                  success: ({ confirm }) => {
                    if (confirm) plus.runtime.restart()
                  }
                })
              }, (err) => {
                uni.hideLoading()
                uni.showToast({ title: '安装失败', icon: 'none' })
                console.error('wgt install error:', err)
              })
            }
          })
        }
      })
    }
  })
  // #endif
}
```

### 官方升级中心

uni-app 提供了 `uni-upgrade-center`（uni_modules 插件），包含：
- **uni-upgrade-center-app**：前端检查更新组件
- **uni-upgrade-center-admin**：后台管理面板（基于 uni-admin）
- 支持 wgt 热更新 + 整包更新 + 强制更新 + 静默更新

### 注意事项

- wgt 包的 `manifest.json` 中 `appid` 和 `version` 必须与线上版本匹配
- `versionCode` 必须大于当前安装版本
- 原生模块有变化时必须整包更新
- iOS 审核策略较严格，频繁热更新可能被拒

---

## 2. 性能优化

### 分包策略

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/mine/mine" }
  ],
  "subPackages": [
    {
      "root": "pages-order",
      "pages": [
        { "path": "list/list" },
        { "path": "detail/detail" }
      ]
    },
    {
      "root": "pages-shop",
      "pages": [
        { "path": "goods/goods" },
        { "path": "cart/cart" }
      ]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages-order"]
    }
  }
}
```

### 主包瘦身

- **图片上 CDN**：static 目录只放必要的 tabBar 图标和小图标
- **按需引入组件**：easycom 只引入使用到的 uni-ui 组件
- **分包异步化**（微信基础库 2.11.2+）：组件和 JS 可跨包异步引用
- **组件分包引用**：主包页面引用分包组件，加载前显示占位
- **资源目录条件编译**：`static/mp-weixin/` 只在微信端打包

### 异步分包与组件分包（微信小程序）

```json
// pages.json - 独立分包（可独立运行，不依赖主包）
{
  "subPackages": [
    {
      "root": "pages-activity",
      "pages": [{ "path": "index/index" }],
      "independent": true
    }
  ]
}
```

```json
// 组件分包引用（主包页面使用分包中的组件）
// page.json 或对应页面 style 中配置
{
  "usingComponents": {
    "heavy-chart": "/pages-chart/components/chart"
  },
  "componentPlaceholder": {
    "heavy-chart": "view"
  }
}
```

```js
// JS 异步分包引用（跨包引用 JS 模块）
// 主包中异步加载分包的模块
const getUtils = () => import('../pages-order/utils/order-helper.js')

const handleOrder = async () => {
  const { calcPrice } = await getUtils()
  const price = calcPrice(items)
}
```

### 白屏优化

```json
// manifest.json - App 端启动白屏优化
{
  "app-plus": {
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "autoclose": true,
      "waiting": true
    }
  }
}
```

```vue
<!-- 骨架屏 -->
<template>
  <view v-if="loading" class="skeleton">
    <view class="skeleton-avatar" />
    <view class="skeleton-line" v-for="i in 3" :key="i" />
  </view>
  <view v-else>
    <!-- 真实内容 -->
  </view>
</template>
```

### 数据优化

```js
// 1. 非响应式大数据：不放 ref/reactive
let rawList = []  // 原始数据不需要响应式
const displayList = ref([])  // 只有展示数据才需要

// 2. 冻结不变数据
const config = Object.freeze({ ... })

// 3. 长列表：分页 + 虚拟滚动
// App nvue 使用 <list> 自动回收
// H5/小程序使用分页或 virtual-list 插件

// 4. 避免大量 watcher
// 用 computed 代替多个 watch
// 使用 shallowRef/shallowReactive 减少深度响应
import { shallowRef } from 'vue'
const bigData = shallowRef([])
bigData.value = newArray  // 只监听引用变化
```

### 图片优化

- 使用 WebP 格式（体积减少 25-35%）
- `<image>` 设置合适的 `mode`，避免加载过大图片
- 列表图片使用懒加载：`<image lazy-load :src="item.img" />`
- 缩略图 + 大图分离：列表用小图，详情用大图

### 渲染优化

```vue
<!-- 1. v-if 替代 v-show（小程序无 display:none 性能优势） -->
<view v-if="visible">内容</view>

<!-- 2. 列表必须指定 key -->
<view v-for="item in list" :key="item.id">{{ item.name }}</view>

<!-- 3. 复杂计算用 computed 缓存 -->
<script setup>
const filteredList = computed(() => list.value.filter(i => i.active))
</script>

<!-- 4. 事件处理函数避免内联复杂逻辑 -->
<!-- Bad -->
<button @click="list.filter(i => i.id !== id).map(...)">删除</button>
<!-- Good -->
<button @click="handleDelete(id)">删除</button>
```

---

## 3. 自定义导航栏

### 基础实现

```vue
<template>
  <!-- 页面须在 pages.json 设置 "navigationStyle": "custom" -->
  <view class="page">
    <!-- 自定义导航栏 -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <uni-icons type="left" size="20" color="#333" />
        </view>
        <view class="navbar-title">{{ title }}</view>
        <view class="navbar-right">
          <slot name="right" />
        </view>
      </view>
    </view>
    <!-- 占位：防止内容被导航栏遮挡 -->
    <view :style="{ height: (statusBarHeight + navBarHeight) + 'px' }" />
    <slot />
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ title: { type: String, default: '' } })

const statusBarHeight = ref(0)
const navBarHeight = ref(44)  // iOS 44px，Android 48px

// #ifdef MP-WEIXIN
// 微信小程序需适配胶囊按钮
const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
const systemInfo = uni.getWindowInfo()
statusBarHeight.value = systemInfo.statusBarHeight
// 导航栏高度 = (胶囊按钮顶部 - 状态栏高度) * 2 + 胶囊按钮高度
navBarHeight.value = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height
// #endif

// #ifndef MP-WEIXIN
const systemInfo2 = uni.getWindowInfo()
statusBarHeight.value = systemInfo2.statusBarHeight
// #endif

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}
</script>

<style scoped>
.navbar {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 999;
  background-color: #ffffff;
}
.navbar-inner {
  display: flex; align-items: center;
  padding: 0 15px;
}
.navbar-left { width: 60px; }
.navbar-title { flex: 1; text-align: center; font-size: 16px; font-weight: bold; }
.navbar-right { width: 60px; text-align: right; }
</style>
```

### CSS 变量方式（简化）

```css
/* uni-app 内置 CSS 变量 */
.navbar {
  padding-top: var(--status-bar-height);  /* 自动适配状态栏 */
}
```

### 底部安全区适配

```css
/* iPhone X 及以上底部安全区 */
.footer {
  padding-bottom: constant(safe-area-inset-bottom);  /* iOS < 11.2 */
  padding-bottom: env(safe-area-inset-bottom);        /* iOS >= 11.2 */
}

/* 或使用 uni-app 内置变量 */
.footer {
  padding-bottom: var(--window-bottom);
}
```

---

## 4. Android 应用合规

### 隐私政策弹窗（模板模式）

项目根目录 `androidPrivacy.json`：

```json
{
  "version": "1",
  "prompt": "template",
  "title": "服务协议和隐私政策",
  "message": "请你务必审慎阅读、充分理解"服务协议"和"隐私政策"各条款，包括但不限于：为了向你提供即时通讯、内容分享等服务，我们需要收集你的设备信息、操作日志等个人信息。你可阅读<a href=\"https://example.com/agreement\">《服务协议》</a>和<a href=\"https://example.com/privacy\">《隐私政策》</a>了解详细信息。如果你同意，请点击"同意"开始接受我们的服务。",
  "buttonAccept": "同意并继续",
  "buttonRefuse": "不同意",
  "hrefLoader": "system",
  "second": {
    "title": "温馨提示",
    "message": "进入应用前，你需先同意<a href=\"https://example.com/agreement\">《服务协议》</a>和<a href=\"https://example.com/privacy\">《隐私政策》</a>，否则将退出应用。",
    "buttonAccept": "同意并继续",
    "buttonRefuse": "退出应用"
  },
  "styles": {
    "backgroundColor": "#ffffff",
    "borderRadius": "8px",
    "title": { "color": "#333333" },
    "buttonAccept": { "color": "#ffffff", "backgroundColor": "#007AFF" },
    "buttonRefuse": { "color": "#999999" }
  }
}
```

### 合规自查清单

| 检查项 | 要求 |
|--------|------|
| 首次启动 | 必须弹出隐私弹窗，用户同意前不得收集任何信息 |
| 权限申请 | 使用时才申请，不得一次性索要全部权限 |
| 隐私政策 | 必须包含收集的数据类型、用途、第三方 SDK 列表 |
| 用户撤回 | 提供撤回已授权权限的入口 |
| 数据删除 | 提供注销账号、删除数据的功能 |
| 第三方 SDK | 隐私政策中列明所有第三方 SDK 及其数据收集行为 |

### 常见拒审原因及解决

```js
// 1. 隐私弹窗前获取设备信息 → 确保 androidPrivacy.json 配置正确
// 2. 获取 IMEI/MAC 地址 → 使用 OAID 替代
// 3. 后台频繁获取位置 → 说明用途，使用 WhenInUse 权限
// 4. 剪贴板读取 → 必须用户主动触发，不得在启动时自动读取

// 运行时权限动态申请
const requestPermission = async (permissionId) => {
  // #ifdef APP-PLUS
  const result = await new Promise(resolve => {
    plus.android.requestPermissions(
      [permissionId],
      (e) => resolve(e.granted.length > 0),
      (e) => resolve(false)
    )
  })
  return result
  // #endif
}

// 示例：拍照前申请相机权限
const takePhoto = async () => {
  const granted = await requestPermission('android.permission.CAMERA')
  if (!granted) {
    uni.showModal({
      title: '权限提示',
      content: '需要相机权限来拍照，请在设置中开启',
      confirmText: '去设置',
      success: ({ confirm }) => {
        if (confirm) {
          // #ifdef APP-PLUS
          plus.runtime.openURL('app-settings:')
          // #endif
        }
      }
    })
    return
  }
  uni.chooseImage({ sourceType: ['camera'] })
}
```

---

## 5. 全局变量与状态管理选型

### 方案对比

| 方案 | 适用场景 | 响应式 | 持久化 | 推荐度 |
|------|----------|--------|--------|--------|
| `globalData` | 简单全局数据 | 否 | 手动 | ★★ |
| `Pinia` | 中大型项目 | 是 | 插件 | ★★★★★ |
| `provide/inject` | 组件树共享 | 是 | 否 | ★★★ |
| `uni.setStorageSync` | 持久存储 | 否 | 是 | ★★★ |
| `globalProperties` | 全局方法/常量 | 否 | 否 | ★★★ |

### globalData（简单场景）

```js
// App.vue
export default {
  globalData: {
    baseUrl: 'https://api.example.com',
    systemInfo: null
  },
  onLaunch() {
    this.globalData.systemInfo = uni.getSystemInfoSync()
  }
}

// 页面中使用
const app = getApp()
console.log(app.globalData.baseUrl)
```

### Pinia（推荐）

```js
// store/app.js — 应用级全局状态
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    baseUrl: 'https://api.example.com',
    theme: uni.getStorageSync('theme') || 'light',
    networkType: 'unknown'
  }),
  actions: {
    setTheme(theme) {
      this.theme = theme
      uni.setStorageSync('theme', theme)
    },
    initNetworkListener() {
      uni.onNetworkStatusChange(({ networkType }) => {
        this.networkType = networkType
      })
    }
  }
})
```

### Pinia 持久化（pinia-plugin-unistorage）

推荐使用 `pinia-plugin-unistorage`，基于 `uni.setStorageSync` / `uni.getStorageSync`，全平台兼容。

```bash
npm i pinia-plugin-unistorage
```

```js
// main.js
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { unistorage } from 'pinia-plugin-unistorage'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const store = Pinia.createPinia()
  store.use(unistorage)
  app.use(store)
  return { app, Pinia }
}
```

```js
// store/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    settings: { theme: 'light', fontSize: 14 }
  }),
  actions: {
    setToken(token) { this.token = token },
    logout() {
      this.token = ''
      this.userInfo = null
    }
  },
  unistorage: true  // 整个 store 持久化
})

// 选择性持久化（只持久化部分字段）
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    tempSelected: []  // 不需要持久化
  }),
  unistorage: {
    paths: ['items']  // 只持久化 items
  }
})
```

```js
// Composition API 写法
export const useSettingsStore = defineStore('settings', () => {
  const locale = ref('zh-CN')
  const darkMode = ref(false)
  return { locale, darkMode }
}, {
  unistorage: { paths: ['locale', 'darkMode'] }
})
```

> **注意**：不要用 `pinia-plugin-persistedstate`（依赖 `localStorage`），在小程序和 App 端不可用。`pinia-plugin-unistorage` 是 uni-app 生态专用方案。

### globalProperties（全局工具方法）

```js
// main.js
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 全局方法
  app.config.globalProperties.$formatDate = (date) => {
    return new Date(date).toLocaleDateString('zh-CN')
  }
  app.config.globalProperties.$toast = (msg) => {
    uni.showToast({ title: msg, icon: 'none' })
  }

  return { app }
}
```

```vue
<!-- 模板中直接使用 -->
<template>
  <text>{{ $formatDate(item.createTime) }}</text>
</template>

<!-- setup 中使用 -->
<script setup>
import { getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()
proxy.$toast('操作成功')
</script>
```

---

## 6. 微信小程序登录流程

### 完整流程

```
用户点击登录 → uni.login() 获取 code → 发送 code 到后端
→ 后端用 code + appid + secret 调微信接口换 openid/session_key
→ 后端生成自有 token 返回 → 前端存储 token
```

### 客户端代码

```js
// composables/useWxLogin.js
export const useWxLogin = () => {
  const login = async () => {
    // 1. 获取微信 code
    const [loginErr, loginRes] = await uni.login({ provider: 'weixin' })
    if (loginErr) throw new Error('微信登录失败')

    // 2. 获取用户信息（需用户授权按钮触发）
    // 注意：2021年4月后 getUserInfo 改为 getUserProfile
    // 2022年后微信进一步收紧，建议使用手机号快速验证组件

    // 3. 发送 code 到后端换取 token
    const [err, res] = await uni.request({
      url: '/api/auth/wx-login',
      method: 'POST',
      data: { code: loginRes.code }
    })

    if (err || res.data.code !== 0) throw new Error('登录失败')

    const { token, userInfo } = res.data.data

    // 4. 存储登录状态
    uni.setStorageSync('token', token)
    uni.setStorageSync('userInfo', userInfo)

    return { token, userInfo }
  }

  // 静默登录（检查 session 是否过期）
  const silentLogin = async () => {
    try {
      await uni.checkSession()
      // session 有效，使用缓存的 token
      return uni.getStorageSync('token')
    } catch {
      // session 过期，重新登录
      const { token } = await login()
      return token
    }
  }

  return { login, silentLogin }
}
```

### 微信手机号快速验证（推荐）

```vue
<template>
  <!-- 微信小程序端 -->
  <!-- #ifdef MP-WEIXIN -->
  <button open-type="getPhoneNumber" @getphonenumber="onGetPhone">
    微信手机号一键登录
  </button>
  <!-- #endif -->
</template>

<script setup>
const onGetPhone = async (e) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return

  // 将 code 发送到后端解密手机号
  const [err, res] = await uni.request({
    url: '/api/auth/wx-phone',
    method: 'POST',
    data: { code: e.detail.code }
  })

  if (!err && res.data.code === 0) {
    const { token, phone } = res.data.data
    uni.setStorageSync('token', token)
    uni.showToast({ title: '登录成功' })
  }
}
</script>
```

### 安全要点

- **code 只能使用一次**，5 分钟内有效
- **session_key 不得传到前端**，仅在后端使用
- 用户 openid 是唯一标识，unionid 用于多公众号/小程序互通
- token 应设置合理过期时间（建议 7 天），支持无感刷新

---

## 7. 图片上传与压缩

### 选择 + 压缩 + 上传

```js
// composables/useImageUpload.js
export const useImageUpload = (options = {}) => {
  const {
    maxCount = 9,
    maxSize = 2 * 1024 * 1024,  // 2MB
    quality = 80,
    uploadUrl = '/api/upload'
  } = options

  const images = ref([])
  const uploading = ref(false)

  // 选择图片
  const chooseImages = async () => {
    const remaining = maxCount - images.value.length
    if (remaining <= 0) {
      uni.showToast({ title: `最多选择${maxCount}张`, icon: 'none' })
      return
    }
    const [err, res] = await uni.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    if (err) return

    // 压缩并添加
    for (const path of res.tempFilePaths) {
      const compressed = await compressImage(path)
      images.value.push({ path: compressed, status: 'pending', url: '' })
    }
  }

  // 压缩图片
  const compressImage = async (src) => {
    // #ifdef APP-PLUS
    const [err, res] = await uni.compressImage({
      src,
      quality,
      width: '1080px'  // 限制最大宽度
    })
    return err ? src : res.tempFilePath
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序使用 canvas 压缩
    const [err, res] = await uni.compressImage({ src, quality })
    return err ? src : res.tempFilePath
    // #endif

    // #ifdef H5
    return src  // H5 端 chooseImage 的 sizeType: compressed 已压缩
    // #endif
  }

  // 上传单张
  const uploadOne = async (item) => {
    item.status = 'uploading'
    try {
      const [err, res] = await uni.uploadFile({
        url: uploadUrl,
        filePath: item.path,
        name: 'file',
        header: { Authorization: `Bearer ${uni.getStorageSync('token')}` }
      })
      if (err) throw err
      const data = JSON.parse(res.data)
      item.url = data.url
      item.status = 'success'
      return data.url
    } catch (e) {
      item.status = 'error'
      throw e
    }
  }

  // 批量上传
  const uploadAll = async () => {
    uploading.value = true
    const pending = images.value.filter(i => i.status === 'pending' || i.status === 'error')
    try {
      // 串行上传避免并发过多
      for (const item of pending) {
        await uploadOne(item)
      }
    } finally {
      uploading.value = false
    }
    return images.value.filter(i => i.status === 'success').map(i => i.url)
  }

  // 删除
  const removeImage = (index) => {
    images.value.splice(index, 1)
  }

  return { images, uploading, chooseImages, uploadAll, removeImage }
}
```

### 使用示例

```vue
<template>
  <view class="image-grid">
    <view v-for="(img, index) in images" :key="index" class="image-item">
      <image :src="img.path" mode="aspectFill" @click="previewImage(index)" />
      <view v-if="img.status === 'uploading'" class="uploading-mask">上传中...</view>
      <uni-icons type="clear" @click="removeImage(index)" class="delete-btn" />
    </view>
    <view v-if="images.length < 9" class="add-btn" @click="chooseImages">
      <uni-icons type="plusempty" size="40" color="#ccc" />
    </view>
  </view>
  <button @click="uploadAll" :loading="uploading">上传全部</button>
</template>

<script setup>
import { useImageUpload } from '@/composables/useImageUpload'
const { images, uploading, chooseImages, uploadAll, removeImage } = useImageUpload()

const previewImage = (index) => {
  uni.previewImage({
    current: index,
    urls: images.value.map(i => i.path)
  })
}
</script>
```

---

## 8. 分页加载组合式函数

### 通用 usePagination

```js
// composables/usePagination.js
import { ref, computed } from 'vue'

export const usePagination = (fetchFn, options = {}) => {
  const {
    pageSize = 20,
    immediate = true
  } = options

  const list = ref([])
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref(null)

  const loadStatus = computed(() => {
    if (loading.value) return 'loading'
    if (list.value.length >= total.value && total.value > 0) return 'noMore'
    return 'more'
  })

  const noMore = computed(() => loadStatus.value === 'noMore')

  // 加载数据
  const loadData = async (isRefresh = false) => {
    if (loading.value) return
    if (!isRefresh && noMore.value) return

    if (isRefresh) {
      page.value = 1
      error.value = null
    }

    loading.value = true
    try {
      const result = await fetchFn({
        page: page.value,
        pageSize
      })

      const items = result.list || result.data || result.records || []
      total.value = result.total || 0

      if (isRefresh) {
        list.value = items
      } else {
        list.value = [...list.value, ...items]
      }

      // 如果服务端不返回 total，根据返回数量判断
      if (!result.total && items.length < pageSize) {
        total.value = list.value.length
      }

      page.value++
    } catch (e) {
      error.value = e
      if (isRefresh) list.value = []
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  // 刷新
  const refresh = async () => {
    refreshing.value = true
    await loadData(true)
  }

  // 加载更多
  const loadMore = () => loadData(false)

  // 重置
  const reset = () => {
    list.value = []
    page.value = 1
    total.value = 0
    error.value = null
  }

  // 立即加载
  if (immediate) loadData(true)

  return {
    list, loading, refreshing, loadStatus, noMore, error, total,
    refresh, loadMore, reset
  }
}
```

### 使用示例

```vue
<template>
  <scroll-view
    scroll-y
    style="height: 100vh"
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="refresh"
    @scrolltolower="loadMore"
  >
    <view v-for="item in list" :key="item.id" class="item">
      <text>{{ item.title }}</text>
    </view>
    <uni-load-more :status="loadStatus" />
  </scroll-view>
</template>

<script setup>
import { usePagination } from '@/composables/usePagination'

const fetchArticles = async ({ page, pageSize }) => {
  const [err, res] = await uni.request({
    url: '/api/articles',
    data: { page, pageSize }
  })
  if (err) throw err
  return res.data.data  // { list: [], total: 100 }
}

const { list, loading, refreshing, loadStatus, refresh, loadMore } = usePagination(fetchArticles)
</script>
```

### 第三方分页组件推荐

| 组件 | 特点 |
|------|------|
| **z-paging** | 一体化下拉刷新+上拉加载，开箱即用，文档完善，推荐首选 |
| **mescroll-uni** | 老牌组件，支持 mixin 方式，兼容性好 |
| **uView u-loadmore** | uView UI 生态组件 |

```vue
<!-- z-paging 示例 -->
<template>
  <z-paging ref="paging" v-model="list" @query="queryList">
    <view v-for="item in list" :key="item.id">{{ item.title }}</view>
  </z-paging>
</template>

<script setup>
import { ref } from 'vue'

const paging = ref()
const list = ref([])

const queryList = async (pageNo, pageSize) => {
  const [err, res] = await uni.request({
    url: '/api/list',
    data: { page: pageNo, size: pageSize }
  })
  // 请求结束后调用 complete，传入数据数组
  paging.value.complete(err ? [] : res.data.data.list)
}
</script>
```

---

## 9. 请求封装最佳实践

### 完整请求封装

```js
// utils/request.js
const BASE_URL = ''  // 由拦截器统一添加

const request = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
        ...options.header
      },
      timeout: options.timeout || 15000,
      success: (res) => {
        const { statusCode, data } = res
        if (statusCode === 200) {
          if (data.code === 0 || data.code === 200) {
            resolve(data.data)
          } else if (data.code === 401) {
            uni.removeStorageSync('token')
            uni.reLaunch({ url: '/pages/login/login' })
            reject(new Error('登录过期'))
          } else {
            uni.showToast({ title: data.msg || '请求失败', icon: 'none' })
            reject(new Error(data.msg))
          }
        } else {
          uni.showToast({ title: `服务器错误(${statusCode})`, icon: 'none' })
          reject(new Error(`HTTP ${statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 快捷方法
export const get = (url, data) => request({ url, method: 'GET', data })
export const post = (url, data) => request({ url, method: 'POST', data })
export const put = (url, data) => request({ url, method: 'PUT', data })
export const del = (url, data) => request({ url, method: 'DELETE', data })

export default request
```

### API 模块化

```js
// api/user.js
import { get, post } from '@/utils/request'

export const userApi = {
  login: (data) => post('/api/user/login', data),
  getProfile: () => get('/api/user/profile'),
  updateProfile: (data) => post('/api/user/profile', data),
}

// api/order.js
import { get, post, del } from '@/utils/request'

export const orderApi = {
  getList: (params) => get('/api/orders', params),
  getDetail: (id) => get(`/api/orders/${id}`),
  create: (data) => post('/api/orders', data),
  cancel: (id) => del(`/api/orders/${id}`),
}
```

---

## 10. 常见调试技巧

### condition 调试启动页

```json
// pages.json
{
  "condition": {
    "current": 0,
    "list": [
      { "name": "订单详情", "path": "pages/order/detail", "query": "id=123" },
      { "name": "商品页", "path": "pages-shop/goods/goods", "query": "goodsId=456" },
      { "name": "个人中心", "path": "pages/mine/mine" }
    ]
  }
}
```

### 平台差异调试

```js
// 输出当前平台信息
console.log('编译平台:', process.env.UNI_PLATFORM)
// mp-weixin | h5 | app-plus | mp-alipay ...

// 调试专用代码
// #ifdef H5
console.log('=== H5 调试模式 ===')
// #endif

// 环境变量
console.log('环境:', import.meta.env.VITE_APP_ENV)  // development | production
```

### vConsole（H5 移动端调试）

```js
// main.js
// #ifdef H5
if (import.meta.env.DEV) {
  import('vconsole').then(({ default: VConsole }) => {
    new VConsole()
  })
}
// #endif
```

---

## 11. 路由守卫与权限管理

### uni.addInterceptor 拦截方案（推荐）

```js
// utils/router-guard.js
const whiteList = ['/pages/index/index', '/pages/login/login']

function routeInterceptor(args) {
  const token = uni.getStorageSync('token')
  const url = args.url.split('?')[0]
  if (!token && !whiteList.includes(url)) {
    uni.navigateTo({ url: '/pages/login/login' })
    return false
  }
}

// 拦截所有路由方法
;['navigateTo', 'redirectTo', 'reLaunch'].forEach(method => {
  uni.addInterceptor(method, { invoke: routeInterceptor })
})
```

### pages.json needLogin + uniIdRouter

```json
// pages.json — 配合 uni-id-pages 自动拦截
{
  "uniIdRouter": {
    "loginPage": "uni_modules/uni-id-pages/pages/login/login-withpwd",
    "needLogin": ["pages/user/", "pages/order/"]
  },
  "pages": [
    {
      "path": "pages/user/profile",
      "style": { "navigationBarTitleText": "个人中心", "needLogin": true }
    }
  ]
}
```

### tabBar 页面登录检查

`switchTab` 拦截在部分平台有限制，建议在 tabBar 页面 `onShow` 中补充检查：

```js
import { onShow } from '@dcloudio/uni-app'

onShow(() => {
  if (!uni.getStorageSync('token')) {
    uni.navigateTo({ url: '/pages/login/login' })
  }
})
```

### 角色权限控制

```js
// composables/usePermission.js
import { useUserStore } from '@/store/user'

export function usePermission() {
  const userStore = useUserStore()

  const hasRole = (role) => userStore.roles.includes(role)
  const hasPermission = (perm) => userStore.permissions.includes(perm)

  return { hasRole, hasPermission }
}
```

```vue
<!-- 按钮级权限控制 -->
<template>
  <button v-if="hasPermission('order:delete')" @click="deleteOrder">删除</button>
</template>

<script setup>
import { usePermission } from '@/composables/usePermission'
const { hasPermission } = usePermission()
</script>
```

> **注意**：前端权限仅控制 UI 展示，后端接口必须做二次校验。
