---
name: nextjs
description: 用于基于 Next.js（React 全栈框架，App Router）构建 SSR/SSG/ISR/SPA 应用；当用户提到 Next.js、nextjs、App Router、Server Components、RSC、Server Actions、use server、use client、next/image、next/font、next/link、layout.tsx、page.tsx、loading.tsx、error.tsx、route.ts、middleware.ts、generateMetadata、revalidatePath、revalidateTag、useRouter、Turbopack、Vercel 部署时使用。不用于纯 React SPA（无 Next.js）、Pages Router（旧版）除非明确迁移需求、或与 Next.js 无关的 Node.js 后端框架。
---

# Next.js Skill

## Agent 行为契约（始终遵守）

1. **默认使用 App Router**——除非用户明确要求 Pages Router，所有代码使用 `app/` 目录。
2. **组件默认是 Server Component**——只有需要交互（事件、hooks、浏览器 API）时才加 `'use client'`。
3. **`'use client'` 尽量下推**——在组件树的最低层添加，保持尽可能多的组件在服务端渲染。
4. **async 组件只能是 Server Component**——Client Component 不能是 async 函数。
5. **Server Actions 用 `'use server'`**——可以在独立文件顶部声明，或在 Server Component 内的函数体内声明。
6. **Next.js 15+ 异步 API**——`params`、`searchParams`、`cookies()`、`headers()` 返回 Promise，必须 `await`。
7. **fetch 默认不缓存**——Next.js 15+ 中 `fetch` 请求默认 `no-store`，需要缓存须显式使用 `use cache` 或 `cacheLife`。
8. **Props 跨边界必须可序列化**——从 Server Component 传递给 Client Component 的 props 必须是 JSON 可序列化的（无函数、无 class 实例）。
9. **布局不重新渲染**——`layout.tsx` 在同级路由切换时保持状态，不要依赖 URL 变化触发 layout 重新获取数据。
10. **Metadata 用 `generateMetadata` 或 `metadata` 导出**——不在 Client Component 中手动操作 `<head>`。
11. **图片用 `next/image`**——自动优化、懒加载、防止 CLS。
12. **字体用 `next/font`**——零布局偏移、自托管、自动子集化。
13. **环境变量纪律**——客户端可见变量必须 `NEXT_PUBLIC_` 前缀，服务端变量不加前缀。
14. **中间件只做边缘轻量逻辑**——重定向、重写、header 修改；不做数据库查询或重计算。

---

## 快速分诊（First 60s）

**先确认版本**：Next.js 15+（推荐）还是 14？App Router 还是 Pages Router？

**快速收集信息**：
- TypeScript 还是 JavaScript？
- 状态管理：React Context / Zustand / Redux？
- 样式方案：Tailwind CSS / CSS Modules / styled-components？
- 数据源：数据库直连 / 外部 API / CMS？
- 部署目标：Vercel / 自托管 Docker / 静态导出？
- 认证方案：NextAuth.js (Auth.js) / Clerk / 自定义？

**按症状路由**：

| 症状 | 原因 | 处理 |
|------|------|------|
| 水合不匹配（Hydration mismatch） | Server/Client 渲染结果不一致 | 读 `references/rsc-boundaries.md` |
| `async` Client Component 报错 | Client Component 不能是 async | 将数据获取提到 Server Component |
| `cookies()`/`headers()` 类型错误 | v15 返回 Promise 未 await | 加 `await` |
| Server Action 返回值报错 | 返回了不可序列化的值 | 确保返回 plain object |
| 图片 CLS / 未优化 | 未使用 `next/image` | 读 `references/image-font.md` |
| 中间件性能差 | 中间件做了重逻辑 | 移到 Server Component 或 API |
| build 时缓存不生效 | fetch 默认 no-store | 使用 `use cache` 或 `cacheLife` |
| 路由加载慢无反馈 | 缺少 `loading.tsx` | 添加 loading boundary |
| Metadata 不生效 | 在 Client Component 中设置 | 改用 Server Component 的 `generateMetadata` |
| 环境变量在客户端为 undefined | 缺少 `NEXT_PUBLIC_` 前缀 | 重命名变量 |

---

## 意图

帮助 Agent 独立完成基于 Next.js（App Router）的全栈应用开发：项目初始化、目录结构、路由设计、Server/Client 组件边界、数据获取与缓存、Server Actions、Metadata/SEO、中间件、错误处理、图片/字体优化、部署和性能优化。

本 skill **负责 Next.js 框架本身的使用**。UI 组件库（shadcn/ui、Radix）、CSS 框架（Tailwind）、ORM（Prisma、Drizzle）、认证库（Auth.js）等由用户另行指定；本 skill 不主动耦合其他 skill。

---

## 触发场景

- 使用 Next.js App Router 创建新项目或升级现有项目。
- 文件系统路由：`app/` 目录下的 `page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx`、`not-found.tsx`。
- React Server Components（RSC）与 Client Components 的边界划分。
- 数据获取：Server Component 中 `fetch` / 数据库直查、`use cache`、`cacheLife`、`cacheTag`。
- 数据变更：Server Actions（`'use server'`）、`revalidatePath`、`revalidateTag`。
- Metadata/SEO：`generateMetadata`、`metadata` 导出、Open Graph、JSON-LD。
- 路由处理器：`route.ts`（GET/POST/PUT/DELETE）。
- 中间件：`middleware.ts`（重定向、认证检查、国际化）。
- 错误处理：`error.tsx`、`global-error.tsx`、`not-found.tsx`。
- 图片优化：`next/image`、远程图片配置、`<Image>` 组件。
- 字体优化：`next/font/google`、`next/font/local`。
- 部署：Vercel、Docker 自托管、静态导出。
- 性能优化：流式渲染、Suspense、并行路由、代码分割。
- 国际化（i18n）、认证模式、表单处理。
- 从 Pages Router 迁移到 App Router。

---

## 非目标

- 不负责纯 React SPA（不使用 Next.js 框架能力）。
- 不负责 Pages Router 除非明确的迁移需求。
- 不负责与 Next.js 无关的后端框架（Express、Fastify、NestJS）。
- 不编写完整应用骨架；细节按需读取 references。

---

## 核心原则

1. **App Router 优先**：默认使用 `app/` 目录和 React Server Components 架构。
2. **Server Component 默认**：组件默认在服务端渲染，只在需要交互时标记 `'use client'`。
3. **`'use client'` 边界最小化**：将客户端逻辑隔离在叶子组件中，保持数据获取在服务端。
4. **数据获取在服务端**：优先在 Server Component 中直接 `fetch` 或查询数据库，减少客户端 JavaScript。
5. **组合优于约定重写**：利用 `layout.tsx`、`loading.tsx`、`error.tsx`、`template.tsx` 的自动嵌套组合。
6. **缓存显式声明**：Next.js 15+ `fetch` 不默认缓存；使用 `use cache` 指令或 `cacheLife` 显式控制。
7. **Server Actions 处理变更**：表单提交和数据变更使用 Server Actions，搭配 `revalidatePath` / `revalidateTag` 刷新缓存。
8. **流式渲染**：使用 `<Suspense>` 和 `loading.tsx` 提供即时反馈，避免阻塞整页渲染。
9. **类型安全**：TypeScript 优先，利用 Next.js 内置类型（`Metadata`、`Route`、`SearchParams`）。
10. **环境变量分层**：服务端变量不加前缀、客户端变量加 `NEXT_PUBLIC_` 前缀，绝不在客户端暴露敏感信息。

---

## 工作流

### 1. 环境与项目初始化

读取 `references/overview.md`。

1. 确认 Next.js 版本（15+/16+）、Node.js 版本（≥18.18）、包管理器（pnpm/npm/yarn）。
2. 初始化项目：`npx create-next-app@latest <project-name>`（推荐 TypeScript + Tailwind + App Router）。
3. 确认目录结构：`app/`（路由和页面）、`public/`（静态文件）、`next.config.ts`。
4. 确认渲染需求：动态 SSR（默认）、静态导出（`output: 'export'`）、ISR、混合。

### 2. 目录结构与文件约定

读取 `references/file-conventions.md`。

1. `app/` 目录中的特殊文件：`page.tsx`（路由 UI）、`layout.tsx`（共享布局）、`loading.tsx`（Suspense 骨架）、`error.tsx`（错误边界）、`not-found.tsx`（404）、`route.ts`（API 端点）。
2. 动态路由：`[param]`、`[...catchAll]`、`[[...optionalCatchAll]]`。
3. 路由分组：`(group)` 不影响 URL 但可组织代码和共享布局。
4. 并行路由：`@slot` 在同一布局中同时渲染多个页面。
5. 拦截路由：`(.)segment`、`(..)segment` 实现模态框等模式。

### 3. Server 与 Client 组件边界

读取 `references/rsc-boundaries.md`。

1. 默认所有组件是 Server Component——可直接 `async/await`、访问数据库、读文件系统。
2. 需要 `'use client'` 的场景：`useState`、`useEffect`、事件处理器、浏览器 API、第三方客户端库。
3. 组合模式：Server Component 中渲染 Client Component，通过 props 传递数据（必须可序列化）。
4. 反模式：在 Client Component 中 import Server Component（应通过 `children` slot 传入）。

### 4. 数据获取与缓存

读取 `references/data-fetching.md`。

1. Server Component 中直接 `fetch`——默认不缓存（Next.js 15+）。
2. 启用缓存：`use cache` 指令（函数级/组件级）或 `cacheLife('hours')` 配置生命周期。
3. `cacheTag` + `revalidateTag`：按标签精确失效缓存。
4. 请求去重：React 自动对同一渲染中的相同 `fetch` 请求去重。
5. 客户端数据获取：SWR / React Query 用于需要客户端轮询或实时更新的场景。

### 5. Server Actions 与数据变更

读取 `references/server-actions.md`。

1. 定义：文件顶部 `'use server'` 或函数内 `'use server'` 指令。
2. 调用方式：`<form action={serverAction}>`、`useActionState`、直接调用。
3. 验证：用 Zod 验证输入，返回结构化错误。
4. 缓存失效：`revalidatePath('/path')`、`revalidateTag('tag')`。
5. 重定向：`redirect('/target')` 在 action 完成后跳转。
6. 乐观更新：`useOptimistic` 即时反馈。

### 6. Metadata 与 SEO

读取 `references/metadata.md`。

1. 静态 Metadata：`export const metadata: Metadata = { title, description, ... }`。
2. 动态 Metadata：`export async function generateMetadata({ params }): Promise<Metadata>`。
3. 模板：`title: { template: '%s | MySite', default: 'MySite' }` 在 layout 中设置。
4. Open Graph / Twitter Card：内置类型支持。
5. Sitemap：`app/sitemap.ts` 导出 `default function sitemap()`。
6. Robots：`app/robots.ts`。

### 7. 路由处理器（Route Handlers）

读取 `references/route-handlers.md`。

1. `app/api/*/route.ts` 中导出 HTTP 方法函数：`GET`、`POST`、`PUT`、`DELETE`。
2. 请求/响应：使用标准 Web API（`Request`、`Response`、`NextRequest`、`NextResponse`）。
3. 动态路由参数：与页面路由相同的 `[param]` 约定。
4. 流式响应：返回 `ReadableStream`。
5. CORS 和 headers 配置。

### 8. 中间件

读取 `references/middleware.md`。

1. `middleware.ts` 在项目根目录（与 `app/` 同级）。
2. 匹配器：`export const config = { matcher: ['/dashboard/:path*'] }`。
3. 用途：认证重定向、国际化路由、A/B 测试、请求头注入。
4. 限制：运行在 Edge Runtime，不能用 Node.js API（`fs`、数据库驱动等）。

### 9. 错误处理

读取 `references/error-handling.md`。

1. `error.tsx`：路由段级错误边界（必须是 Client Component）。
2. `global-error.tsx`：根布局级别的全局错误边界。
3. `not-found.tsx`：自定义 404 页面。
4. Server Action 错误：返回 `{ error: string }` 而非抛出异常。
5. `useActionState`：处理表单 action 的 pending / error / success 状态。

### 10. 图片与字体优化

读取 `references/image-font.md`。

1. `<Image>`：自动 WebP/AVIF、响应式 `srcset`、懒加载、CLS 防护。
2. 远程图片：`next.config.ts` 中配置 `images.remotePatterns`。
3. `next/font/google`：Google 字体零 CLS、自托管。
4. `next/font/local`：本地字体文件。
5. CSS 变量方式应用字体：`variable` 属性 + `className`。

### 11. 渲染模式与部署

读取 `references/rendering-deployment.md`。

1. 动态渲染（默认）：每次请求时服务端渲染。
2. 静态渲染：构建时预渲染，`generateStaticParams` 指定路径。
3. ISR：`revalidate` 时间控制增量静态再生。
4. 静态导出：`output: 'export'` 纯静态 HTML。
5. 部署：Vercel（零配置）、Docker（`standalone` 输出）、自托管 Node.js。

### 12. 性能优化

读取 `references/performance.md`。

1. 流式渲染：`<Suspense>` + `loading.tsx` 渐进加载。
2. 并行数据获取：多个独立请求并行发起（不相互 `await`）。
3. 动态导入：`next/dynamic` 按需加载客户端组件。
4. Bundle 分析：`@next/bundle-analyzer`。
5. 图片/字体优化。
6. `use cache` 避免重复计算。

---

## References

| 场景 | 读取 |
|---|---|
| 总览与安装 | `references/overview.md` |
| 文件约定与项目结构 | `references/file-conventions.md` |
| RSC 与 Client 组件边界 | `references/rsc-boundaries.md` |
| 数据获取与缓存 | `references/data-fetching.md` |
| Server Actions 与数据变更 | `references/server-actions.md` |
| Metadata 与 SEO | `references/metadata.md` |
| 路由处理器（Route Handlers） | `references/route-handlers.md` |
| 中间件 | `references/middleware.md` |
| 错误处理 | `references/error-handling.md` |
| 图片与字体优化 | `references/image-font.md` |
| 渲染模式与部署 | `references/rendering-deployment.md` |
| 性能优化 | `references/performance.md` |
| 常用模式与配方 | `references/common-recipes.md` |
| 避坑指南 | `references/pitfalls.md` |
| 官方文档索引 | `references/official-docs-map.md` |

---

## 交付检查清单

- [ ] 已确认使用 Next.js App Router（`app/` 目录），非 Pages Router。
- [ ] 组件默认为 Server Component，`'use client'` 只在必要时添加且尽量下推。
- [ ] 数据获取在 Server Component 中完成，未在 Client Component 中直接 `fetch` 服务端数据。
- [ ] Server Actions 正确使用 `'use server'` 指令，输入已验证，返回可序列化值。
- [ ] `params` / `searchParams` / `cookies()` / `headers()` 已正确 `await`（Next.js 15+）。
- [ ] 缓存策略明确：`use cache` / `cacheLife` / `cacheTag` 或确认使用动态渲染。
- [ ] Metadata 通过 `generateMetadata` 或 `metadata` 导出设置，非手动操作 DOM。
- [ ] 图片使用 `<Image>` 组件且指定 `width`/`height` 或 `fill`。
- [ ] 字体使用 `next/font`，无外部 CSS `@import` Google Fonts。
- [ ] 环境变量：服务端变量无前缀，客户端变量使用 `NEXT_PUBLIC_` 前缀。
- [ ] 中间件仅做轻量边缘逻辑，无数据库查询或重计算。
- [ ] 存在 `loading.tsx` 为慢请求提供即时反馈。
- [ ] `error.tsx` 错误边界已设置，用户看到友好错误页面。
- [ ] 部署配置正确（Vercel / Docker standalone / 静态导出）。
