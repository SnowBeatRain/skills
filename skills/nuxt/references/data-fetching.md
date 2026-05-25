# 数据获取

## 核心概念

Nuxt 提供三种数据获取方式，解决 SSR 场景下的双重请求问题（服务端渲染 + 客户端水合）：

| 工具 | 用途 | SSR 安全 |
|---|---|---|
| `useFetch` | 最常用的数据获取 composable | ✅ |
| `useAsyncData` | 需要自定义 key 或复杂逻辑 | ✅ |
| `$fetch` | 底层 HTTP 客户端（在组件 setup 中避免裸用） | ❌（组件中） |

**核心规则**：组件 `<script setup>` 中必须用 `useFetch` / `useAsyncData` 包裹请求，不可裸用 `$fetch`（否则服务端渲染一次 + 客户端水合再请求一次）。

## useFetch

```vue
<script setup lang="ts">
// 基础用法
const { data, status, error, refresh, clear } = await useFetch('/api/users')

// 带选项
const { data: user } = await useFetch(`/api/users/${id}`, {
  // HTTP 方法
  method: 'POST',
  body: { name: 'John' },

  // 查询参数（响应式）
  query: { page: currentPage },

  // 请求头
  headers: { 'X-Custom': 'value' },

  // 只选取部分字段（减少 payload）
  pick: ['id', 'name', 'email'],

  // 数据转换
  transform: (data) => data.items.map(item => ({ ...item, fullName: `${item.first} ${item.last}` })),

  // 缓存控制
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],

  // 懒加载（不阻塞导航）
  lazy: true,

  // 仅客户端获取
  server: false,

  // 立即执行（默认 true）
  immediate: true,

  // 监听响应式源自动刷新
  watch: [page, filters],

  // 去重策略
  dedupe: 'cancel', // 'cancel' | 'defer'
})
</script>
```

## useAsyncData

用于需要自定义 key 或更复杂数据获取逻辑的场景：

```vue
<script setup lang="ts">
// 基础用法
const { data, status, error, refresh } = await useAsyncData(
  'users-list',  // 唯一 key
  () => $fetch('/api/users')
)

// 组合多个请求
const { data } = await useAsyncData('dashboard', async () => {
  const [users, posts, stats] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
    $fetch('/api/stats'),
  ])
  return { users, posts, stats }
})

// 依赖其他数据
const { data: user } = await useFetch('/api/user/me')
const { data: permissions } = await useAsyncData(
  'permissions',
  () => $fetch(`/api/permissions/${user.value.id}`),
  { watch: [user] }
)
```

## Lazy 变体

不阻塞导航的懒加载版本：

```vue
<script setup lang="ts">
// 页面立即展示，数据异步加载
const { data, status } = useLazyFetch('/api/posts')
// status: 'idle' | 'pending' | 'success' | 'error'
</script>

<template>
  <div>
    <div v-if="status === 'pending'">加载中...</div>
    <div v-else-if="status === 'error'">加载失败</div>
    <div v-else>
      <div v-for="post in data" :key="post.id">{{ post.title }}</div>
    </div>
  </div>
</template>
```

## 刷新与清除

```vue
<script setup lang="ts">
const { data, refresh, clear, status } = await useFetch('/api/posts')

// 手动刷新
const handleRefresh = () => refresh()

// 清除数据
const handleClear = () => clear()

// 全局刷新（通过 key）
const nuxtApp = useNuxtApp()
nuxtApp.hooks.hook('app:data:refresh', (keys) => {
  // 有数据被刷新时触发
})

// 使用 refreshNuxtData 刷新指定 key 的数据
await refreshNuxtData('users-list')

// 刷新所有数据
await refreshNuxtData()

// 清除所有缓存数据
clearNuxtData()
</script>
```

## $fetch 的正确使用

```vue
<script setup lang="ts">
// ❌ 错误：组件中裸用 $fetch
const data = await $fetch('/api/users')

// ✅ 正确：用 useFetch 包裹
const { data } = await useFetch('/api/users')

// ✅ 正确：在事件处理器中用 $fetch（不在 setup 时运行）
async function createUser(userData: UserInput) {
  const newUser = await $fetch('/api/users', {
    method: 'POST',
    body: userData,
  })
  // 刷新列表
  await refresh()
}
</script>
```

**$fetch 适用场景**：
- 事件处理器中（onClick、onSubmit）
- `server/api/` 中调用其他 API
- `useAsyncData` 的 fetcher 函数中

## 错误处理

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/users')

// 监听错误
watch(error, (newError) => {
  if (newError) {
    console.error('请求失败:', newError.message)
  }
})
</script>

<template>
  <div>
    <div v-if="error">
      <p>错误 {{ error.statusCode }}: {{ error.message }}</p>
      <button @click="refresh()">重试</button>
    </div>
    <div v-else>{{ data }}</div>
  </div>
</template>
```

## 类型安全

```typescript
// server/api/users.get.ts
export default defineEventHandler(async () => {
  return [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
  ]
})
```

```vue
<script setup lang="ts">
// 自动推断类型（基于 server/api/ 的返回类型）
const { data } = await useFetch('/api/users')
// data 类型自动为 Ref<{ id: number; name: string; email: string }[] | null>
</script>
```

## 请求拦截

```vue
<script setup lang="ts">
const { data } = await useFetch('/api/protected', {
  onRequest({ request, options }) {
    // 设置请求头
    options.headers.set('Authorization', `Bearer ${token.value}`)
  },
  onRequestError({ request, error }) {
    // 请求错误处理
  },
  onResponse({ response }) {
    // 处理响应
  },
  onResponseError({ response }) {
    // 响应错误处理（如 401 跳转登录）
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
})
</script>
```
