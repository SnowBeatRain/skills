# 核心原则与设计理念

> 从 `SKILL.md` 提取的设计理念。日常工作流中不需要每次都读，但在以下场景建议回顾：
> - 项目初始化时
> - 架构决策时
> - Code Review 时

---

## 原则清单

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
