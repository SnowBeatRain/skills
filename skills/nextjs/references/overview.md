# Next.js 总览与安装

## 框架定位

Next.js 是基于 React 的全栈框架，提供：

- **文件系统路由（App Router）**：`app/` 目录下的文件自动生成路由
- **React Server Components**：组件默认在服务端渲染，减少客户端 JS
- **Server Actions**：直接在服务端执行数据变更，无需编写 API
- **流式渲染（Streaming）**：结合 Suspense 渐进加载页面
- **内置优化**：图片、字体、脚本自动优化
- **多种渲染模式**：SSR、SSG、ISR、静态导出

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 19+（Server Components） |
| 构建工具 | Turbopack（开发）/ webpack（生产） |
| 类型系统 | TypeScript（强烈推荐） |
| 包管理器 | pnpm（推荐）/ npm / yarn / bun |
| Node.js | ≥ 18.18 |
| 运行时 | Node.js（默认）/ Edge |

## 快速开始

```bash
# 创建新项目（推荐选项：TypeScript、Tailwind CSS、App Router）
npx create-next-app@latest my-app

# 进入目录
cd my-app

# 启动开发服务器（Turbopack）
npm run dev
# 或
pnpm dev --turbopack
```

开发服务器默认监听 `http://localhost:3000`。

## 项目结构

```
my-app/
├── app/                    # App Router（路由和页面）
│   ├── layout.tsx         # 根布局（必需）
│   ├── page.tsx           # 首页
│   ├── loading.tsx        # 全局 loading UI
│   ├── error.tsx          # 全局错误边界
│   ├── not-found.tsx      # 404 页面
│   ├── global-error.tsx   # 根错误边界
│   ├── sitemap.ts         # 站点地图
│   ├── robots.ts          # robots.txt
│   ├── (routes)/          # 路由分组
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── layout.tsx
│   └── api/               # Route Handlers
│       └── users/
│           └── route.ts
├── components/             # 共享组件（非路由）
├── lib/                    # 工具函数、配置
├── public/                 # 静态文件（直接映射到 /）
├── next.config.ts          # Next.js 配置
├── middleware.ts           # 中间件（与 app/ 同级）
├── tailwind.config.ts      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

## next.config.ts 基础配置

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 实验性功能
  experimental: {
    // ppr: 'incremental',  // 部分预渲染
  },

  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },

  // 环境变量
  env: {
    CUSTOM_KEY: 'value',
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
```

## 关键命令

```bash
npm run dev           # 开发服务器（Turbopack）
npm run build         # 生产构建
npm run start         # 启动生产服务器
npm run lint          # ESLint 检查

# 有用的 CLI 选项
next dev --turbopack              # 显式使用 Turbopack
next build                         # 构建
next start -p 8080                 # 指定端口
```

## Next.js 15+ 关键变化

1. **异步 API**：`params`、`searchParams`、`cookies()`、`headers()` 现在返回 Promise，必须 `await`。
2. **fetch 不缓存**：`fetch` 请求默认 `no-store`，需显式缓存。
3. **`use cache` 指令**：新的缓存原语，替代旧版 `unstable_cache`。
4. **`cacheLife` / `cacheTag`**：细粒度缓存控制。
5. **Turbopack 稳定**：开发模式默认使用 Turbopack（更快的 HMR）。
6. **React 19**：`use` hook、`useActionState`、`useOptimistic`。
7. **部分预渲染（PPR）**：静态外壳 + 动态内容流式加载。

## 官方资源

- 文档：https://nextjs.org/docs
- GitHub：https://github.com/vercel/next.js
- 学习教程：https://nextjs.org/learn
- 示例：https://github.com/vercel/next.js/tree/canary/examples
- Vercel 部署：https://vercel.com/docs
