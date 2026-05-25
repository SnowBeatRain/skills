# 服务端 API（Nitro）

## 概述

Nuxt 使用 Nitro 作为服务引擎。`server/` 目录下的文件自动注册为服务端路由和中间件。

## API 路由

### 基础定义

```typescript
// server/api/hello.ts
// → GET /api/hello
export default defineEventHandler((event) => {
  return { message: 'Hello World' }
})
```

### HTTP 方法

文件名后缀指定 HTTP 方法：

```
server/api/
├── users.get.ts       → GET    /api/users
├── users.post.ts      → POST   /api/users
├── users/
│   ├── [id].get.ts    → GET    /api/users/:id
│   ├── [id].put.ts    → PUT    /api/users/:id
│   └── [id].delete.ts → DELETE /api/users/:id
```

无后缀默认匹配所有 HTTP 方法。

### 请求处理

```typescript
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  // 读取请求体
  const body = await readBody(event)
  // body: { name: string, email: string }

  // 读取查询参数
  const query = getQuery(event)
  // /api/users?page=1&limit=10 → { page: '1', limit: '10' }

  // 读取路由参数
  const id = getRouterParam(event, 'id')

  // 读取请求头
  const auth = getHeader(event, 'authorization')

  // 读取 Cookie
  const token = getCookie(event, 'session-token')

  // 设置响应头
  setHeader(event, 'X-Custom', 'value')

  // 设置状态码
  setResponseStatus(event, 201)

  // 设置 Cookie
  setCookie(event, 'session-token', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })

  return { id: 1, ...body }
})
```

### 请求验证

```typescript
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (body) => {
    // 使用 zod 或手动验证
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'name is required',
      })
    }
    return body as { name: string; email: string }
  })

  return { id: 1, ...body }
})
```

使用 Zod 验证：

```typescript
// server/api/users.post.ts
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  // body 已经是类型安全的
  return createUser(body)
})
```

## 错误处理

```typescript
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const user = await findUser(id)

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
      message: `User with id ${id} does not exist`,
    })
  }

  return user
})
```

## 服务端中间件

```typescript
// server/middleware/log.ts
// 每个请求都会执行
export default defineEventHandler((event) => {
  console.log(`[${event.method}] ${getRequestURL(event)}`)
  // 不返回值 = 继续执行后续处理
})
```

```typescript
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  // 只检查 /api/ 开头的请求
  if (!getRequestURL(event).pathname.startsWith('/api/')) return

  const token = getHeader(event, 'authorization')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // 附加用户信息到 event context
  event.context.user = verifyToken(token)
})
```

## 服务端工具函数

```typescript
// server/utils/db.ts
// 自动导入，server/ 目录内直接使用
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

export function useDB() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}
```

```typescript
// server/api/users.get.ts
export default defineEventHandler(async () => {
  const db = useDB()
  return db.user.findMany()
})
```

## 服务端插件

```typescript
// server/plugins/database.ts
export default defineNitroPlugin((nitroApp) => {
  // Nitro 启动时执行
  console.log('Database plugin initialized')

  // 钩子
  nitroApp.hooks.hook('request', (event) => {
    // 每个请求
  })

  nitroApp.hooks.hook('close', async () => {
    // 服务关闭时清理
  })
})
```

## 运行时配置

```typescript
// server/api/external.get.ts
export default defineEventHandler(async (event) => {
  // 获取运行时配置（含私密变量）
  const config = useRuntimeConfig(event)
  
  const data = await $fetch('https://api.external.com/data', {
    headers: {
      'Authorization': `Bearer ${config.apiSecret}`,
    },
  })

  return data
})
```

## 服务端路由（非 /api 前缀）

```typescript
// server/routes/sitemap.xml.ts
// → GET /sitemap.xml
export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`
})
```

## WebSocket（实验性）

```typescript
// server/routes/_ws.ts
export default defineWebSocketHandler({
  open(peer) {
    console.log('WebSocket opened', peer.id)
  },
  message(peer, message) {
    peer.send(`Echo: ${message.text()}`)
  },
  close(peer) {
    console.log('WebSocket closed', peer.id)
  },
})
```

## 全捕获路由

```typescript
// server/api/[...path].ts
// 匹配 /api/ 下所有未被其他路由匹配的请求
export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  throw createError({ statusCode: 404, message: `API route not found: /api/${path}` })
})
```
