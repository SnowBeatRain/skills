# 常用模式与配方

## 1. 认证保护模式

### 中间件 + Layout 双重验证

```typescript
// middleware.ts
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

```typescript
// app/(protected)/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <>{children}</>
}
```

### Server Action 中验证

```typescript
'use server'
import { auth } from '@/lib/auth'

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  // ...
}
```

## 2. 搜索与筛选（URL 状态）

```typescript
// app/products/page.tsx — Server Component
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const { q, category, page } = await searchParams
  const products = await searchProducts({
    query: q,
    category,
    page: parseInt(page ?? '1'),
  })

  return (
    <div>
      <SearchBar defaultValue={q} />
      <CategoryFilter selected={category} />
      <ProductGrid products={products} />
      <Pagination currentPage={parseInt(page ?? '1')} />
    </div>
  )
}
```

```typescript
// components/search-bar.tsx — Client Component
'use client'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    params.set('page', '1')  // 重置页码
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="搜索..."
    />
  )
}
```

## 3. 无限滚动

```typescript
// components/infinite-list.tsx
'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { loadMorePosts } from '@/actions/posts'

export function InfiniteList({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isPending, startTransition] = useTransition()
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isPending) {
        startTransition(async () => {
          const newPosts = await loadMorePosts(page + 1)
          if (newPosts.length === 0) {
            setHasMore(false)
          } else {
            setPosts((prev) => [...prev, ...newPosts])
            setPage((prev) => prev + 1)
          }
        })
      }
    })

    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [page, hasMore, isPending])

  return (
    <div>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      <div ref={loaderRef}>
        {isPending && <LoadingSpinner />}
      </div>
    </div>
  )
}
```

## 4. 模态框模式（拦截路由）

```
app/
├── @modal/
│   ├── (.)photos/[id]/
│   │   └── page.tsx       → 拦截导航显示模态框
│   └── default.tsx        → null（不显示时）
├── photos/
│   └── [id]/
│       └── page.tsx       → 直接访问/刷新时显示完整页面
├── layout.tsx
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({ children, modal }) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

// app/@modal/(.)photos/[id]/page.tsx
import { Modal } from '@/components/modal'

export default async function PhotoModal({ params }) {
  const { id } = await params
  const photo = await getPhoto(id)
  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  )
}

// app/@modal/default.tsx
export default function Default() {
  return null
}
```

## 5. 表单与验证

```typescript
// lib/schemas.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, '名字至少 2 个字符'),
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少 8 位'),
})

// actions/users.ts
'use server'
import { createUserSchema } from '@/lib/schemas'

export async function createUser(prevState: any, formData: FormData) {
  const result = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const user = await db.user.create({ data: result.data })
  redirect(`/users/${user.id}`)
}
```

## 6. 面包屑导航

```typescript
// components/breadcrumbs.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex gap-2">
        <li><Link href="/">首页</Link></li>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1
          return (
            <li key={href} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? (
                <span className="font-semibold">{segment}</span>
              ) : (
                <Link href={href}>{segment}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

## 7. 主题切换（暗色模式）

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## 8. 多语言（i18n）

```
app/
└── [locale]/
    ├── layout.tsx
    ├── page.tsx
    └── about/page.tsx
```

```typescript
// app/[locale]/layout.tsx
import { notFound } from 'next/navigation'

const locales = ['zh', 'en', 'ja']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
```

## 9. 文件下载

```typescript
// app/api/download/[filename]/route.ts
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const filePath = join(process.cwd(), 'files', filename)

  const file = await readFile(filePath)

  return new Response(file, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/octet-stream',
    },
  })
}
```

## 10. WebSocket / 实时更新

Next.js 不内建 WebSocket 服务。推荐方案：

- **Vercel**：使用 Ably / Pusher / Liveblocks
- **自托管**：在自定义 server 中添加 WebSocket

客户端轮询替代方案：

```typescript
'use client'
import useSWR from 'swr'

export function LiveNotifications() {
  const { data } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 3000,  // 3 秒轮询
  })
  return <NotificationList items={data} />
}
```
