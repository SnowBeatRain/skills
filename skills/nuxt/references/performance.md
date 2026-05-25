# 性能优化

## 自动优化（开箱即用）

Nuxt 4 默认提供的优化：

1. **代码分割**：每个页面独立 chunk，按需加载。
2. **Tree-shaking**：未使用的代码在构建时自动移除。
3. **链接预取**：`<NuxtLink>` 在进入视口时自动预取目标页面的 JS。
4. **SSR 直调**：`$fetch('/api/xxx')` 在服务端直接调用函数，不发 HTTP 请求。
5. **Payload 优化**：SSR 数据通过 payload 传递，客户端不重复请求。

## 组件懒加载

### Lazy 前缀

```vue
<template>
  <!-- 自动懒加载组件 -->
  <LazyHeavyChart v-if="showChart" :data="chartData" />

  <!-- 等价于手动定义 defineAsyncComponent -->
  <LazyCommentSection v-if="showComments" />
</template>
```

所有 `app/components/` 中的组件都可以加 `Lazy` 前缀使用懒加载版本。

### 条件加载

```vue
<template>
  <!-- 只在需要时加载 -->
  <LazyModal v-if="isModalOpen" @close="isModalOpen = false" />

  <!-- 配合 ClientOnly -->
  <ClientOnly>
    <LazyRichEditor v-model="content" />
  </ClientOnly>
</template>
```

## 延迟水合（Delayed Hydration）

Nuxt 4 支持组件级延迟水合策略：

```vue
<template>
  <!-- 空闲时水合 -->
  <LazyFooter hydrate-on-idle />

  <!-- 可见时水合（进入视口） -->
  <LazySidebar hydrate-on-visible />

  <!-- 交互时水合（鼠标悬停/点击） -->
  <LazyComments hydrate-on-interaction />

  <!-- 指定事件触发水合 -->
  <LazyGallery hydrate-on-interaction="mouseover,focus" />

  <!-- 媒体查询匹配时水合 -->
  <LazyMobileMenu hydrate-on-media-query="(max-width: 768px)" />

  <!-- 永不水合（纯静态内容） -->
  <LazyStaticBanner hydrate-never />
</template>
```

## 数据获取优化

### 减少 Payload 体积

```vue
<script setup lang="ts">
// ✅ 只选取需要的字段
const { data } = await useFetch('/api/users', {
  pick: ['id', 'name', 'avatar'],
})

// ✅ 转换数据，减少传输量
const { data } = await useFetch('/api/posts', {
  transform: (posts) => posts.map(({ id, title, excerpt }) => ({
    id,
    title,
    excerpt: excerpt.slice(0, 100),
  })),
})
</script>
```

### 缓存策略

```vue
<script setup lang="ts">
const { data } = await useFetch('/api/config', {
  // 使用缓存数据（避免重复请求）
  getCachedData: (key, nuxtApp) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  },
})
</script>
```

### 并行请求

```vue
<script setup lang="ts">
// ✅ 并行获取（快）
const [{ data: users }, { data: posts }] = await Promise.all([
  useFetch('/api/users'),
  useFetch('/api/posts'),
])

// ❌ 串行获取（慢）
const { data: users } = await useFetch('/api/users')
const { data: posts } = await useFetch('/api/posts')
</script>
```

## 图片优化

使用 `@nuxt/image` 模块：

```bash
npx nuxi module add image
```

```vue
<template>
  <!-- 自动优化：格式转换、尺寸调整 -->
  <NuxtImg
    src="/images/hero.jpg"
    width="800"
    height="400"
    format="webp"
    quality="80"
    loading="lazy"
    placeholder
  />

  <!-- 响应式图片 -->
  <NuxtPicture
    src="/images/banner.jpg"
    sizes="sm:100vw md:50vw lg:800px"
    format="avif,webp"
  />
</template>
```

## 预渲染关键路由

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { isr: 3600 },  // 每小时再生成
  },
})
```

## 减少 JavaScript 体积

### 1. 移除不需要的脚本

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 纯静态页面不需要 JS
    '/landing': { experimentalNoScripts: true },
  },
})
```

### 2. 外部化依赖

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        external: ['lodash-es'],
      },
    },
  },
})
```

### 3. 分析 Bundle

```bash
npx nuxi analyze
```

查看各 chunk 体积，识别不合理的大依赖。

## 预取控制

```vue
<template>
  <!-- 禁用预取（大量链接场景） -->
  <NuxtLink to="/heavy-page" :prefetch="false">
    Heavy Page
  </NuxtLink>

  <!-- 仅预取组件，不预取数据 -->
  <NuxtLink to="/page" prefetch-on="visibility">
    Page
  </NuxtLink>
</template>
```

全局配置：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: true,
        prefetchedClass: 'prefetched',
      },
    },
  },
})
```

## 服务端性能

### 缓存 API 响应

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/public/**': { cache: { maxAge: 300 } },  // 5 分钟缓存
    '/api/stats': { swr: 60 },  // SWR 1 分钟
  },
})
```

### 使用 Nitro 缓存层

```typescript
// server/api/heavy-computation.get.ts
export default defineCachedEventHandler(async (event) => {
  // 计算密集型操作
  const result = await heavyComputation()
  return result
}, {
  maxAge: 60 * 60,  // 缓存 1 小时
  swr: true,        // 过期后仍返回旧数据，后台刷新
})
```

## CSS 优化

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 内联关键 CSS
  features: {
    inlineStyles: true,
  },

  // CSS 提取
  css: ['~/assets/css/main.css'],

  // PostCSS 配置
  postcss: {
    plugins: {
      cssnano: {}, // 压缩 CSS
    },
  },
})
```

## 性能检查清单

- [ ] 使用 `npx nuxi analyze` 检查 bundle 体积，无异常大依赖
- [ ] 非首屏组件使用 `Lazy` 前缀懒加载
- [ ] 大列表/复杂组件使用延迟水合
- [ ] `useFetch` 使用 `pick` / `transform` 减少 payload
- [ ] 并行请求用 `Promise.all` 而非串行 `await`
- [ ] 图片使用 `<NuxtImg>` + `loading="lazy"` + 现代格式
- [ ] 关键路由使用 `prerender` 或 `isr`
- [ ] API 路由配置合理的缓存策略
- [ ] 预取策略适合页面链接密度
