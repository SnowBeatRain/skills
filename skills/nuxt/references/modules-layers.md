# 模块与 Layers

## 模块系统

Nuxt 模块是在构建时运行的函数，用于扩展框架核心功能。

### 安装与使用模块

```bash
# 安装模块（自动添加到 nuxt.config.ts）
npx nuxi module add @nuxtjs/tailwindcss
npx nuxi module add @pinia/nuxt
npx nuxi module add @nuxt/image
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
    '@vueuse/nuxt',
  ],
})
```

### 常用官方/社区模块

| 模块 | 功能 |
|---|---|
| `@nuxt/image` | 图片优化（自动 WebP、srcset） |
| `@nuxt/fonts` | 字体优化加载 |
| `@nuxt/ui` | 官方 UI 组件库 |
| `@nuxt/content` | Markdown/YAML 内容管理 |
| `@nuxt/devtools` | 开发工具面板 |
| `@pinia/nuxt` | Pinia 状态管理 |
| `@nuxtjs/tailwindcss` | Tailwind CSS 集成 |
| `@nuxtjs/i18n` | 国际化 |
| `@nuxtjs/sitemap` | Sitemap 生成 |
| `@nuxtjs/robots` | Robots.txt 管理 |
| `@nuxtjs/color-mode` | 深色/浅色模式 |
| `@vueuse/nuxt` | VueUse composables 集成 |
| `@nuxtjs/supabase` | Supabase 集成 |

### 模块配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],

  // 模块配置通常用模块名的驼峰形式作为 key
  image: {
    quality: 80,
    format: ['webp', 'avif'],
    screens: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  // i18n 配置
  i18n: {
    locales: ['zh-CN', 'en'],
    defaultLocale: 'zh-CN',
  },
})
```

## 自定义模块

### 本地模块

```typescript
// modules/analytics.ts
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'analytics',
    configKey: 'analytics', // nuxt.config.ts 中的配置 key
  },
  defaults: {
    trackingId: '',
    debug: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 添加插件
    addPlugin(resolver.resolve('./runtime/plugin'))

    // 添加 composable
    addImports({
      name: 'useAnalytics',
      from: resolver.resolve('./runtime/composables/useAnalytics'),
    })

    // 添加组件
    addComponent({
      name: 'AnalyticsConsent',
      filePath: resolver.resolve('./runtime/components/AnalyticsConsent.vue'),
    })

    // 添加服务端处理
    addServerHandler({
      route: '/api/analytics/track',
      handler: resolver.resolve('./runtime/server/api/track.post'),
    })

    // 将配置注入运行时
    nuxt.options.runtimeConfig.public.analytics = options
  },
})
```

### 模块运行时文件

```typescript
// modules/analytics/runtime/plugin.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.analytics

  return {
    provide: {
      analytics: {
        track(event: string, data?: Record<string, any>) {
          // 追踪事件逻辑
        },
      },
    },
  }
})
```

```typescript
// modules/analytics/runtime/composables/useAnalytics.ts
export function useAnalytics() {
  const { $analytics } = useNuxtApp()
  return $analytics
}
```

## Layers 层

Layers 允许复用和共享 Nuxt 应用的各个部分（组件、composables、页面、配置等）。

### 自动注册（Nuxt 4）

`layers/` 目录下的层自动注册：

```
layers/
├── base/                    # 基础层
│   ├── nuxt.config.ts
│   ├── app/
│   │   ├── components/
│   │   ├── composables/
│   │   └── layouts/
│   └── server/
│       └── api/
└── admin/                   # 管理后台层
    ├── nuxt.config.ts
    ├── app/
    │   ├── pages/
    │   └── middleware/
    └── server/
        └── api/
```

### 手动配置 Layers

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    './layers/base',               // 本地相对路径
    '@my-org/nuxt-base-layer',     // npm 包
    'github:user/repo#branch',     // Git 仓库
  ],
})
```

### Layer 结构

每个 layer 的结构与标准 Nuxt 应用相同：

```typescript
// layers/base/nuxt.config.ts
export default defineNuxtConfig({
  // 层自己的配置
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/base.css'],
})
```

```vue
<!-- layers/base/app/components/BaseButton.vue -->
<template>
  <button class="btn" :class="variant">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary'
}>()
</script>
```

### Layer 优先级

当多个 layer 提供同名文件时：
1. 项目自身的文件优先级最高
2. `extends` 数组中后面的 layer 覆盖前面的

### 使用场景

| 场景 | 做法 |
|---|---|
| 多项目共享基础组件/配置 | 创建 base layer（npm 包或 git） |
| Monorepo 共享代码 | 本地 `layers/` 目录 |
| 主题系统 | layer 提供默认样式和布局 |
| 多租户应用 | 不同 layer 提供不同品牌配置 |
| 渐进式添加功能 | 每个功能模块一个 layer |

## 模块 vs Layer 的选择

| 维度 | 模块 | Layer |
|---|---|---|
| 主要用途 | 扩展构建/框架能力 | 复用应用代码 |
| 包含内容 | 构建逻辑、Vite 插件、钩子 | 组件、页面、composables、配置 |
| 执行时机 | 构建时 | 运行时 |
| 分发方式 | npm 包 | npm 包 / git / 本地目录 |
| 典型例子 | Tailwind 集成、图片优化 | 共享 UI 库、基础配置模板 |
