# 性能优化

## 1. 流式渲染（Streaming）

### loading.tsx

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
    </div>
  )
}
```

### Suspense 细粒度控制

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 每个区块独立加载 */}
      <Suspense fallback={<CardSkeleton />}>
        <Revenue />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <Users />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}
```

## 2. 并行数据获取

```typescript
// ✅ 并行发起
export default async function Page() {
  const [products, categories, user] = await Promise.all([
    getProducts(),
    getCategories(),
    getUser(),
  ])
  return <div>{/* ... */}</div>
}

// 更好：用 Suspense 解耦
export default function Page() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <ProductList />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Categories />
      </Suspense>
    </>
  )
}
```

## 3. 动态导入（Code Splitting）

```typescript
import dynamic from 'next/dynamic'

// 仅在客户端加载（SSR 时显示 loading）
const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // 不在服务端渲染
})

// 条件加载
const AdminPanel = dynamic(() => import('@/components/admin-panel'))

export default function Page({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <MainContent />
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

## 4. 图片优化

参见 `references/image-font.md`，核心要点：

- 首屏图片加 `priority`
- 使用 `sizes` 属性避免过大下载
- 配置 `formats: ['image/avif', 'image/webp']`
- 使用 `placeholder="blur"` 减少视觉跳动

## 5. 减少客户端 JavaScript

```typescript
// ✅ 保持 Server Component（零客户端 JS）
export default async function ProductCard({ id }: { id: string }) {
  const product = await getProduct(id)
  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <AddToCartButton id={product.id} />  {/* 只有这个是 Client */}
    </div>
  )
}
```

## 6. 预取与导航

```typescript
import Link from 'next/link'

// <Link> 默认预取可视区域内的链接
export function Navigation() {
  return (
    <nav>
      <Link href="/about">关于</Link>
      <Link href="/blog" prefetch={false}>博客（禁用预取）</Link>
    </nav>
  )
}
```

## 7. Bundle 分析

```bash
# 安装
npm install @next/bundle-analyzer

# next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)

# 运行分析
ANALYZE=true npm run build
```

## 8. 缓存策略

```typescript
// 函数级缓存
async function getProducts() {
  'use cache'
  cacheLife('hours')
  return db.product.findMany()
}

// React 请求去重（同一渲染中相同 fetch 只执行一次）
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`)  // 自动去重
  return res.json()
}
```

## 9. 第三方脚本优化

```typescript
import Script from 'next/script'

export default function Layout({ children }) {
  return (
    <>
      {children}
      {/* 在页面交互后加载 */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="lazyOnload"  // 'beforeInteractive' | 'afterInteractive' | 'lazyOnload'
      />
    </>
  )
}
```

## 10. 数据库查询优化

```typescript
// ✅ 只查询需要的字段
const posts = await db.post.findMany({
  select: { id: true, title: true, slug: true },
  take: 10,
})

// ✅ 分页而非全量加载
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = parseInt(page ?? '1')
  const posts = await db.post.findMany({
    skip: (currentPage - 1) * 10,
    take: 10,
  })
  return <PostList posts={posts} page={currentPage} />
}
```

## 性能检查清单

- [ ] 首屏图片设置 `priority`
- [ ] 使用 `<Suspense>` 和 `loading.tsx` 流式加载慢内容
- [ ] 并行数据获取（`Promise.all` 或独立 Suspense）
- [ ] 重型客户端组件用 `next/dynamic` 动态导入
- [ ] `'use client'` 尽量下推到叶子组件
- [ ] 第三方脚本使用 `next/script` + 合适的 strategy
- [ ] 分析 bundle 大小，拆分过大的依赖
- [ ] 数据库查询使用 select 和分页
- [ ] 合理使用缓存（`use cache` / ISR）
- [ ] 配置 `images.formats` 支持 AVIF/WebP
