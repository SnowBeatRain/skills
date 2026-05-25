# 渲染模式与部署

## 渲染模式

Nuxt 4 支持多种渲染模式，可按路由细粒度配置。

### Universal Rendering（SSR，默认）

服务端渲染 HTML → 发送给客户端 → 客户端水合（hydration）。

```typescript
// nuxt.config.ts（默认即 SSR，无需额外配置）
export default defineNuxtConfig({
  ssr: true, // 默认值
})
```

优点：首屏快、SEO 友好、可爬取。
缺点：需要 Node.js 服务器运行。

### Client-Side Rendering（SPA）

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
})
```

优点：部署简单（静态托管）、无服务端开销。
缺点：首屏白屏、SEO 不友好。

### Static Site Generation（SSG）

```bash
# 预渲染所有路由为静态 HTML
npx nuxt generate
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 预渲染特定路由
  routeRules: {
    '/blog/**': { prerender: true },
  },
})
```

优点：最快的加载速度、可部署到任何静态托管。
缺点：构建时生成、动态内容需要 ISR 或客户端获取。

### 混合渲染（Hybrid Rendering）

核心特性：通过 `routeRules` 对不同路由使用不同渲染策略。

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 预渲染（构建时生成静态 HTML）
    '/': { prerender: true },
    '/about': { prerender: true },

    // ISR（增量静态再生：缓存 + 定时重新验证）
    '/blog/**': { isr: 3600 },  // 缓存 1 小时

    // SWR（Stale-While-Revalidate）
    '/api/stats': { swr: 600 },  // 缓存 10 分钟

    // 纯 SPA（客户端渲染）
    '/admin/**': { ssr: false },

    // SSR（服务端渲染，默认）
    '/dashboard/**': { ssr: true },

    // 缓存控制
    '/api/**': {
      cache: { maxAge: 60 },
      cors: true,
    },

    // 重定向
    '/old-path': { redirect: '/new-path' },
    '/old/**': { redirect: '/new/**' },

    // 代理
    '/proxy/api/**': { proxy: 'https://api.external.com/**' },

    // 禁止爬虫
    '/private/**': { robots: false },

    // 设置响应头
    '/assets/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  },
})
```

## 部署

### Nitro Presets

Nitro 自动检测部署环境，也可手动指定：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server', // 默认
  },
})
```

### Node.js 服务器

```bash
# 构建
npx nuxt build

# 启动（生产）
node .output/server/index.mjs
# 或
npx nuxt preview
```

输出位于 `.output/` 目录，包含服务端代码和静态资源。

### Vercel

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',
  },
})
```

自动检测，通常无需手动配置。直接 `git push` 即可。

### Netlify

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'netlify',
  },
})
```

### Cloudflare Workers / Pages

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    // 或 'cloudflare-module' for Workers
  },
})
```

### AWS Lambda

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'aws-lambda',
  },
})
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output .output
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 环境变量

### 运行时配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 仅服务端可见
    apiSecret: '',       // NUXT_API_SECRET 覆盖
    dbUrl: '',           // NUXT_DB_URL 覆盖

    // 客户端 + 服务端都可见
    public: {
      apiBase: '',       // NUXT_PUBLIC_API_BASE 覆盖
      appName: 'My App', // NUXT_PUBLIC_APP_NAME 覆盖
    },
  },
})
```

### .env 文件

```bash
# .env（开发时自动加载）
NUXT_API_SECRET=my-secret-key
NUXT_DB_URL=postgres://localhost/mydb
NUXT_PUBLIC_API_BASE=https://api.example.com
```

### 使用运行时配置

```vue
<!-- 组件中 -->
<script setup lang="ts">
const config = useRuntimeConfig()
// 客户端只能访问 config.public.*
console.log(config.public.apiBase)
</script>
```

```typescript
// server/ 中
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  // 服务端可访问所有配置
  console.log(config.apiSecret)
  console.log(config.public.apiBase)
})
```

### 生产环境注入

生产环境通过系统环境变量覆盖（无需 `.env` 文件）：

```bash
# 部署时设置
NUXT_API_SECRET=prod-secret \
NUXT_PUBLIC_API_BASE=https://api.prod.com \
node .output/server/index.mjs
```

## 静态资源处理

### public/ 目录

```
public/
├── favicon.ico      → /favicon.ico
├── robots.txt       → /robots.txt
└── images/
    └── logo.png     → /images/logo.png
```

不经过构建处理，直接按路径映射。

### assets/ 目录

```vue
<template>
  <!-- 构建时处理（hash、优化） -->
  <img src="~/assets/images/hero.png" />
</template>

<style>
/* 引用资源 */
.bg {
  background-image: url('~/assets/images/bg.jpg');
}
</style>
```

## 构建优化

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 压缩
  nitro: {
    compressPublicAssets: true,
  },

  // Vite 构建选项
  vite: {
    build: {
      // 分包策略
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router'],
          },
        },
      },
    },
  },
})
```
