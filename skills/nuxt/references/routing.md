# 路由系统

## 文件系统路由

Nuxt 4 基于 `app/pages/` 目录自动生成路由，无需手动配置。

### 基础路由

```
app/pages/
├── index.vue          → /
├── about.vue          → /about
└── contact.vue        → /contact
```

### 动态路由

```
app/pages/
├── users/
│   ├── index.vue      → /users
│   └── [id].vue       → /users/:id
├── posts/
│   └── [slug].vue     → /posts/:slug
└── [[optional]].vue   → /:optional?（可选参数）
```

获取动态参数：

```vue
<script setup lang="ts">
const route = useRoute()
// /users/123 → route.params.id = '123'
const id = route.params.id
</script>
```

### 全捕获路由

```
app/pages/
└── [...slug].vue      → 匹配所有未命中的路径
```

```vue
<script setup lang="ts">
const route = useRoute()
// /a/b/c → route.params.slug = ['a', 'b', 'c']
</script>
```

### 嵌套路由

同名文件 + 文件夹 = 嵌套路由：

```
app/pages/
├── users.vue          → 父布局（必须含 <NuxtPage />）
└── users/
    ├── index.vue      → /users
    └── [id].vue       → /users/:id
```

父组件 `users.vue`：

```vue
<template>
  <div>
    <h1>用户管理</h1>
    <NuxtPage />  <!-- 子路由渲染位置 -->
  </div>
</template>
```

## 导航

### NuxtLink

```vue
<template>
  <div>
    <!-- 内部链接 -->
    <NuxtLink to="/about">关于</NuxtLink>

    <!-- 动态路由 -->
    <NuxtLink :to="`/users/${user.id}`">{{ user.name }}</NuxtLink>

    <!-- 命名路由 -->
    <NuxtLink :to="{ name: 'users-id', params: { id: user.id } }">
      {{ user.name }}
    </NuxtLink>

    <!-- 外部链接（自动用 <a> 渲染） -->
    <NuxtLink to="https://nuxt.com" external>Nuxt</NuxtLink>
  </div>
</template>
```

`<NuxtLink>` 默认对可视区域内的链接自动预取目标页面的 JS。

### 编程式导航

```vue
<script setup lang="ts">
const router = useRouter()

// 导航
router.push('/about')
router.push({ name: 'users-id', params: { id: '123' } })

// 替换（不留历史记录）
router.replace('/login')

// 返回
router.back()

// 使用 navigateTo（支持 SSR）
await navigateTo('/dashboard')
await navigateTo('/login', { redirectCode: 301 })
</script>
```

## 页面元数据

```vue
<script setup lang="ts">
definePageMeta({
  // 布局
  layout: 'admin',

  // 中间件
  middleware: ['auth'],

  // 页面级 key（强制重新渲染）
  key: route => route.fullPath,

  // 页面过渡
  pageTransition: { name: 'page', mode: 'out-in' },

  // 布局过渡
  layoutTransition: { name: 'layout', mode: 'out-in' },

  // 保持组件状态
  keepalive: true,

  // 自定义数据
  title: '仪表盘',
})
</script>
```

## 路由中间件

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

在页面中使用：

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  // 或多个中间件
  // middleware: ['auth', 'admin'],
})
</script>
```

全局中间件（所有路由都执行）：

```typescript
// app/middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // 每次路由变化时执行
})
```

## 路由验证

```vue
<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    // 返回 boolean 或带 statusCode 的对象
    return /^\d+$/.test(route.params.id as string)
  },
})
</script>
```

验证失败会抛出 404 错误。

## 页面过渡动画

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },
})
```

```css
/* app/assets/css/transitions.css */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
```

## 自定义路由

如需完全自定义路由（覆盖文件系统路由），在 `app/router.options.ts` 中配置：

```typescript
// app/router.options.ts
import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  routes: (_routes) => {
    // 修改或返回新的路由数组
    return _routes
  },
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
}
```
