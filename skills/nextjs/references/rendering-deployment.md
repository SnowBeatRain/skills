# 渲染模式与部署

## 渲染模式

### 1. 动态渲染（默认）

每次请求时在服务端渲染页面：

```typescript
// 使用了动态函数 → 自动动态渲染
export default async function Page() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  // ...
}
```

触发动态渲染的条件：
- 使用 `cookies()`、`headers()`
- 使用 `searchParams`
- 未缓存的 `fetch` 请求（默认行为）

### 2. 静态渲染（预渲染）

构建时生成静态 HTML：

```typescript
// 没有动态函数且数据在构建时确定 → 静态渲染
export default async function Page() {
  'use cache'
  const posts = await db.post.findMany()
  return <PostList posts={posts} />
}

// 动态路由的静态生成
export async function generateStaticParams() {
  const posts = await db.post.findMany({ select: { slug: true } })
  return posts.map((post) => ({ slug: post.slug }))
}
```

### 3. ISR（增量静态再生）

结合静态生成和按需更新：

```typescript
// 时间驱动 ISR
async function getProducts() {
  'use cache'
  cacheLife({
    stale: 60,        // 60 秒内返回缓存
    revalidate: 120,  // 120 秒后后台重新生成
    expire: 3600,     // 1 小时强制失效
  })
  return db.product.findMany()
}

// 按需 ISR（通过 Server Action 或 API 触发）
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function publishPost() {
  await db.post.update({ ... })
  revalidateTag('posts')        // 失效标签
  revalidatePath('/blog')       // 失效路径
}
```

### 4. 静态导出

纯静态 HTML 输出（无服务端）：

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  // 可选：自定义输出目录
  distDir: 'out',
}
```

限制：
- 不支持 Server Components 的动态渲染
- 不支持 Route Handlers（除 GET 静态）
- 不支持中间件
- 不支持 ISR
- `<Image>` 需要自定义 loader

### 5. 部分预渲染（PPR）— 实验性

静态外壳 + 动态内容流式加载：

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    ppr: 'incremental',
  },
}

// layout.tsx 或 page.tsx
export const experimental_ppr = true

// 使用
export default function Page() {
  return (
    <div>
      <StaticHeader />              {/* 静态预渲染 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />          {/* 动态流式加载 */}
      </Suspense>
    </div>
  )
}
```

## 部署

### Vercel（推荐 / 零配置）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署（自动检测 Next.js）
vercel

# 生产部署
vercel --prod
```

Vercel 自动处理：
- Edge/Serverless Functions
- CDN 缓存和失效
- ISR
- Image 优化
- 环境变量管理

### Docker 自托管

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',  // 生成独立部署包
}
```

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### Node.js 服务器（自托管）

```bash
npm run build
# .next/ 目录包含构建产物
npm run start  # 启动 Node.js 生产服务器
```

配置自定义端口和 host：

```json
// package.json
{
  "scripts": {
    "start": "next start -p 8080 -H 0.0.0.0"
  }
}
```

## 环境变量

```bash
# .env.local（本地开发，不提交到 Git）
DATABASE_URL=postgresql://localhost:5432/mydb
API_SECRET=xxx

# 客户端可见（必须 NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://myapp.com
```

在代码中使用：

```typescript
// 服务端（Server Component、Server Action、Route Handler）
const dbUrl = process.env.DATABASE_URL  // ✅

// 客户端（Client Component）
const apiUrl = process.env.NEXT_PUBLIC_API_URL  // ✅
const secret = process.env.API_SECRET  // ❌ undefined（无 NEXT_PUBLIC_ 前缀）
```

## 缓存策略对照

| 场景 | 策略 |
|------|------|
| 不变的静态内容 | 构建时静态生成 |
| 偶尔更新 | ISR（时间驱动 + 按需失效） |
| 每次请求不同 | 动态渲染（默认） |
| 混合页面 | PPR（静态壳 + 动态内容） |
| 纯前端部署 | `output: 'export'` |
