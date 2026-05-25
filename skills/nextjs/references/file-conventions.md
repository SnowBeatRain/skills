# 文件约定与项目结构

## 特殊文件

App Router 通过特殊文件名自动创建 UI 层级：

| 文件 | 作用 | 必需 |
|------|------|------|
| `layout.tsx` | 共享布局，嵌套渲染 children | 根布局必需 |
| `page.tsx` | 路由 UI，使路由可访问 | 是（否则路由不可见） |
| `loading.tsx` | Suspense fallback（加载骨架） | 否 |
| `error.tsx` | 错误边界（必须是 Client Component） | 否 |
| `not-found.tsx` | 404 UI | 否 |
| `template.tsx` | 类似 layout 但每次导航重新挂载 | 否 |
| `default.tsx` | 并行路由的回退 UI | 否 |
| `route.ts` | API 端点（不能与 page.tsx 共存） | 否 |
| `global-error.tsx` | 根布局的错误边界 | 否 |
| `middleware.ts` | 边缘中间件（项目根目录） | 否 |

## 布局（layout.tsx）

```typescript
// app/layout.tsx — 根布局（必需）
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | My App', default: 'My App' },
  description: 'My application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

**布局特性**：
- 在路由切换时不重新渲染（保持状态）
- 自动嵌套（子路由布局嵌入父布局）
- 不能访问当前路由段的 `searchParams`（layout 不在导航时重新渲染）

## 页面（page.tsx）

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchData()
  return <div>{/* UI */}</div>
}
```

## 动态路由

```
app/
├── blog/
│   └── [slug]/           → /blog/:slug
│       └── page.tsx
├── shop/
│   └── [...categories]/  → /shop/a/b/c（捕获所有）
│       └── page.tsx
└── docs/
    └── [[...slug]]/      → /docs 或 /docs/a/b（可选捕获）
        └── page.tsx
```

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

## 路由分组 `(group)`

用 `()` 包裹的文件夹不影响 URL 路径，仅用于组织代码或共享布局：

```
app/
├── (marketing)/
│   ├── layout.tsx        → 营销页面共享布局
│   ├── about/page.tsx    → /about
│   └── blog/page.tsx     → /blog
├── (shop)/
│   ├── layout.tsx        → 商店页面共享布局
│   └── products/page.tsx → /products
└── layout.tsx            → 根布局
```

## 并行路由 `@slot`

同一布局中同时渲染多个页面段：

```
app/
├── layout.tsx            → 接收 @team 和 @analytics 作为 props
├── @team/
│   └── page.tsx
├── @analytics/
│   └── page.tsx
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <div>
      {children}
      {team}
      {analytics}
    </div>
  )
}
```

## 拦截路由

用特殊前缀拦截导航（模态框模式）：

| 约定 | 匹配 |
|------|------|
| `(.)segment` | 同级 |
| `(..)segment` | 上一级 |
| `(..)(..)segment` | 上两级 |
| `(...)segment` | 根目录 |

典型用例：照片画廊中点击照片弹出模态框，刷新/直链显示完整页面。

## 私有文件夹 `_folder`

以 `_` 开头的文件夹不参与路由：

```
app/
├── _components/           → 不生成路由
│   └── Button.tsx
└── dashboard/
    └── page.tsx
```

## 推荐的项目组织方式

```
my-app/
├── app/                   # 路由层（尽量薄）
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       └── [...]/route.ts
├── components/            # 共享 UI 组件
│   ├── ui/               # 基础组件（Button、Input 等）
│   └── features/         # 业务组件
├── lib/                   # 工具函数、配置
│   ├── db.ts
│   ├── auth.ts
│   └── utils.ts
├── actions/               # Server Actions
├── types/                 # TypeScript 类型
└── public/                # 静态文件
```
