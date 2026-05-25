# 中间件

## 概念

中间件在请求到达路由之前运行，可以修改请求/响应、重定向、重写 URL 或设置 headers。

**文件位置**：项目根目录（与 `app/` 同级）的 `middleware.ts`。

## 基本结构

```typescript
// middleware.ts（项目根目录）
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 逻辑处理...
  return NextResponse.next()  // 继续处理
}

// 路由匹配配置
export const config = {
  matcher: [
    // 匹配所有路由，排除静态文件和 API
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 匹配器（Matcher）

```typescript
export const config = {
  matcher: [
    // 特定路径
    '/dashboard/:path*',
    '/admin/:path*',

    // 正则模式
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

也可以在中间件函数内条件判断：

```typescript
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // 仅对 /dashboard 路径执行
  }
  return NextResponse.next()
}
```

## 常见用例

### 1. 认证保护

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session-token')?.value

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

### 2. 国际化路由

```typescript
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const locales = ['en', 'zh', 'ja']
const defaultLocale = 'zh'

function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') ?? '' }
  const languages = new Negotiator({ headers }).languages()
  return match(languages, locales, defaultLocale)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查路径是否已包含 locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (pathnameHasLocale) return NextResponse.next()

  // 重定向到带 locale 的路径
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}
```

### 3. A/B 测试

```typescript
export function middleware(request: NextRequest) {
  const bucket = request.cookies.get('ab-bucket')?.value

  if (!bucket) {
    const response = NextResponse.next()
    const newBucket = Math.random() > 0.5 ? 'a' : 'b'
    response.cookies.set('ab-bucket', newBucket)
    return response
  }

  // 重写到对应版本
  if (bucket === 'b' && request.nextUrl.pathname === '/pricing') {
    return NextResponse.rewrite(new URL('/pricing-v2', request.url))
  }

  return NextResponse.next()
}
```

### 4. 添加自定义 Headers

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 设置响应 headers
  response.headers.set('X-Request-Id', crypto.randomUUID())

  // 设置请求 headers（传递给下游）
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
```

### 5. 限流（简易）

```typescript
const rateLimit = new Map<string, { count: number; timestamp: number }>()

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
    const now = Date.now()
    const windowMs = 60_000  // 1 分钟窗口
    const maxRequests = 100

    const record = rateLimit.get(ip)
    if (record && now - record.timestamp < windowMs) {
      if (record.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
      record.count++
    } else {
      rateLimit.set(ip, { count: 1, timestamp: now })
    }
  }

  return NextResponse.next()
}
```

## 重定向 vs 重写

```typescript
// 重定向：用户看到 URL 变化（302/307）
NextResponse.redirect(new URL('/new-path', request.url))

// 重写：URL 不变，但内部指向另一个路由
NextResponse.rewrite(new URL('/internal-path', request.url))
```

## 限制与注意事项

1. **运行在 Edge Runtime**——不能使用 Node.js 特有 API（`fs`、原生数据库驱动）
2. **只能有一个** `middleware.ts`——通过条件逻辑处理不同路径
3. **保持轻量**——中间件在每个匹配请求前执行，重逻辑影响性能
4. **不能直接访问 request body**——POST body 在中间件中不可读取
5. **Response body 大小限制**——中间件主要做路由控制，不做内容生成
6. **中间件产生的 cookies** 在 Server Components 的 `cookies()` 中可用

## Next.js 16 变化

在 Next.js 16 中，`middleware.ts` 将重命名为 `proxy.ts`（`middleware.ts` 仍兼容但标记为弃用）。
