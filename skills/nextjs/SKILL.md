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
| 水合不匹配 | Server/Client 渲染不一致 | 读 `references/rsc-boundaries.md` |
| `async` Client Component 报错 | Client Component 不能 async | 数据获取提到 Server Component |
| `cookies()`/`headers()` 类型错误 | v15 返回 Promise 未 await | 加 `await` |
| Server Action 返回值报错 | 返回不可序列化值 | 确保返回 plain object |
| 图片 CLS / 未优化 | 未使用 `next/image` | 读 `references/image-font.md` |
| 中间件性能差 | 中间件做了重逻辑 | 移到 Server Component 或 API |
| build 时缓存不生效 | fetch 默认 no-store | 使用 `use cache` 或 `cacheLife` |
| 路由加载慢无反馈 | 缺少 `loading.tsx` | 添加 loading boundary |
| Metadata 不生效 | 在 Client Component 中设置 | 改用 `generateMetadata` |
| 环境变量在客户端 undefined | 缺少 `NEXT_PUBLIC_` 前缀 | 重命名变量 |

---

## 意图

帮助 Agent 独立完成基于 Next.js（App Router）的全栈应用开发：项目初始化、目录结构、路由设计、Server/Client 组件边界、数据获取与缓存、Server Actions、Metadata/SEO、中间件、错误处理、图片/字体优化、部署和性能优化。

本 skill **负责 Next.js 框架本身的使用**。UI 组件库、CSS 框架、ORM、认证库等由用户另行指定。

---

## 触发场景

- 使用 Next.js App Router 创建新项目或升级现有项目。
- 文件系统路由、RSC 与 Client Components 边界划分。
- 数据获取与缓存、Server Actions、Metadata/SEO。
- 路由处理器（`route.ts`）、中间件（`middleware.ts`）。
- 错误处理、图片/字体优化、部署、性能优化。
- 国际化（i18n）、认证模式、从 Pages Router 迁移。

---

## 非目标

- 不负责纯 React SPA（不使用 Next.js 框架能力）。
- 不负责 Pages Router 除非明确的迁移需求。
- 不负责与 Next.js 无关的后端框架。
- 不编写完整应用骨架；细节按需读取 references。

---

## 工作流

1. **环境与项目初始化** — 读取 `references/overview.md`。确认版本、初始化项目、确认渲染需求。
2. **目录结构与文件约定** — 读取 `references/file-conventions.md`。特殊文件、动态路由、路由分组、并行路由、拦截路由。
3. **Server 与 Client 组件边界** — 读取 `references/rsc-boundaries.md`。默认 Server Component、`'use client'` 场景、组合模式。
4. **数据获取与缓存** — 读取 `references/data-fetching.md`。`fetch`、`use cache`、`cacheLife`、`cacheTag`、请求去重。
5. **Server Actions 与数据变更** — 读取 `references/server-actions.md`。`'use server'`、`useActionState`、`revalidatePath`、乐观更新。
6. **Metadata 与 SEO** — 读取 `references/metadata.md`。`generateMetadata`、Open Graph、Sitemap、Robots。
7. **路由处理器** — 读取 `references/route-handlers.md`。`route.ts`、Web API、流式响应。
8. **中间件** — 读取 `references/middleware.md`。认证重定向、国际化、Edge Runtime 限制。
9. **错误处理** — 读取 `references/error-handling.md`。`error.tsx`、`global-error.tsx`、`not-found.tsx`。
10. **图片与字体优化** — 读取 `references/image-font.md`。`next/image`、`next/font`。
11. **渲染模式与部署** — 读取 `references/rendering-deployment.md`。SSR、SSG、ISR、静态导出、Vercel / Docker。
12. **性能优化** — 读取 `references/performance.md`。流式渲染、动态导入、Bundle 分析。
13. **核心原则与设计理念** — 读取 `references/principles.md`。App Router 优先、Server Component 默认、缓存策略等。

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
| 核心原则与设计理念 | `references/principles.md` |
| 常用模式与配方 | `references/common-recipes.md` |
| 避坑指南 | `references/pitfalls.md` |
| 官方文档索引 | `references/official-docs-map.md` |

---

## 交付检查清单

- [ ] 已确认使用 App Router（`app/` 目录），非 Pages Router。
- [ ] 组件默认为 Server Component，`'use client'` 尽量下推。
- [ ] 数据获取在 Server Component 中完成。
- [ ] Server Actions 正确使用 `'use server'`，输入已验证，返回可序列化值。
- [ ] `params` / `searchParams` / `cookies()` / `headers()` 已正确 `await`（v15+）。
- [ ] 缓存策略明确：`use cache` / `cacheLife` / `cacheTag` 或确认动态渲染。
- [ ] Metadata 通过 `generateMetadata` 或 `metadata` 导出设置。
- [ ] 图片使用 `<Image>` 且指定尺寸或 `fill`。
- [ ] 字体使用 `next/font`，无外部 CSS `@import`。
- [ ] 环境变量：服务端无前缀，客户端 `NEXT_PUBLIC_` 前缀。
- [ ] 中间件仅做轻量边缘逻辑。
- [ ] 存在 `loading.tsx` 和 `error.tsx`。
- [ ] 部署配置正确（Vercel / Docker standalone / 静态导出）。
