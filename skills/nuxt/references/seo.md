# SEO 与 Meta

## useHead

设置页面 `<head>` 内容的主要 composable：

```vue
<script setup lang="ts">
useHead({
  title: '页面标题',
  titleTemplate: '%s - 我的网站',
  meta: [
    { name: 'description', content: '页面描述' },
    { name: 'keywords', content: 'nuxt,vue,ssr' },
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'canonical', href: 'https://example.com/page' },
  ],
  script: [
    { src: 'https://analytics.example.com/script.js', defer: true },
  ],
  htmlAttrs: {
    lang: 'zh-CN',
  },
  bodyAttrs: {
    class: 'dark-mode',
  },
})
</script>
```

### 响应式 Head

```vue
<script setup lang="ts">
const title = ref('默认标题')
const description = ref('')

// 响应式更新
useHead({
  title,
  meta: [
    { name: 'description', content: description },
  ],
})

// 基于异步数据动态设置
const { data: post } = await useFetch(`/api/posts/${route.params.id}`)

useHead({
  title: () => post.value?.title || '加载中...',
  meta: [
    { name: 'description', content: () => post.value?.excerpt || '' },
  ],
})
</script>
```

## useSeoMeta

类型安全的 SEO meta 设置（推荐用于 SEO 相关 meta）：

```vue
<script setup lang="ts">
useSeoMeta({
  title: '文章标题',
  description: '文章描述，建议 150-160 字符',

  // Open Graph
  ogTitle: '分享标题',
  ogDescription: '分享描述',
  ogImage: 'https://example.com/og-image.jpg',
  ogUrl: 'https://example.com/page',
  ogType: 'article',
  ogSiteName: '网站名称',

  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterTitle: '推特分享标题',
  twitterDescription: '推特分享描述',
  twitterImage: 'https://example.com/twitter-image.jpg',

  // 其他
  robots: 'index, follow',
  author: '作者名',
})
</script>
```

### 动态 SEO Meta

```vue
<script setup lang="ts">
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

useSeoMeta({
  title: () => product.value?.name ?? '',
  description: () => product.value?.description ?? '',
  ogImage: () => product.value?.image ?? '',
  ogType: 'product',
})
</script>
```

## 全局 Title Template

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s - 我的网站',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
})
```

也可以在 `app.vue` 中设置：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - 我的网站` : '我的网站'
  },
})
</script>
```

## definePageMeta 与 SEO

```vue
<script setup lang="ts">
definePageMeta({
  title: '关于我们',  // 供中间件和布局读取
})

// 实际 head 设置
useHead({
  title: '关于我们',
})
</script>
```

## 结构化数据（JSON-LD）

```vue
<script setup lang="ts">
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: '文章标题',
        author: {
          '@type': 'Person',
          name: '作者名',
        },
        datePublished: '2025-01-01',
      }),
    },
  ],
})
</script>
```

## Sitemap

推荐使用 `@nuxtjs/sitemap` 模块：

```bash
npx nuxi module add sitemap
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'],
  site: {
    url: 'https://example.com',
  },
})
```

动态路由需要声明数据源：

```typescript
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(() => {
  return [
    { loc: '/blog/post-1', lastmod: new Date() },
    { loc: '/blog/post-2', lastmod: new Date() },
  ]
})
```

## Robots

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { robots: false },  // 禁止爬虫
    '/api/**': { robots: false },
  },
})
```

或使用 `@nuxtjs/robots` 模块精细控制。

## 最佳实践

1. **每个页面都设置唯一的 title 和 description**。
2. **OG Image 使用绝对 URL**（含协议和域名）。
3. **动态页面 SEO 依赖 `useFetch` 数据**时，确保数据在 SSR 阶段已获取（不要用 `server: false`）。
4. **`titleTemplate` 统一管理**，避免每个页面重复写站点名。
5. **canonical URL** 防止重复内容问题。
6. **避免客户端才获取的数据设置 SEO meta**（搜索引擎可能读不到）。
