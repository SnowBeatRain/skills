# 避坑指南

## 数据获取

### ❌ 组件中裸用 $fetch

```vue
<script setup lang="ts">
// ❌ 导致双重请求：SSR 一次 + 客户端水合一次
const users = await $fetch('/api/users')

// ✅ 使用 useFetch（自动处理 SSR payload 传递）
const { data: users } = await useFetch('/api/users')
</script>
```

### ❌ 在 watch/事件中用 useFetch

```vue
<script setup lang="ts">
// ❌ useFetch 只应在 setup 顶层调用
watch(someRef, async () => {
  const { data } = await useFetch('/api/data')
})

// ✅ 使用 watch 选项让 useFetch 自动刷新
const { data } = await useFetch('/api/data', {
  watch: [someRef],
})

// ✅ 或在事件处理器中用 $fetch
async function handleClick() {
  const data = await $fetch('/api/data')
}
</script>
```

### ❌ 忽略 key 冲突

```vue
<script setup lang="ts">
// ❌ 同一页面多个 useFetch 请求相同 URL 但参数不同
const { data: page1 } = await useFetch('/api/posts', { query: { page: 1 } })
const { data: page2 } = await useFetch('/api/posts', { query: { page: 2 } })
// 可能因为 key 相同而共享缓存

// ✅ 使用唯一 key
const { data: page1 } = await useFetch('/api/posts', {
  key: 'posts-page-1',
  query: { page: 1 },
})
const { data: page2 } = await useFetch('/api/posts', {
  key: 'posts-page-2',
  query: { page: 2 },
})
</script>
```

## 水合问题

### ❌ 服务端/客户端数据不一致

```vue
<script setup lang="ts">
// ❌ Math.random() 服务端和客户端值不同，导致水合不匹配
const id = Math.random()

// ✅ 使用 useState 确保一致
const id = useState('random-id', () => Math.random())
</script>
```

### ❌ 在 SSR 中使用浏览器 API

```vue
<script setup lang="ts">
// ❌ localStorage 在服务端不存在
const theme = localStorage.getItem('theme')

// ✅ 方案 1：使用 useCookie
const theme = useCookie('theme', { default: () => 'light' })

// ✅ 方案 2：条件判断
const theme = ref('light')
if (import.meta.client) {
  theme.value = localStorage.getItem('theme') || 'light'
}

// ✅ 方案 3：onMounted 中执行
onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'light'
})
</script>
```

### ❌ 条件渲染导致水合不匹配

```vue
<template>
  <!-- ❌ 窗口宽度在 SSR 和客户端可能不同 -->
  <MobileMenu v-if="windowWidth < 768" />

  <!-- ✅ 使用 ClientOnly -->
  <ClientOnly>
    <MobileMenu v-if="windowWidth < 768" />
    <template #fallback>
      <div class="menu-placeholder" />
    </template>
  </ClientOnly>
</template>
```

## 状态管理

### ❌ 模块顶层定义响应式状态

```typescript
// app/composables/useCounter.ts

// ❌ SSR 中跨请求共享状态，用户 A 的数据泄露给用户 B
const count = ref(0)
export function useCounter() {
  return { count }
}

// ✅ 使用 useState
export function useCounter() {
  const count = useState('counter', () => 0)
  return { count }
}
```

### ❌ Pinia Store 中使用浏览器 API

```typescript
// ❌
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')
  return { theme }
})

// ✅
export const useSettingsStore = defineStore('settings', () => {
  const theme = useCookie('theme', { default: () => 'light' })
  return { theme }
})
```

## 中间件

### ❌ 中间件中使用异步 composable

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // ❌ useFetch 不应在中间件中调用
  const { data } = await useFetch('/api/auth/me')

  // ✅ 直接用 $fetch
  try {
    const user = await $fetch('/api/auth/me')
  } catch {
    return navigateTo('/login')
  }
})
```

## 路由

### ❌ 客户端导航后数据不更新

```vue
<script setup lang="ts">
// ❌ 路由参数变化但数据不刷新
const { data } = await useFetch(`/api/users/${route.params.id}`)

// ✅ 使用 watch 选项或响应式参数
const { data } = await useFetch(() => `/api/users/${route.params.id}`)
// 或
const { data } = await useFetch('/api/users/' + route.params.id, {
  watch: [() => route.params.id],
})
</script>
```

## 组件

### ❌ 事件处理器中遗漏 nodrag 等问题

```vue
<!-- ❌ 输入框在自定义组件中可能不响应 -->
<template>
  <input v-model="value" />
</template>

<!-- 这不是 React Flow 的问题，但类似地在 Nuxt 中要注意 -->
<!-- 确保第三方库的事件不被吞 -->
```

### ❌ 组件名称冲突

```
app/components/
├── Button.vue          → <Button />
└── ui/
    └── Button.vue      → <UiButton />（目录前缀）

<!-- ❌ 如果同时存在，需注意自动命名规则 -->
<!-- ✅ 使用有意义的前缀避免冲突 -->
```

## 配置

### ❌ runtimeConfig 中放敏感信息到 public

```typescript
// ❌ 客户端可见！
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      dbPassword: 'secret', // 会暴露到浏览器！
    },
  },
})

// ✅ 敏感信息放在顶层
export default defineNuxtConfig({
  runtimeConfig: {
    dbPassword: 'secret', // 仅服务端可见
    public: {
      apiBase: '/api',    // 安全的公开信息
    },
  },
})
```

### ❌ 运行时读取 process.env

```typescript
// server/api/data.ts

// ❌ process.env 可能不被 bundle
const secret = process.env.MY_SECRET

// ✅ 使用 useRuntimeConfig
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const secret = config.mySecret
})
```

## 部署

### ❌ 忘记设置环境变量

生产环境必须通过 `NUXT_` 前缀环境变量注入配置：

```bash
# ✅ 正确
NUXT_API_SECRET=prod-value node .output/server/index.mjs

# ❌ .env 文件在生产构建中不会自动加载
```

### ❌ SSG 中使用动态数据

```vue
<script setup lang="ts">
// ❌ SSG 模式下，构建时调用的 API 数据会被固化
const { data } = await useFetch('/api/realtime-data')

// ✅ 对需要实时数据的路由使用 ISR 或 SSR
// routeRules: { '/dashboard': { isr: 60 } }
</script>
```

## 性能

### ❌ 过大的 useFetch 响应

```vue
<script setup lang="ts">
// ❌ 返回完整用户对象（含大量不需要的字段）
const { data } = await useFetch('/api/users')

// ✅ 只取需要的字段
const { data } = await useFetch('/api/users', {
  pick: ['id', 'name', 'avatar'],
})
</script>
```

### ❌ 所有组件都在首屏加载

```vue
<template>
  <!-- ❌ 首屏不需要的重组件也一起加载 -->
  <HeavyEditor v-if="showEditor" />

  <!-- ✅ 使用 Lazy 前缀 -->
  <LazyHeavyEditor v-if="showEditor" />
</template>
```
