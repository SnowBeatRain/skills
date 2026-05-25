# React Server Components 与 Client 组件边界

## 核心概念

Next.js App Router 中，**所有组件默认是 Server Component**。

| 特性 | Server Component | Client Component |
|------|-----------------|------------------|
| 指令 | 无（默认） | `'use client'` 文件顶部 |
| 渲染位置 | 仅服务端 | 服务端预渲染 + 客户端水合 |
| 可 async | ✅ | ❌ |
| 访问数据库/文件系统 | ✅ | ❌ |
| useState / useEffect | ❌ | ✅ |
| 事件处理器（onClick 等） | ❌ | ✅ |
| 浏览器 API | ❌ | ✅ |
| 减少客户端 JS | ✅ | ❌ |

## 何时使用 `'use client'`

**需要 `'use client'` 的场景**：
- 使用 React hooks（`useState`、`useEffect`、`useRef`、`useContext` 等）
- 添加事件处理器（`onClick`、`onChange`、`onSubmit`）
- 使用浏览器 API（`window`、`localStorage`、`IntersectionObserver`）
- 使用仅客户端的第三方库（图表库、拖拽库、动画库）
- 使用 React Class Components

**不需要 `'use client'` 的场景**（保持为 Server Component）：
- 获取数据（fetch、数据库查询）
- 访问后端资源（文件系统、内部 API）
- 渲染静态/半静态内容
- 使用服务端专用包（bcrypt、nodemailer）

## `'use client'` 边界最小化策略

❌ 错误：在页面级标记 `'use client'`

```typescript
// ❌ 整个页面变成 Client Component，失去 SSR 优势
'use client'
export default function ProductPage() {
  const [count, setCount] = useState(0)
  const products = ... // 不能在这里 async fetch
  return <div>...</div>
}
```

✅ 正确：将交互部分隔离到子组件

```typescript
// app/products/page.tsx — Server Component
import { AddToCartButton } from './add-to-cart-button'

export default async function ProductPage() {
  const products = await db.product.findMany()  // 服务端直查
  return (
    <div>
      {products.map(p => (
        <div key={p.id}>
          <h2>{p.name}</h2>
          <p>{p.description}</p>
          <AddToCartButton productId={p.id} />  {/* 只有按钮是 Client */}
        </div>
      ))}
    </div>
  )
}
```

```typescript
// app/products/add-to-cart-button.tsx — Client Component
'use client'
import { useState } from 'react'

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)
  return (
    <button onClick={() => setAdded(true)}>
      {added ? '已添加' : '加入购物车'}
    </button>
  )
}
```

## 组合模式

### Server Component 作为 children 传入 Client Component

```typescript
// Client Component 接收 children
'use client'
export function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return open ? <aside>{children}</aside> : null
}

// Server Component 中使用
import { Sidebar } from './sidebar'
import { NavLinks } from './nav-links'  // Server Component

export default function Layout({ children }) {
  return (
    <Sidebar>
      <NavLinks />  {/* 仍然是 Server Component，在服务端渲染 */}
    </Sidebar>
  )
}
```

### Props 必须可序列化

从 Server Component 传给 Client Component 的 props 必须是 JSON 可序列化的：

✅ 允许：`string`、`number`、`boolean`、`null`、`Array`、`plain object`、`Date`（序列化为字符串）
❌ 不允许：`function`、`class instance`、`Symbol`、`Map`/`Set`（直接传递）

```typescript
// ❌ 不能传递函数
<ClientComponent onSave={async () => { /* server logic */ }} />

// ✅ 传递 Server Action（特殊支持）
<ClientComponent action={saveAction} />  // Server Action 可以作为 prop
```

## 常见错误模式

### 1. async Client Component

```typescript
// ❌ Client Component 不能是 async
'use client'
export default async function Page() {  // 错误！
  const data = await fetch(...)
  return <div>{data}</div>
}
```

解决：将数据获取移到 Server Component，通过 props 传递。

### 2. 在 Client Component 中导入 Server-only 模块

```typescript
// ❌ 这会把服务端代码打包到客户端
'use client'
import { db } from '@/lib/db'  // 数据库客户端不能在浏览器运行
```

解决：使用 `server-only` 包标记服务端专用模块：

```typescript
// lib/db.ts
import 'server-only'  // 如果被 Client Component 导入，构建时报错
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()
```

### 3. 在 Server Component 中使用 hooks

```typescript
// ❌ Server Component 不能用 hooks
export default function Page() {
  const [state, setState] = useState('')  // 错误！
  return <div>...</div>
}
```

## 第三方库处理

许多第三方库没有 `'use client'` 指令，需要在项目中封装：

```typescript
// components/chart-wrapper.tsx
'use client'
export { Chart } from 'third-party-chart-lib'

// 或者
'use client'
import { Chart as ThirdPartyChart } from 'third-party-chart-lib'
export function Chart(props) {
  return <ThirdPartyChart {...props} />
}
```

## Context 与 Provider 模式

Provider 通常需要 `'use client'`（因为使用 `useContext`），但可以在 Server Component 的 layout 中引用：

```typescript
// providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>
}

// app/layout.tsx — Server Component
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```
