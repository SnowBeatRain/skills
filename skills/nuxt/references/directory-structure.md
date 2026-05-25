# 目录结构

## Nuxt 4 标准目录

Nuxt 4 的核心变化是将前端应用代码统一到 `app/` 目录下，与配置文件和服务端代码分离。

### app/ 目录（前端应用）

| 目录/文件 | 作用 | 自动导入 |
|---|---|---|
| `app/app.vue` | 根组件 | — |
| `app/app.config.ts` | 应用级配置（响应式） | — |
| `app/pages/` | 文件系统路由 | — |
| `app/components/` | Vue 组件 | ✅ 按文件名 |
| `app/composables/` | 组合式函数 | ✅ 具名导出 |
| `app/utils/` | 工具函数 | ✅ 具名导出 |
| `app/layouts/` | 布局组件 | — |
| `app/middleware/` | 路由中间件 | — |
| `app/plugins/` | 客户端/服务端插件 | — |
| `app/assets/` | 需构建处理的资源（CSS、图片） | — |
| `app/error.vue` | 全局错误页 | — |

### server/ 目录（服务端）

| 目录 | 作用 |
|---|---|
| `server/api/` | API 端点（自动注册路由） |
| `server/routes/` | 非 `/api` 前缀的服务端路由 |
| `server/middleware/` | 服务端中间件（每个请求都执行） |
| `server/plugins/` | Nitro 启动时的插件 |
| `server/utils/` | 服务端工具函数（自动导入） |
| `server/tsconfig.json` | 服务端独立 TypeScript 配置 |

### 根目录

| 文件/目录 | 作用 |
|---|---|
| `nuxt.config.ts` | 框架配置 |
| `package.json` | 依赖管理 |
| `tsconfig.json` | TypeScript 配置 |
| `public/` | 静态文件（直接映射到 `/`） |
| `layers/` | Nuxt Layers（自动注册） |
| `modules/` | 本地自定义模块 |
| `.env` | 环境变量 |
| `.nuxt/` | 构建缓存（gitignore） |
| `.output/` | 生产构建输出（gitignore） |

## 自动导入规则

### components/

```
app/components/
├── AppHeader.vue        → <AppHeader />
├── base/
│   └── Button.vue       → <BaseButton />（目录名作前缀）
└── global/
    └── Modal.vue        → <GlobalModal />
```

组件名根据文件路径自动生成，目录名作为前缀。

### composables/ 和 utils/

```
app/composables/
├── useCounter.ts        → useCounter() 自动可用
└── useAuth.ts           → useAuth() 自动可用

app/utils/
├── formatDate.ts        → formatDate() 自动可用
└── validators.ts        → 文件内所有具名导出自动可用
```

只有顶层文件自动导入，嵌套目录需要在 `nuxt.config.ts` 中显式配置：

```typescript
export default defineNuxtConfig({
  imports: {
    dirs: ['app/utils/**'],
  },
})
```

## 特殊文件

### app.vue

```vue
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

如果不需要路由，可以移除 `app/pages/` 目录，此时 `<NuxtPage />` 不再需要。

### error.vue

```vue
<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">返回首页</button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>
```

### app.config.ts

```typescript
// app/app.config.ts
export default defineAppConfig({
  ui: {
    primaryColor: 'blue',
  },
  meta: {
    name: 'My App',
  },
})
```

使用 `useAppConfig()` 在组件中获取。
