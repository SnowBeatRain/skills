---
name: nuxt
description: 用于基于 Nuxt 4（Vue 3 全栈框架）构建 SSR/SSG/SPA 应用；当用户提到 Nuxt、Nuxt4、nuxt.config、useFetch、useAsyncData、Nitro、server/api、app/pages、app/components、app/composables、defineNuxtConfig、NuxtPage、NuxtLayout、NuxtLink、middleware、layers、useHead、useSeoMeta 时使用。不用于纯 Vue 3 SPA（无 Nuxt）、Nuxt 2、或与 Nuxt 无关的 Node.js 后端框架。
---

# Nuxt Skill

## 意图

帮助 Agent 独立完成基于 Nuxt 4（Vue 3 全栈框架）的应用开发：项目初始化、目录结构、路由设计、数据获取、服务端 API、状态管理、中间件、插件、模块、布局、SEO、部署和性能优化。

本 skill **负责 Nuxt 框架本身的使用**。UI 组件库（Nuxt UI、Element Plus）、CSS 框架（Tailwind、UnoCSS）、ORM（Prisma、Drizzle）等由用户另行指定；本 skill 不主动耦合其他 skill。

## 触发场景

- 使用 Nuxt 4 创建新项目或升级现有 Nuxt 3 项目。
- 文件系统路由（`app/pages/`）、动态路由、嵌套路由、路由中间件。
- 数据获取：`useFetch`、`useAsyncData`、`$fetch`、`useLazyFetch`、`useLazyAsyncData`。
- 服务端开发：`server/api/`、`server/routes/`、`server/middleware/`、Nitro。
- 状态管理：`useState`、Pinia 集成。
- SEO：`useHead`、`useSeoMeta`、`<Head>`、OG 标签。
- 渲染模式：SSR、SSG、SPA、ISR、混合渲染（`routeRules`）。
- 模块系统：安装和配置第三方模块、编写自定义模块。
- Layers 层：跨项目复用配置、组件和逻辑。
- 部署：Node.js 服务器、静态托管、Serverless、Edge。
- 性能优化：代码分割、预取、懒加载组件、延迟水合。
- 测试：`@nuxt/test-utils`、Vitest 集成。

## 非目标

- 不负责 Nuxt 2（Options API、webpack 4、`asyncData` 旧版钩子）。
- 不负责纯 Vue 3 SPA（不使用 Nuxt 框架能力）。
- 不负责与 Nuxt 无关的后端框架（Express、Fastify、NestJS）。
- 不编写完整应用骨架；细节按需读取 references。

## 核心原则

1. **版本确认**：默认使用 Nuxt 4 + Vue 3 + Vite + Nitro。不混用 Nuxt 2/3 旧版 API。
2. **app/ 目录结构**：Nuxt 4 核心代码在 `app/` 目录下（pages、components、composables、layouts、middleware、plugins、assets、utils），配置文件和 server/ 在项目根目录。
3. **自动导入**：Nuxt 自动导入 `app/composables/`、`app/utils/` 中的导出，以及 Vue/Nuxt 内置 composables（ref、computed、useFetch 等），无需手动 import。
4. **数据获取纪律**：组件中获取数据必须用 `useFetch` 或 `useAsyncData`，禁止在 `<script setup>` 中裸用 `$fetch`（会导致双重请求：服务端一次 + 客户端水合一次）。
5. **服务端/客户端边界**：浏览器 API（localStorage、window）不可在 SSR 期间使用，需用 `<ClientOnly>` 包裹或 `if (import.meta.client)` 条件守卫。
6. **Nitro 服务引擎**：API 路由在 `server/api/` 目录，文件名即路由路径，支持 HTTP 方法后缀（如 `user.get.ts`、`user.post.ts`）。
7. **路由中间件分层**：全局中间件（`.global.ts` 后缀）、命名中间件（`definePageMeta({ middleware })` 引用）、内联中间件。
8. **nuxt.config.ts 最小化**：只放框架级配置（modules、runtimeConfig、routeRules 等），业务代码不放入配置文件。
9. **环境变量纪律**：公开变量用 `runtimeConfig.public`，私密变量用 `runtimeConfig`（仅服务端可见），通过 `NUXT_` 前缀环境变量覆盖。
10. **水合安全**：确保服务端渲染的 HTML 与客户端水合后一致，避免使用 `Math.random()`、`Date.now()` 等产生不一致的数据；用 `useState` 或 `useCookie` 替代。

## 工作流

### 1. 环境与项目初始化

读取 `references/overview.md`。

1. 确认 Nuxt 版本（4.x）、Node.js 版本（≥18.x）、包管理器（pnpm/npm/yarn）。
2. 初始化项目：`npx nuxi@latest init <project-name>`。
3. 确认目录结构：`app/`（前端代码）、`server/`（后端 API）、`nuxt.config.ts`。
4. 确认渲染模式需求：SSR（默认）、SSG（`nuxt generate`）、SPA、混合。

### 2. 目录结构与路由设计

读取 `references/directory-structure.md`、`references/routing.md`。

1. 在 `app/pages/` 中规划页面文件，利用文件系统自动生成路由。
2. 动态路由参数用 `[param]` 命名，可选参数用 `[[param]]`，全捕获用 `[...slug]`。
3. 嵌套路由通过同名文件夹实现，父页面需放置 `<NuxtPage />`。
4. `app/layouts/` 定义布局，页面通过 `definePageMeta({ layout: 'name' })` 指定。

### 3. 数据获取

读取 `references/data-fetching.md`。

1. `useFetch(url, options)` — 最常用，自动处理 SSR 到客户端的状态传递。
2. `useAsyncData(key, fetcher)` — 需要自定义 key 或复杂逻辑时使用。
3. Lazy 变体（`useLazyFetch`、`useLazyAsyncData`）— 不阻塞导航，适合非关键数据。
4. 服务端直调：在 `server/api/` 中定义接口，前端通过 `$fetch('/api/xxx')` 调用（服务端直接调用函数，不发 HTTP 请求）。
5. 缓存与刷新：`refresh()`、`clear()`、`getCachedData`、`dedupe`。

### 4. 服务端 API（Nitro）

读取 `references/server-api.md`。

1. `server/api/` 下文件自动注册为 API 路由，导出 `defineEventHandler`。
2. 读取请求体：`readBody(event)`；读取查询参数：`getQuery(event)`。
3. 路由参数：文件名 `[id].ts` → `getRouterParam(event, 'id')`。
4. 服务端中间件：`server/middleware/` 下文件按顺序执行。
5. 数据库/外部服务调用放在 `server/utils/` 中封装。
6. `server/plugins/` 可在 Nitro 启动时执行初始化逻辑。

### 5. 状态管理

读取 `references/state-management.md`。

1. 简单状态：`useState<T>(key, init)` — SSR 安全的全局响应式状态。
2. 复杂状态：集成 Pinia（`@pinia/nuxt` 模块），`defineStore` + `storeToRefs`。
3. 禁止在 `<script setup>` 外部裸定义 `ref()`，会导致跨请求状态污染。
4. `useCookie` 适合需要在 SSR 期间读取的客户端偏好数据。

### 6. SEO 与 Meta

读取 `references/seo.md`。

1. `useHead({})` — 设置 title、meta、link、script 等。
2. `useSeoMeta({})` — 类型安全的 SEO meta 设置（title、description、ogImage 等）。
3. `<Head>` 组件 — 模板中声明式设置 head 内容。
4. `definePageMeta({ title })` — 页面级元数据。
5. 动态 SEO：结合 `useFetch` 获取数据后设置 `useHead`。

### 7. 中间件与插件

读取 `references/middleware-plugins.md`。

1. 路由中间件：`app/middleware/` 下导出 `defineNuxtRouteMiddleware`。
2. 全局中间件：文件名加 `.global.ts` 后缀。
3. 插件：`app/plugins/` 下导出 `defineNuxtPlugin`，可指定 `dependsOn`。
4. 插件执行时机：默认 SSR + 客户端都执行；`.client.ts` / `.server.ts` 后缀限定环境。

### 8. 模块与 Layers

读取 `references/modules-layers.md`。

1. 安装模块：`npx nuxi module add <module-name>`，在 `nuxt.config.ts` 的 `modules` 数组注册。
2. 常用模块：`@nuxtjs/tailwindcss`、`@pinia/nuxt`、`@nuxt/image`、`@nuxt/fonts`、`@nuxtjs/i18n`。
3. Layers：`layers/` 目录下的子应用自动注册，可复用 components、composables、pages。
4. 自定义模块开发：`modules/` 目录，使用 `defineNuxtModule` + `addComponent` / `addImports` 等 Kit API。

### 9. 渲染模式与部署

读取 `references/rendering-deployment.md`。

1. `routeRules`：按路由细粒度配置渲染策略（SSR、SPA、预渲染、ISR、缓存）。
2. SSG：`nuxt generate` 预渲染全部或部分路由为静态 HTML。
3. 部署目标：Node.js（`node-server`）、Vercel、Netlify、Cloudflare Workers、AWS Lambda。
4. Nitro presets：通过 `nitro.preset` 指定部署平台。
5. 环境变量：生产环境通过 `NUXT_PUBLIC_*` 和 `NUXT_*` 注入。

### 10. 性能优化

读取 `references/performance.md`。

1. 自动代码分割：每个页面按需加载。
2. 组件懒加载：`<LazyComponentName />` 前缀自动懒加载。
3. 延迟水合：`nuxt-delay-hydration` 或 Vue 3.5+ 原生 Suspense 策略。
4. 图片优化：`@nuxt/image` 模块，自动转 WebP、设置 srcset。
5. 预取：`<NuxtLink>` 默认在可视区域自动预取目标页面的 JS。
6. Payload 优化：减少 `useFetch` 返回数据体积，使用 `pick` / `transform` 选项。
7. 构建分析：`npx nuxi analyze` 查看 bundle 组成。

## References

| 场景 | 读取 |
|---|---|
| 总览与安装 | `references/overview.md` |
| 目录结构 | `references/directory-structure.md` |
| 路由系统 | `references/routing.md` |
| 数据获取 | `references/data-fetching.md` |
| 服务端 API（Nitro） | `references/server-api.md` |
| 状态管理 | `references/state-management.md` |
| SEO 与 Meta | `references/seo.md` |
| 中间件与插件 | `references/middleware-plugins.md` |
| 模块与 Layers | `references/modules-layers.md` |
| 渲染模式与部署 | `references/rendering-deployment.md` |
| 性能优化 | `references/performance.md` |
| 常用模式与配方 | `references/common-recipes.md` |
| 避坑指南 | `references/pitfalls.md` |
| 测试 | `references/testing.md` |
| 官方文档索引 | `references/official-docs-map.md` |

## 交付检查清单

- [ ] 已确认使用 Nuxt 4（非 Nuxt 2/3 旧版 API），Vue 3 Composition API。
- [ ] 项目使用 `app/` 目录结构，前后端代码分离（`app/` vs `server/`）。
- [ ] 组件中数据获取使用 `useFetch` / `useAsyncData`，未裸用 `$fetch`。
- [ ] 服务端 API 正确使用 `defineEventHandler`，参数读取使用 Nitro 工具函数。
- [ ] 浏览器 API 已做 SSR 安全处理（`<ClientOnly>`、`import.meta.client` 守卫）。
- [ ] 全局状态使用 `useState` 或 Pinia，未在模块顶层裸定义 `ref()`。
- [ ] 环境变量通过 `runtimeConfig` 管理，敏感信息未暴露到客户端。
- [ ] SEO meta 已通过 `useHead` / `useSeoMeta` 正确设置。
- [ ] 中间件和插件命名正确（`.global.ts`、`.client.ts`、`.server.ts`）。
- [ ] 已根据需求配置 `routeRules` 混合渲染策略。
- [ ] 已评估性能优化需求（懒加载组件、图片优化、payload 精简）。
- [ ] 部署配置正确（Nitro preset、环境变量注入）。
