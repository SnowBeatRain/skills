# uni-app 生命周期完整参考

官方文档：https://uniapp.dcloud.net.cn/collocation/frame/lifecycle.html

## 应用生命周期（App.vue）

| 钩子 | 说明 | Vue3 import |
|------|------|-------------|
| `onLaunch` | 应用初始化完成，全局只触发一次 | `@dcloudio/uni-app` |
| `onShow` | 应用启动或从后台进入前台 | `@dcloudio/uni-app` |
| `onHide` | 应用进入后台 | `@dcloudio/uni-app` |
| `onError` | 脚本错误或 API 调用失败 | `@dcloudio/uni-app` |
| `onUniNViewMessage` | nvue 页面发送消息（仅 App） | `@dcloudio/uni-app` |
| `onUnhandledRejection` | 未处理的 Promise 拒绝 | `@dcloudio/uni-app` |
| `onPageNotFound` | 页面不存在时触发 | `@dcloudio/uni-app` |
| `onThemeChange` | 主题变化（需配置 darkmode） | `@dcloudio/uni-app` |
| `onLastPageBackPress` | 最后一个页面按返回键（仅 App） | `@dcloudio/uni-app` |

```vue
<!-- App.vue -->
<script setup>
import { onLaunch, onShow, onHide, onError } from '@dcloudio/uni-app'

onLaunch((options) => {
  // options.path: 打开的页面路径
  // options.query: 打开时的 query 参数
  // options.scene: 打开场景值（小程序）
  console.log('App 初始化', options)
})

onShow(() => {
  // 每次从后台进入前台都会触发
})

onError((err) => {
  console.error('全局错误:', err)
  // 可上报到监控平台
})
</script>
```

## 页面生命周期

| 钩子 | 说明 | 参数 | 平台限制 |
|------|------|------|----------|
| `onLoad` | 页面加载，只触发一次 | options（页面参数对象） | 全平台 |
| `onShow` | 页面显示（每次进入页面均触发） | — | 全平台 |
| `onReady` | 页面首次渲染完成，只触发一次 | — | 全平台 |
| `onHide` | 页面隐藏（navigateTo 跳走时触发） | — | 全平台 |
| `onUnload` | 页面卸载（redirectTo/navigateBack 时触发） | — | 全平台 |
| `onPullDownRefresh` | 下拉刷新（需配置 enablePullDownRefresh） | — | 全平台 |
| `onReachBottom` | 滚动到页面底部 | — | 全平台 |
| `onPageScroll` | 页面滚动 | { scrollTop } | 全平台 |
| `onResize` | 屏幕旋转/尺寸变化 | { size } | 全平台 |
| `onTabItemTap` | 当前 tab 页被再次点击 | { index, text, pagePath } | 全平台 |
| `onShareAppMessage` | 用户点击右上角分享 | { from, target } | 小程序 |
| `onShareTimeline` | 用户点击"分享到朋友圈" | — | 仅微信 |
| `onAddToFavorites` | 用户点击收藏 | — | 仅微信 |
| `onNavigationBarButtonTap` | 原生导航栏按钮点击 | { index } | 仅 App（非鸿蒙） |
| `onNavigationBarSearchInputChanged` | 导航栏搜索内容变化 | { text } | 仅 App（非鸿蒙） |
| `onNavigationBarSearchInputConfirmed` | 导航栏搜索确认 | { text } | 仅 App（非鸿蒙） |
| `onBackPress` | 页面返回（返回 true 阻止默认返回） | { from } | App / H5 |

```vue
<script setup>
import {
  onLoad, onShow, onReady, onHide, onUnload,
  onPullDownRefresh, onReachBottom, onPageScroll
} from '@dcloudio/uni-app'

onLoad((options) => {
  const { id, type } = options   // 接收 navigateTo url 中的 query 参数
})

onPullDownRefresh(async () => {
  await fetchData()
  uni.stopPullDownRefresh()      // 必须调用，否则加载动画不停
})

onReachBottom(() => {
  if (hasMore.value) loadMore()
})

onPageScroll(({ scrollTop }) => {
  showBackTop.value = scrollTop > 300
})
</script>
```

## 组件生命周期

uni-app 组件支持 Vue 标准生命周期（非页面生命周期）：

| Vue3 钩子 | 说明 |
|-----------|------|
| `onBeforeMount` | 挂载前 |
| `onMounted` | 挂载后（DOM 可用） |
| `onBeforeUpdate` | 更新前 |
| `onUpdated` | 更新后 |
| `onBeforeUnmount` | 卸载前 |
| `onUnmounted` | 卸载后 |
| `onActivated` | `<keep-alive>` 激活时 |
| `onDeactivated` | `<keep-alive>` 停用时 |
| `onErrorCaptured` | 捕获子组件错误（错误边界） |

> 组件内**不能**使用 `onLoad`、`onShow` 等页面生命周期，只有页面才有这些钩子。这是最常见的错误之一。

---

## 生命周期时序图

```
App 启动：
  App.onLaunch → App.onShow → Page.onLoad → Page.onShow → Page.onReady

navigateTo（A → B）：
  A.onHide → B.onLoad → B.onShow → B.onReady

navigateBack（B → A）：
  B.onUnload → A.onShow

switchTab（A → B）：
  A.onHide → B.onLoad(首次) / B.onShow(后续)

redirectTo：
  当前页.onUnload → 新页.onLoad → 新页.onShow → 新页.onReady

reLaunch：
  所有页面.onUnload → 新页.onLoad → 新页.onShow → 新页.onReady
```

**Vue 钩子与 uni 钩子的顺序关系：**

```
onMounted → onReady（onMounted 先于 onReady）
onBeforeUnmount → onUnload 过程中触发
```

---

## 常见实战模式

### onLoad 数据加载

```vue
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const detail = ref(null)
const loading = ref(true)

onLoad(async (options) => {
  const { id } = options
  const [err, res] = await uni.request({ url: `/api/detail/${id}` })
  if (!err) detail.value = res.data.data
  loading.value = false
})
</script>
```

### onShow 数据刷新（适合需要实时更新的场景）

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'

// 从编辑页返回后刷新列表
onShow(() => {
  fetchList(true)
})
</script>
```

> **onLoad vs onShow**：`onLoad` 仅首次触发，适合初始化和接收参数；`onShow` 每次显示都触发，适合需要实时刷新的数据（如购物车、消息列表）。

### 下拉刷新完整流程

```json
// pages.json 开启下拉刷新
{
  "path": "pages/list/list",
  "style": { "enablePullDownRefresh": true }
}
```

```vue
<script setup>
import { onPullDownRefresh } from '@dcloudio/uni-app'

onPullDownRefresh(async () => {
  try {
    await fetchList(true)  // 重置并加载第一页
  } finally {
    uni.stopPullDownRefresh()  // 务必调用，否则动画不停
  }
})
</script>
```

### onPageScroll 性能优化

```vue
<script setup>
import { ref } from 'vue'
import { onPageScroll } from '@dcloudio/uni-app'

const showBackTop = ref(false)
let lastScrollTop = 0

// onPageScroll 触发频率极高，避免在回调中做重计算
onPageScroll(({ scrollTop }) => {
  // 节流：仅在变化超过阈值时更新
  if (Math.abs(scrollTop - lastScrollTop) > 100) {
    showBackTop.value = scrollTop > 300
    lastScrollTop = scrollTop
  }
})
</script>
```

### onUnload 清理资源

```vue
<script setup>
import { onUnload } from '@dcloudio/uni-app'

const timer = setInterval(() => { /* 轮询 */ }, 5000)
uni.$on('refresh', handler)

onUnload(() => {
  clearInterval(timer)         // 清除定时器
  uni.$off('refresh', handler) // 移除全局事件监听
  // 取消进行中的请求（如有）
})
</script>
```

### onBackPress 返回拦截

```vue
<script setup>
import { ref } from 'vue'
import { onBackPress } from '@dcloudio/uni-app'

const hasUnsavedChanges = ref(false)

onBackPress(() => {
  if (hasUnsavedChanges.value) {
    uni.showModal({
      title: '提示',
      content: '有未保存的内容，确认离开？',
      success: ({ confirm }) => {
        if (confirm) uni.navigateBack()
      }
    })
    return true  // 阻止默认返回
  }
  // 返回 false 或不返回 → 允许默认返回
})
</script>
```

### onTabItemTap 刷新当前 Tab

```vue
<script setup>
import { onTabItemTap } from '@dcloudio/uni-app'

// 用户再次点击当前 Tab 时滚动到顶部并刷新
onTabItemTap(() => {
  uni.pageScrollTo({ scrollTop: 0, duration: 300 })
  fetchList(true)
})
</script>
```

---

## Vue3 Composition API 用法

### 导入方式

```vue
<script setup>
// uni-app 页面钩子从 @dcloudio/uni-app 导入
import { onLoad, onShow, onReady, onHide, onUnload } from '@dcloudio/uni-app'

// Vue 标准钩子从 vue 导入
import { onMounted, onUnmounted, ref } from 'vue'

// 两者可以混用，各自按生命周期顺序触发
onMounted(() => { /* DOM 挂载后 */ })
onReady(() => { /* 页面渲染完成后，晚于 onMounted */ })
</script>
```

### 多次注册同一钩子

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'

// 可以多次注册同一钩子，全部都会执行
// 这对 composable 非常有用
onShow(() => { console.log('第一个 onShow') })
onShow(() => { console.log('第二个 onShow') })
</script>
```

### Composable 中使用生命周期

```js
// composables/usePageVisibility.js
import { ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'

export function usePageVisibility() {
  const isVisible = ref(true)

  onShow(() => { isVisible.value = true })
  onHide(() => { isVisible.value = false })

  return { isVisible }
}
```

```js
// composables/useAutoRefresh.js
import { onShow } from '@dcloudio/uni-app'

export function useAutoRefresh(fetchFn) {
  let isFirstShow = true

  onShow(() => {
    if (isFirstShow) {
      isFirstShow = false
      return  // 首次显示由 onLoad 处理
    }
    fetchFn()  // 后续显示自动刷新
  })
}
```

---

## Pinia Store 与生命周期交互

```vue
<!-- App.vue —— 全局初始化 -->
<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(() => {
  const userStore = useUserStore()
  // 启动时从缓存恢复登录态
  const token = uni.getStorageSync('token')
  if (token) userStore.setToken(token)
})
</script>
```

```vue
<!-- pages/mine/mine.vue —— 页面级 Token 检查 -->
<script setup>
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onShow(() => {
  // 每次进入个人中心，检查 Token 是否过期
  if (userStore.isTokenExpired) {
    userStore.refreshToken()
  }
})
</script>
```

```js
// 登出后重置状态并跳转
function logout() {
  const userStore = useUserStore()
  userStore.$reset()
  uni.removeStorageSync('token')
  uni.reLaunch({ url: '/pages/login/login' })
}
```

---

## 平台差异

| 钩子 | App | H5 | 微信 | 支付宝 | 鸿蒙 |
|------|-----|-----|------|--------|------|
| `onLoad` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `onShow` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `onReady` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `onBackPress` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `onShareAppMessage` | ❌ | ❌ | ✅ | ✅ | ❌ |
| `onShareTimeline` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `onAddToFavorites` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `onNavigationBarButtonTap` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `onTabItemTap` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `onPageScroll` | ✅ | ✅ | ✅ | ✅ | ✅ |

**鸿蒙特别注意：**
- `onNavigationBarButtonTap` 不可用（鸿蒙不支持 titleNView）
- `plus.globalEvent` 不可用，使用 `onShow`/`onHide` 替代 pause/resume
- `onUniNViewMessage` 仅 App（非鸿蒙）可用

---

## 常见陷阱

### 1. onShow 重复触发

```js
// ❌ 错误：navigateBack 返回 + 初始显示都会触发 onShow，可能导致重复请求
onShow(() => {
  fetchUserInfo()  // 每次返回都会调用
})

// ✅ 正确：区分首次加载和后续显示
let isLoaded = false
onLoad(() => {
  fetchUserInfo()
  isLoaded = true
})
onShow(() => {
  if (isLoaded) fetchUserInfo()  // 仅后续显示时刷新
})
```

### 2. 组件中误用页面钩子

```js
// ❌ 错误：在组件中使用 onLoad/onShow 不会触发
// components/MyComponent.vue
import { onLoad } from '@dcloudio/uni-app'
onLoad(() => { /* 永远不会执行 */ })

// ✅ 正确：组件用 Vue 钩子
import { onMounted } from 'vue'
onMounted(() => { /* 组件挂载后 */ })
```

### 3. 忘记 stopPullDownRefresh

```js
// ❌ 错误：请求失败时没有停止刷新动画
onPullDownRefresh(async () => {
  await fetchData()  // 如果报错，动画一直转
  uni.stopPullDownRefresh()
})

// ✅ 正确：用 try/finally 确保一定停止
onPullDownRefresh(async () => {
  try { await fetchData() }
  finally { uni.stopPullDownRefresh() }
})
```

### 4. onPageScroll 性能问题

```js
// ❌ 错误：高频触发中做复杂运算
onPageScroll(({ scrollTop }) => {
  // 这个回调每帧都可能触发，不要在里面做 DOM 查询或复杂计算
  document.querySelector('.header').style.opacity = scrollTop / 300
})

// ✅ 正确：用 ref 控制，必要时节流
onPageScroll(({ scrollTop }) => {
  showBackTop.value = scrollTop > 300  // 只更新简单的响应式变量
})
```

### 5. onBackPress 返回值

```js
// ❌ 错误：异步操作中返回 true 无效
onBackPress(() => {
  setTimeout(() => { return true }, 100)  // 无效！必须同步返回
})

// ✅ 正确：同步返回 true 阻止，然后异步处理
onBackPress(() => {
  uni.showModal({
    content: '确认退出？',
    success: ({ confirm }) => { if (confirm) uni.navigateBack() }
  })
  return true  // 同步阻止默认返回
})
```

### 6. nvue 页面生命周期差异

nvue 页面支持相同的生命周期钩子，但 `onReady` 触发时机可能与 vue 页面不同（原生渲染完成时间不同）。在 nvue 中操作 DOM（如获取节点信息）应在 `onReady` 之后。

> 鸿蒙上 nvue 走 Web 渲染（非原生渲染），时序与 vue 页面一致。

---

## App 端特有事件

```js
// #ifdef APP-PLUS
// 监听应用进入后台（Android/iOS）
plus.globalEvent.addEventListener('pause', () => {})
// 监听应用回到前台
plus.globalEvent.addEventListener('resume', () => {})
// #endif

// #ifdef APP-HARMONY
// 鸿蒙无 plus 对象，使用 onHide/onShow 替代
// App.vue 中的 onHide 等同于 pause
// App.vue 中的 onShow 等同于 resume
// #endif
```
