# 路由处理器（Route Handlers）

## 概念

Route Handlers 允许在 `app/` 目录中使用标准 Web API（`Request`/`Response`）创建 API 端点。

## 基本结构

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

## 支持的 HTTP 方法

`GET`、`POST`、`PUT`、`PATCH`、`DELETE`、`HEAD`、`OPTIONS`

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id } })

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const post = await db.post.update({ where: { id }, data: body })
  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

## 请求处理

### 查询参数

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')

  const users = await db.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json(users)
}
```

### 请求体

```typescript
export async function POST(request: NextRequest) {
  // JSON body
  const json = await request.json()

  // FormData
  const formData = await request.formData()
  const file = formData.get('file') as File

  // 文本
  const text = await request.text()

  return NextResponse.json({ received: true })
}
```

### Headers

```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')

  return NextResponse.json(
    { data: 'protected' },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Custom-Header': 'value',
      },
    }
  )
}
```

### Cookies

```typescript
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')

  return NextResponse.json({ token: token?.value })
}

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('token', 'abc123', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })
  return response
}
```

## CORS 配置

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  const data = await getData()
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

## 流式响应

```typescript
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: i })}\n\n`))
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

## 重定向

```typescript
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  // ...
}
```

## 动态 vs 静态

- 使用 `cookies()`、`headers()` 或读取动态数据 → 动态路由
- 仅 `GET` 且无动态数据 → 可被静态缓存

强制动态：

```typescript
export const dynamic = 'force-dynamic'

export async function GET() { /* ... */ }
```

## 注意事项

1. `route.ts` **不能与同目录的 `page.tsx` 共存**
2. 每个路由段只能有一个 `route.ts`
3. 优先使用 Server Actions 处理表单，Route Handlers 用于：
   - 第三方 webhook
   - 需要自定义 Response 的场景（流式、文件下载）
   - 外部 API 供第三方消费
