# 高级功能参考

## nvue 原生渲染

nvue 页面使用原生渲染引擎（Weex），在 App 端性能优于 webview 渲染。

### 何时使用 nvue

1. 需要高性能长列表（`<list>` / `<waterfall>` 组件，自动回收离屏内存）
2. 复杂下拉刷新（`<refresh>` 组件）
3. 左右拖动列表
4. 区域滚动 + 横向拖动 + 吸顶效果
5. 需要自定义键盘按钮文字（如"发送"替代"完成"）
6. map/video 等原生组件层级问题
7. 直播推流（`<live-pusher>` 组件）
8. 极致 App 启动速度优化（搭配 fast 启动模式）

### nvue 核心限制

```
布局：只支持 flex（默认 flex-direction: column）
文本：只能在 <text> 组件中
v-show：不支持，只能用 v-if
class 绑定：只支持数组语法 :class="[cls1, cls2]"
背景图：不支持 CSS 背景图，用 <image> 组件 + 层叠实现
选择器：只支持 class 选择器（无 id、元素、后代选择器）
单位：默认 px（非 rpx），需用 uni.upx2px() 转换
页面滚动：自动包裹 scroller，可用 disableScroll: true 禁用
动画：不支持 CSS 动画，使用 BindingX 或 weex.animation
```

### nvue 高性能列表

```vue
<!-- nvue 专属 list 组件（自动回收内存） -->
<list>
  <cell v-for="item in list" :key="item.id">
    <text>{{ item.name }}</text>
  </cell>
  <loading @loading="loadMore">
    <text>加载中...</text>
  </loading>
</list>

<!-- 瀑布流 -->
<waterfall column-count="2" column-width="auto">
  <cell v-for="item in list" :key="item.id">
    <image :src="item.image" mode="widthFix" />
  </cell>
</waterfall>
```

---

## RenderJS（视图层 JS）

RenderJS 是运行在视图层的 JS，比 WXS 更强大，支持完整的 ES6、DOM 操作、第三方库。

**平台支持**：App-vue（2.5.5+） + H5，不支持小程序和 nvue

### 两大核心作用

1. **大幅降低通信损耗**：直接在视图层操作元素，避免逻辑层↔视图层多次通信
2. **运行 for web 的 JS 库**：可操作 DOM/window，引入 echarts、three.js 等库

### 基本用法

```vue
<template>
  <view @click="handler.onClick">点击</view>
  <canvas canvas-id="myChart" :change:prop="handler.updateChart" :prop="chartData" />
</template>

<script>
export default {
  data() {
    return { chartData: { x: 1, y: 2 } }
  },
  methods: {
    onDataChanged(data) {
      console.log('renderjs 回调:', data)
    }
  }
}
</script>

<script module="handler" lang="renderjs">
export default {
  mounted() {
    // 可操作 DOM、window、引入第三方库
    // 动态加载 echarts
    const script = document.createElement('script')
    script.src = './static/echarts.min.js'
    document.head.appendChild(script)
  },
  methods: {
    onClick(e, ownerInstance) {
      // 视图层直接操作，60fps
      ownerInstance.callMethod('onDataChanged', { msg: 'clicked' })
    },
    // :change:prop 监听数据变化，自动触发
    updateChart(newValue, oldValue, ownerInstance, instance) {
      // newValue 是变化后的数据，在此重绘图表
      console.log('数据变化:', newValue)
    }
  }
}
</script>
```

### :change:prop 数据绑定机制

renderjs 不能直接访问逻辑层数据，通过 `:change:prop` 实现数据同步：

```vue
<template>
  <!-- :prop 传数据，:change:prop 监听变化 -->
  <view :prop="listData" :change:prop="listHandler.render"></view>
</template>

<script>
export default {
  data() { return { listData: [1, 2, 3] } }
}
</script>

<script module="listHandler" lang="renderjs">
export default {
  methods: {
    render(newValue, oldValue, ownerInstance, instance) {
      // newValue 变化时自动执行
      // instance 是当前视图层组件实例
      // ownerInstance 是逻辑层组件实例
    }
  }
}
</script>
```

### 引入第三方库（推荐动态 script）

```vue
<script module="chart" lang="renderjs">
export default {
  mounted() {
    this.loadScript('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js')
      .then(() => this.initChart())
  },
  methods: {
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    },
    initChart() {
      const canvas = document.querySelector('[canvas-id=myChart]')
      // 使用 echarts 初始化
    }
  }
}
</script>
```

### 注意事项

1. **仅支持内联**，不能写在外部文件
2. **不要直接引用大型类库**，推荐通过动态创建 `<script>` 加载
3. **支持 Vue 生命周期**（mounted 等），但不支持 beforeDestroy/unmounted
4. **不可直接访问逻辑层数据**，必须通过 `:prop` + `:change:prop` 传递
5. **this.$ownerInstance.callMethod()** 只能调用 Options API 中 methods 定义的方法
6. **vue3 项目不支持 `<script setup>` 用法**
7. App 端资源路径相对于根目录计算：`./static/test.js`
8. **一次性传递数据**：避免频繁从逻辑层向渲染层发消息，尽量一次性给到
9. H5 端逻辑层和视图层在同一环境，相当于 mixin，可直接访问逻辑层数据
10. nvue 不可用，应使用 bindingx 技术

### RenderJS vs WXS vs BindingX 选型

| 场景 | 推荐方案 | 平台 |
|------|---------|------|
| App/H5 端复杂动画/图表 | RenderJS（最强大） | App-vue, H5 |
| 微信小程序跟手滑动 | WXS | 微信小程序 |
| App-nvue 高性能交互 | BindingX | App-nvue |
| 实时输入过滤 | WXS | 多平台 |
| 操作 DOM/运行第三方库 | RenderJS | App-vue, H5 |

---

## 国际化（i18n）

### Vue 页面多语言

```js
// main.js
import { createSSRApp } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './locale/en.json'
import zhHans from './locale/zh-Hans.json'

export function createApp() {
  const app = createSSRApp(App)
  const i18n = createI18n({
    locale: uni.getLocale(),     // 自动跟随系统语言
    messages: { en, 'zh-Hans': zhHans }
  })
  app.use(i18n)
  return { app }
}
```

```vue
<template>
  <text>{{ $t('hello') }}</text>
  <button @click="changeLocale">切换语言</button>
</template>

<script setup>
const changeLocale = () => {
  uni.setLocale('en')          // 切换语言
}
// 监听语言变化
uni.onLocaleChange((res) => {
  console.log('语言切换为:', res.locale)
})
</script>
```

### Locale 文件管理

```
├─locale
│  ├─zh-Hans.json    # 简体中文
│  ├─en.json         # 英文
│  ├─zh-Hant.json    # 繁体中文
│  └─ja.json         # 日文
```

```json
// locale/zh-Hans.json
{
  "hello": "你好",
  "welcome": "欢迎使用 {name}",
  "items": "有 {count} 个项目",
  "cart": {
    "title": "购物车",
    "empty": "购物车为空"
  }
}
```

### 嵌套键名与插值

```vue
<!-- 嵌套键名用点号访问 -->
<text>{{ $t('cart.title') }}</text>

<!-- 插值：{name} 被替换 -->
<text>{{ $t('welcome', { name: '小明' }) }}</text>
<!-- 输出：欢迎使用 小明 -->
```

### pages.json 中的 i18n

```json
{
  "globalStyle": {
    "navigationBarTitleText": "%app.title%"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "%tab.home%" }
    ]
  }
}
```

`%key%` 语法会在编译时自动替换为对应语言的文本。

### 动态语言切换 + 持久化

```js
// composables/useLocale.js
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

export function useLocale() {
  const { locale } = useI18n()
  const currentLocale = ref(uni.getStorageSync('locale') || uni.getLocale())

  const setLocale = (lang) => {
    locale.value = lang
    uni.setLocale(lang)
    uni.setStorageSync('locale', lang)
  }

  return { currentLocale, setLocale }
}
```

### 复数规则

vue-i18n 支持复数格式：

```json
{
  "apple": "苹果 | 苹果",
  "apple_count": "没有苹果 | 1 个苹果 | {count} 个苹果"
}
```

```vue
<text>{{ $t('apple_count', 0) }}</text>  <!-- 没有苹果 -->
<text>{{ $t('apple_count', 1) }}</text>  <!-- 1 个苹果 -->
<text>{{ $t('apple_count', 5) }}</text>  <!-- 5 个苹果 -->
```

### 无障碍访问（a11y）

uni-app 提供基础的无障碍支持：

```html
<!-- aria-label 属性（H5 和 App 支持） -->
<view aria-label="导航菜单" role="navigation">
  <navigator url="/pages/home/home">首页</navigator>
</view>

<!-- 小程序使用 aria 等价属性 -->
<view role="button" aria-disabled="true">
  <text>禁用按钮</text>
</view>
```

**关键原则**：
1. 为图片和图标添加 `alt` 文本描述
2. 按钮和可交互元素使用 `role` 标明
3. 颜色对比度符合 WCAG 2.1 AA 标准
4. 焦点顺序合理，不可仅依赖视觉位置
5. 表单字段使用 `<label>` 关联

```

### pages.json 国际化

```
// 目录结构
locale/
├── en.json         { "index.title": "Home", "tab.home": "Home" }
└── zh-Hans.json    { "index.title": "首页", "tab.home": "首页" }
```

```json
// pages.json 中使用 %key% 语法
{
  "pages": [{ "path": "pages/index/index", "style": { "navigationBarTitleText": "%index.title%" } }],
  "tabBar": { "list": [{ "text": "%tab.home%" }] }
}
```

### 语言 API

```js
uni.getLocale()                  // 获取当前语言
uni.setLocale('zh-Hans')         // 设置语言
uni.onLocaleChange((e) => {})    // 监听语言切换
```

---

## 暗黑模式

### 配置启用

```json
// manifest.json
{
  "app-plus": { "darkmode": true, "themeLocation": "theme.json" },
  "h5": { "darkmode": true, "themeLocation": "theme.json" },
  "mp-weixin": { "darkmode": true, "themeLocation": "theme.json" }
}
```

### 主题变量

```json
// theme.json（项目根目录）
{
  "light": {
    "navBgColor": "#f8f8f8",
    "navTxtStyle": "black",
    "bgColor": "#ffffff",
    "txtColor": "#333333"
  },
  "dark": {
    "navBgColor": "#292929",
    "navTxtStyle": "white",
    "bgColor": "#1b1b1b",
    "txtColor": "#e0e0e0"
  }
}
```

```json
// pages.json 中引用
{ "navigationBarBackgroundColor": "@navBgColor", "navigationBarTextStyle": "@navTxtStyle" }
```

### CSS 适配

```css
@media (prefers-color-scheme: dark) {
  page { background-color: #1b1b1b; color: #e0e0e0; }
  .card { background-color: #2c2c2c; }
}
```

### 运行时检测

```js
const theme = uni.getSystemInfoSync().theme  // 'light' | 'dark'

// App.vue 中监听主题切换
import { onThemeChange } from '@dcloudio/uni-app'
onThemeChange((res) => { console.log('主题切换:', res.theme) })
```

---

## TypeScript 支持

### 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@dcloudio/types"]
  }
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

interface Item {
  id: number
  name: string
  price: number
}

const list = ref<Item[]>([])
const loading = ref<boolean>(false)

onLoad((options: { id?: string }) => {
  if (options?.id) fetchDetail(Number(options.id))
})
</script>
```

### 注意事项

- Vue3 + CLI 支持最新 TypeScript
- HBuilderX 内置 TS 3.7.5（Vue2）
- nvue + Vue2 不支持 TypeScript

---

## 环境变量

### Vue3 + Vite（推荐）

```
# .env.development
VITE_API_BASE=https://dev-api.example.com
VITE_APP_TITLE=开发环境

# .env.production
VITE_API_BASE=https://api.example.com
VITE_APP_TITLE=生产环境
```

```js
// 使用（前缀必须是 VITE_）
const apiBase = import.meta.env.VITE_API_BASE
```

### Vue2 + Webpack

```
# .env.development
VUE_APP_API_BASE=https://dev-api.example.com
```

```js
const apiBase = process.env.VUE_APP_API_BASE
```

---

## 性能优化

### 架构理解

- 非 H5 平台：逻辑层（JS）与视图层（渲染）分离，通信有延迟
- H5 平台：单层，无分离开销

### 关键优化策略

1. **数据管理**：只在 `data()` / `ref()` 中定义视图需要的数据，非视图数据放普通变量
2. **长列表**：
   - App-nvue：使用 `<list>` 组件（自动回收内存）
   - App-vue：页面级滚动优于 `<scroll-view>` 区域滚动
   - 通用：使用 uni-ui 的 `<uni-list>` 组件
   - 实现分页加载，限制数据量
3. **高频交互**：使用 renderjs（App-vue/H5）或 wxs（微信小程序）避免通信延迟
4. **组件拆分**：将列表项封装为独立组件，实现细粒度更新
5. **图片优化**：避免大图引起白屏，使用压缩图片，大图用网络地址

---

## SSR（服务端渲染）

**优势**：更好的 SEO、更快的首屏加载（HTML 直出）、慢网络/设备友好

### 核心约束

- 只有 `beforeCreate` 和 `created` 在服务端执行
- 浏览器 API（window/document）只能在 `onMounted` 后使用
- 避免副作用（定时器、全局变量）
- 使用 `ssrRef` 保持服务端/客户端状态一致

### SSR 项目搭建

uni-app SSR 项目通过 `--ssr` 参数创建：

```bash
npx degit dcloudio/uni-preset-vue#vite my-ssr-app
# 在 manifest.json 中启用 SSR
```

### SSR 数据获取模式

```vue
<script setup>
import { ref, onServerPrefetch } from 'vue'
import { ssrRef } from '@dcloudio/uni-app'

const data = ssrRef([])  // SSR 安全的数据引用

onServerPrefetch(async () => {
  // 服务端执行数据获取，客户端复用
  const [err, res] = await uni.request({ url: '/api/data' })
  if (!err) data.value = res.data
})
</script>
```

### SSR 部署

1. **uniCloud 部署**（推荐）：使用 uniCloud 前端网页托管 + SSR 云函数
2. **Node.js 自部署**：运行 `npm run build:ssr` 后用 Node 服务渲染

### SSR vs SSG 选型

| 方案 | 适用场景 | SEO | 部署复杂度 |
|------|---------|-----|----------|
| SSR | 动态内容、实时数据 | 优秀 | 需运行 Node 服务 |
| SSG | 静态内容、博客、文档 | 优秀 | 最低（静态文件） |
| CSR | 管理后台、工具类 | 差 | 低 |

### PWA / H5 离线策略

uni-app H5 端可以使用 PWA 实现离线访问：

```js
// vite.config.js 中配置 Service Worker
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    uni(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\//i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50 } }
          },
          {
            urlPattern: /^https:\/\/cdn\.example\.com\//i,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache', expiration: { maxEntries: 100 } }
          }
        ]
      }
    })
  ]
})
```

**离线策略模式**：
- **NetworkFirst**：优先网络，失败时回退缓存（API 请求）
- **CacheFirst**：优先缓存，无缓存时请求网络（静态资源）
- **StaleWhileRevalidate**：返回缓存同时后台更新（不关键的数据）

---

## WebSocket

```js
// 创建连接
const socketTask = uni.connectSocket({
  url: 'wss://api.example.com/ws',
  header: { 'Authorization': 'Bearer token' }
})

// 监听连接打开
socketTask.onOpen(() => {
  console.log('WebSocket 已连接')
  socketTask.send({ data: JSON.stringify({ type: 'ping' }) })
})

// 监听消息
socketTask.onMessage((res) => {
  const data = JSON.parse(res.data)
  console.log('收到消息:', data)
})

// 监听关闭
socketTask.onClose(() => { console.log('连接关闭') })

// 监听错误
socketTask.onError((err) => { console.error('连接错误:', err) })

// 关闭连接
socketTask.close({ code: 1000, reason: '正常关闭' })
```

> 注意：微信小程序最多 5 个 WebSocket 连接。

---

## 请求拦截器

```js
// 全局请求拦截
uni.addInterceptor('request', {
  invoke(args) {
    // 请求前：添加 baseURL 和 token
    if (!args.url.startsWith('http')) {
      args.url = 'https://api.example.com' + args.url
    }
    args.header = {
      ...args.header,
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    }
  },
  success(res) {
    // 响应后：统一处理 401
    if (res.data?.code === 401) {
      uni.removeStorageSync('token')
      uni.reLaunch({ url: '/pages/login/login' })
    }
  },
  fail(err) {
    uni.showToast({ title: '网络异常', icon: 'none' })
  }
})

// 路由拦截（登录守卫）
uni.addInterceptor('navigateTo', {
  invoke(args) {
    const token = uni.getStorageSync('token')
    const protectedPages = ['/pages/mine/mine', '/pages/order/order']
    if (!token && protectedPages.some(p => args.url.startsWith(p))) {
      uni.navigateTo({ url: '/pages/login/login' })
      return false  // 阻止原始跳转
    }
  }
})

// 移除拦截器
uni.removeInterceptor('request')
```

---

## Vite 构建配置

```js
// vite.config.js（仅 Vue3）
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }  // 生产环境移除 console
    }
  }
})
```

---

## WebView 组件

```vue
<template>
  <web-view
    :src="webUrl"
    :webview-styles="{ progress: { color: '#007AFF' } }"
    @message="onMessage"
  />
</template>

<script setup>
import { ref } from 'vue'

const webUrl = ref('https://example.com')

const onMessage = (e) => {
  // 接收 H5 页面通过 uni.postMessage 发来的消息
  console.log('来自 web-view:', e.detail.data)
}
</script>
```

**注意**：
- 小程序端需在后台配置业务域名白名单
- 本地 HTML 文件放在 `/hybrid/html/` 或 `/static/` 目录
- App 端可用 `evalJS()` 与 web-view 双向通信

---

## Vite 配置

uni-app Vue3 项目基于 Vite 构建，通过 `vite.config.js` 配置。

### 路径别名

```js
// vite.config.js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'components'),
      '@composables': resolve(__dirname, 'composables'),
      '@store': resolve(__dirname, 'store'),
      '@utils': resolve(__dirname, 'utils')
    }
  }
})
```

### 开发代理（H5 跨域）

```js
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

**注意**：代理仅 H5 开发环境有效。生产环境需 Nginx 反向代理或后端 CORS。

### 构建优化

```js
export default defineConfig({
  plugins: [uni()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  }
})
```

### 全局常量

```js
export default defineConfig({
  plugins: [uni()],
  define: {
    __APP_VERSION__: JSON.stringify(require('./package.json').version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
```

详细 CI/CD 与 Vite 配置见 `references/cicd.md`。
