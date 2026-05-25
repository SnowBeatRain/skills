# 数据获取与缓存

## 核心原则

- **数据获取在 Server Component 中完成**——减少客户端 JS，避免暴露敏感信息
- **Next.js 15+ `fetch` 默认不缓存**——每次请求都从数据源获取最新数据
- **需要缓存时显式声明**——使用 `use cache` 指令或 `cacheLife`

## Server Component 数据获取

### 基本 fetch

```typescript
// app/posts/page.tsx — Server Component
export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 数据库直查

```typescript
// app/users/page.tsx
import { db } from '@/lib/db'

export default async function UsersPage() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}
```

## 缓存机制（Next.js 15+）

### `use cache` 指令

```typescript
// 函数级缓存
async function getProducts() {
  'use cache'
  const res = await fetch('https://api.example.com/products')
  return res.json()
}

// 组件级缓存
async function ProductList() {
  'use cache'
  const products = await db.product.findMany()
  return <div>{/* ... */}</div>
}
```

### `cacheLife` — 控制缓存生命周期

```typescript
import { cacheLife } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheLife('hours')  // 预设：'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'
  const res = await fetch('https://api.example.com/products')
  return res.json()
}
```

自定义缓存生命周期（在 `next.config.ts` 中定义）：

```typescript
// next.config.ts
const nextConfig = {
  cacheLife: {
    products: {
      stale: 300,      // 5 分钟内直接返回缓存
      revalidate: 600, // 10 分钟后后台重新验证
      expire: 3600,    // 1 小时后强制失效
    },
  },
}
```

### `cacheTag` — 标签化缓存

```typescript
import { cacheTag } from 'next/cache'

async function getProduct(id: string) {
  'use cache'
  cacheTag(`product-${id}`, 'products')
  return db.product.findUnique({ where: { id } })
}
```

### 按需失效缓存

```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

// 失效特定标签
revalidateTag('products')
revalidateTag(`product-${id}`)

// 失效特定路径
revalidatePath('/products')
revalidatePath('/products/[id]', 'page')
```

## 请求去重

React 自动对同一渲染过程中的相同 `fetch` 调用去重：

```typescript
// 这两个组件调用相同 URL，实际只发一次请求
async function ProductPrice({ id }) {
  const product = await fetch(`/api/products/${id}`)  // 去重
  return <span>{product.price}</span>
}

async function ProductName({ id }) {
  const product = await fetch(`/api/products/${id}`)  // 去重
  return <h2>{product.name}</h2>
}
```

**注意**：去重仅适用于 `fetch` 的 GET 请求，且仅在 React 组件树渲染期间有效。

## 并行数据获取

```typescript
// ✅ 并行获取（推荐）
export default async function Dashboard() {
  // 同时发起，不互相等待
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics(),
  ])

  return <div>{/* 使用 user, posts, analytics */}</div>
}

// ❌ 瀑布式获取（避免）
export default async function Dashboard() {
  const user = await getUser()          // 等待完成...
  const posts = await getPosts()        // 再开始这个...
  const analytics = await getAnalytics() // 最后这个
  return <div>...</div>
}
```

## 流式加载（Suspense）

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />  {/* 慢请求，异步加载 */}
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />  {/* 另一个慢请求 */}
      </Suspense>
    </div>
  )
}

async function Stats() {
  const stats = await getStats()  // 可能很慢
  return <div>{/* 渲染 stats */}</div>
}
```

## 客户端数据获取

当需要客户端实时更新（轮询、WebSocket、用户交互后重新获取）时：

```typescript
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function LivePrice({ symbol }: { symbol: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/price/${symbol}`,
    fetcher,
    { refreshInterval: 5000 }  // 每 5 秒轮询
  )

  if (isLoading) return <span>Loading...</span>
  if (error) return <span>Error</span>
  return <span>{data.price}</span>
}
```

## 数据获取模式总结

| 场景 | 方式 |
|------|------|
| 页面加载时获取 | Server Component + `async/await` |
| 需要缓存 | `use cache` + `cacheLife` |
| 需要按需失效 | `cacheTag` + `revalidateTag` |
| 多个独立请求 | `Promise.all()` 并行 |
| 慢请求不阻塞页面 | `<Suspense>` 流式加载 |
| 客户端实时数据 | SWR / React Query |
| 用户交互后获取 | Server Action 或 Client fetch |
| ISR | `revalidate` 时间配置 |
