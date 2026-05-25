# 错误处理

## 错误边界层级

```
app/
├── global-error.tsx    → 根布局错误（替换整个 <html>）
├── layout.tsx
├── error.tsx           → 根页面错误
├── page.tsx
└── dashboard/
    ├── error.tsx       → /dashboard 段的错误边界
    ├── loading.tsx
    └── page.tsx
```

## error.tsx

每个路由段的错误边界。**必须是 Client Component**（因为使用了 hooks）。

```typescript
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void  // 重试函数
}) {
  return (
    <div className="error-container">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  )
}
```

**特性**：
- 自动包裹同级 `page.tsx` 和所有子路由
- 不捕获同级 `layout.tsx` 的错误（layout 在错误边界之上）
- `reset()` 尝试重新渲染错误边界内的内容
- `error.digest` 是错误的哈希值（生产环境用于日志匹配，不暴露给用户）

## global-error.tsx

根布局的错误边界，替换整个 `<html>` 标签：

```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>服务出错</h2>
        <button onClick={() => reset()}>重试</button>
      </body>
    </html>
  )
}
```

## not-found.tsx

自定义 404 页面：

```typescript
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>页面不存在</h2>
      <p>找不到请求的资源</p>
      <Link href="/">返回首页</Link>
    </div>
  )
}
```

### 编程式触发 404

```typescript
import { notFound } from 'next/navigation'

export default async function PostPage({ params }) {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id } })

  if (!post) {
    notFound()  // 渲染最近的 not-found.tsx
  }

  return <article>{post.content}</article>
}
```

## Server Action 错误处理

### 预期错误（用返回值传递）

```typescript
// actions/auth.ts
'use server'

type LoginResult = {
  success: boolean
  error?: string
}

export async function login(prevState: LoginResult, formData: FormData): Promise<LoginResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await authenticate(email, password)
  if (!user) {
    return { success: false, error: '邮箱或密码错误' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}
```

```typescript
// Client Component 使用
'use client'
import { useActionState } from 'react'
import { login } from '@/actions/auth'

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, { success: true })

  return (
    <form action={action}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      {state.error && <p className="text-red-500">{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? '登录中...' : '登录'}
      </button>
    </form>
  )
}
```

### 非预期错误（让错误边界捕获）

```typescript
'use server'

export async function deleteUser(id: string) {
  const session = await auth()
  if (!session) {
    throw new Error('未认证')  // 被 error.tsx 捕获
  }

  // 数据库操作可能抛出非预期错误
  await db.user.delete({ where: { id } })
  revalidatePath('/users')
}
```

## 错误日志

```typescript
// app/dashboard/error.tsx
'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 上报错误到监控服务
    reportError(error)
  }, [error])

  return (
    <div>
      <h2>出错了</h2>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

## 错误处理最佳实践

1. **每个重要路由段都放 `error.tsx`**——避免错误向上冒泡到根错误边界
2. **Server Action 预期错误用返回值**——不抛出异常，返回 `{ error: string }`
3. **区分预期和非预期错误**——预期错误（验证失败、未认证）用返回值；非预期错误（数据库崩溃）让错误边界处理
4. **生产环境不暴露错误详情**——只显示友好消息，详细信息通过 `digest` 查日志
5. **配合 `loading.tsx`**——用户至少看到加载状态，而非直接看到错误
