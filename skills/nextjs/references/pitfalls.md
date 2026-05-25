# 避坑指南

## 1. Hydration Mismatch

**症状**：控制台警告 "Text content does not match server-rendered HTML"

**原因**：Server 和 Client 渲染结果不一致

**常见触发**：
```typescript
// ❌ 服务端和客户端生成不同值
<p>{new Date().toLocaleString()}</p>     // 时区差异
<p>{Math.random()}</p>                    // 随机值
<p>{typeof window !== 'undefined' && '...'}</p>  // 条件渲染

// ✅ 修复方案
// 方案 1：useEffect 中设置客户端特有值
'use client'
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <Skeleton />

// 方案 2：suppressHydrationWarning
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>
```

## 2. `async` Client Component

**症状**：`async/await is not yet supported in Client Components`

**原因**：Client Component 不能是 async 函数

```typescript
// ❌
'use client'
export default async function Page() { ... }

// ✅ 将数据获取移到 Server Component，通过 props 传入
// 或使用 SWR / useEffect 在客户端获取
```

## 3. Next.js 15 异步 API 未 await

**症状**：类型错误或运行时报错

```typescript
// ❌ params 现在是 Promise
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id  // 类型错误
}

// ✅ await params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}

// 同样适用于 searchParams、cookies()、headers()
const cookieStore = await cookies()
const headersList = await headers()
```

## 4. Layout 中使用 searchParams

**症状**：Layout 不响应 URL 查询参数变化

**原因**：Layout 在同级路由切换时不重新渲染

```typescript
// ❌ layout.tsx 不会在 searchParams 变化时更新
export default function Layout({ searchParams }) { ... }

// ✅ 将需要响应 searchParams 的逻辑放在 page.tsx 中
// 或使用 useSearchParams() 在 Client Component 中读取
```

## 5. 环境变量客户端不可见

**症状**：`process.env.MY_VAR` 在客户端是 `undefined`

```typescript
// ❌ 无 NEXT_PUBLIC_ 前缀，客户端不可见
const apiUrl = process.env.API_URL  // 客户端 undefined

// ✅ 客户端使用 NEXT_PUBLIC_ 前缀
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## 6. Server Component 中使用 Hooks

**症状**：`useState is not a function` 或类似错误

```typescript
// ❌ Server Component 不能用 hooks
export default function Page() {
  const [open, setOpen] = useState(false)  // 错误
}

// ✅ 把有 hooks 的部分提取为 Client Component
```

## 7. 在 Client Component 中 import Server Component

**症状**：服务端代码被打包到客户端

```typescript
// ❌ Client 不能 import Server Component
'use client'
import { ServerComponent } from './server-component'

// ✅ 通过 children 或 slot 传入
'use client'
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// 在 Server Component 中
<ClientWrapper>
  <ServerComponent />
</ClientWrapper>
```

## 8. Server Action 中 redirect 在 try/catch 内

**症状**：redirect 不生效

```typescript
// ❌ redirect 通过抛出异常实现，会被 catch 捕获
'use server'
export async function createPost(formData: FormData) {
  try {
    await db.post.create({ data: { ... } })
    redirect('/posts')  // 被 catch 吞掉了
  } catch (error) {
    return { error: 'Failed' }
  }
}

// ✅ 把 redirect 放在 try/catch 外部
'use server'
export async function createPost(formData: FormData) {
  let post
  try {
    post = await db.post.create({ data: { ... } })
  } catch (error) {
    return { error: 'Failed' }
  }
  redirect(`/posts/${post.id}`)
}
```

## 9. `nodeTypes` / 第三方库缺少 `'use client'`

**症状**：`createContext is not a function` 或 `useRef` 相关错误

```typescript
// ❌ 第三方库未声明 'use client'，在 Server Component 中报错
import { DatePicker } from 'some-ui-lib'  // 内部用了 hooks

// ✅ 封装一层
// components/date-picker-wrapper.tsx
'use client'
export { DatePicker } from 'some-ui-lib'
```

## 10. fetch 缓存预期不一致

**症状**：数据每次请求都重新获取（Next.js 15+）

```typescript
// Next.js 15+ 默认 no-store，每次都重新获取
const res = await fetch('https://api.example.com/data')

// 如需缓存，显式声明
async function getData() {
  'use cache'
  cacheLife('hours')
  const res = await fetch('https://api.example.com/data')
  return res.json()
}
```

## 11. `revalidatePath` 不生效

**常见原因**：
- 路径写错（注意大小写和斜杠）
- 动态路由需要具体路径而非模式
- 在 Route Handler 而非 Server Action 中调用，需要返回响应后才生效

```typescript
// ✅ 正确用法
revalidatePath('/blog')              // 失效 /blog
revalidatePath('/blog/[slug]', 'page')  // 失效所有 /blog/xxx 页面
revalidatePath('/blog/[slug]', 'layout')  // 失效 layout 及其下所有页面
revalidatePath('/', 'layout')        // 失效整个应用
```

## 12. Image 组件不显示

**排查清单**：
1. 远程图片：是否在 `next.config.ts` 的 `images.remotePatterns` 中配置？
2. 是否指定了 `width`/`height` 或 `fill`？
3. `fill` 模式：父容器是否设置了 `position: relative` 和明确宽高？
4. `src` 是否以 `/` 开头（相对 public 目录）？

## 13. middleware 中无法访问 request body

```typescript
// ❌ middleware 不能读取 body
export function middleware(request: NextRequest) {
  const body = await request.json()  // 不工作
}

// ✅ body 读取放在 Route Handler 或 Server Action 中
```

## 14. 生产环境与开发环境行为不一致

常见差异：
- **缓存**：开发环境不缓存任何东西，生产环境会缓存
- **错误信息**：生产环境错误被精简（看不到堆栈）
- **静态生成**：`generateStaticParams` 仅在 build 时执行
- **中间件**：开发时每次热更新可能重新执行

建议：定期用 `npm run build && npm run start` 测试生产行为。
