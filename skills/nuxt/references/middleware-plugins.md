# 中间件与插件

## 路由中间件

位于 `app/middleware/` 目录，在页面导航时执行。

### 命名中间件

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser()

  if (!user.value) {
    // 重定向到登录页
    return navigateTo('/login')
  }
})
```

页面中引用：

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})
</script>
```

### 全局中间件

文件名加 `.global.ts` 后缀，所有路由自动执行：

```typescript
// app/middleware/01.auth.global.ts
// 数字前缀控制执行顺序
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  // 白名单路由
  const publicRoutes = ['/login', '/register', '/forgot-password']
  if (publicRoutes.includes(to.path)) return

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

### 中间件返回值

```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  // 不返回 → 继续导航
  // 返回 navigateTo() → 重定向
  // 返回 abortNavigation() → 取消导航
  // 返回 abortNavigation(error) → 取消并显示错误

  if (to.path === '/forbidden') {
    return abortNavigation()
  }

  if (to.path === '/old-page') {
    return navigateTo('/new-page', { redirectCode: 301 })
  }

  // 抛出错误
  if (!hasPermission(to)) {
    return abortNavigation(
      createError({ statusCode: 403, message: '无权访问' })
    )
  }
})
```

### 内联中间件

```vue
<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      // 内联中间件逻辑
      if (to.query.admin !== 'true') {
        return navigateTo('/')
      }
    },
    'auth', // 也可混合命名中间件
  ],
})
</script>
```

### 中间件执行顺序

1. 全局中间件（按文件名字母序 / 数字前缀排序）
2. 页面中间件（按 `definePageMeta({ middleware })` 数组顺序）

## 插件

位于 `app/plugins/` 目录，应用初始化时执行。

### 基础插件

```typescript
// app/plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  // 提供全局工具
  const api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      const token = useCookie('auth-token')
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
  })

  return {
    provide: {
      api,  // 通过 useNuxtApp().$api 或 this.$api 使用
    },
  }
})
```

使用插件提供的功能：

```vue
<script setup lang="ts">
const { $api } = useNuxtApp()
const users = await $api('/users')
</script>
```

### 环境限定插件

```typescript
// app/plugins/analytics.client.ts
// 仅在客户端执行
export default defineNuxtPlugin(() => {
  // 初始化分析 SDK
  window.analytics.init('key')
})
```

```typescript
// app/plugins/init-db.server.ts
// 仅在服务端执行
export default defineNuxtPlugin(() => {
  // 服务端初始化逻辑
})
```

### 插件依赖

```typescript
// app/plugins/02.auth.ts
export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['api'],  // 等待 api 插件完成后再执行
  setup(nuxtApp) {
    // 此时 $api 已可用
  },
})
```

### 插件钩子

```typescript
// app/plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Vue 错误处理
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error)
  }

  // Nuxt 钩子
  nuxtApp.hook('app:error', (error) => {
    console.error('App Error:', error)
  })

  nuxtApp.hook('page:start', () => {
    // 页面开始加载
  })

  nuxtApp.hook('page:finish', () => {
    // 页面加载完成
  })

  nuxtApp.hook('app:mounted', () => {
    // 应用挂载完成（仅客户端）
  })
})
```

### 插件类型声明

```typescript
// app/plugins/api.ts
export default defineNuxtPlugin(() => {
  const api = {
    getUsers: () => $fetch('/api/users'),
    getUser: (id: string) => $fetch(`/api/users/${id}`),
  }

  return {
    provide: { api },
  }
})

// 类型增强（自动推断，通常无需手动声明）
declare module '#app' {
  interface NuxtApp {
    $api: {
      getUsers: () => Promise<User[]>
      getUser: (id: string) => Promise<User>
    }
  }
}
```

## 服务端中间件 vs 路由中间件

| 特性 | 服务端中间件 (`server/middleware/`) | 路由中间件 (`app/middleware/`) |
|---|---|---|
| 执行环境 | 仅服务端 | 服务端 + 客户端 |
| 触发时机 | 每个 HTTP 请求 | 每次页面导航 |
| 用途 | 请求日志、CORS、API 认证 | 页面权限、重定向 |
| 可用 API | Nitro event handlers | Vue Router、Nuxt composables |

## 常用模式

### 认证插件 + 中间件

```typescript
// app/plugins/auth.ts
export default defineNuxtPlugin(async () => {
  const user = useUser()
  const token = useCookie('auth-token')

  if (token.value && !user.value) {
    try {
      user.value = await $fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } catch {
      token.value = null
    }
  }
})
```

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useUser()
  if (!user.value && to.meta.requiresAuth) {
    return navigateTo('/login')
  }
})
```

### 进度条插件

```typescript
// app/plugins/loading.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:start', () => {
    // 显示加载进度条
  })
  nuxtApp.hook('page:finish', () => {
    // 隐藏加载进度条
  })
})
```
