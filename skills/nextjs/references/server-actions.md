# Server Actions 与数据变更

## 概念

Server Actions 是在服务端执行的异步函数，可以从 Client 和 Server Components 中调用，用于处理表单提交、数据变更等操作。

## 定义 Server Action

### 方式一：独立文件（推荐）

```typescript
// actions/posts.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(10, '内容至少 10 个字符'),
})

export async function createPost(prevState: any, formData: FormData) {
  // 1. 验证输入
  const validated = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  // 2. 数据变更
  await db.post.create({ data: validated.data })

  // 3. 缓存失效
  revalidatePath('/posts')

  // 4. 重定向（可选）
  redirect('/posts')
}
```

### 方式二：内联在 Server Component 中

```typescript
// app/posts/page.tsx — Server Component
export default function PostsPage() {
  async function deletePost(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await db.post.delete({ where: { id } })
    revalidatePath('/posts')
  }

  return (
    <form action={deletePost}>
      <input type="hidden" name="id" value="123" />
      <button type="submit">删除</button>
    </form>
  )
}
```

## 在表单中使用

### 基本表单

```typescript
// app/contact/page.tsx
import { submitContact } from '@/actions/contact'

export default function ContactPage() {
  return (
    <form action={submitContact}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">发送</button>
    </form>
  )
}
```

### 带状态反馈的表单（useActionState）

```typescript
'use client'
import { useActionState } from 'react'
import { createPost } from '@/actions/posts'

export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, {
    errors: {},
  })

  return (
    <form action={action}>
      <input name="title" />
      {state.errors?.title && <p className="error">{state.errors.title}</p>}

      <textarea name="content" />
      {state.errors?.content && <p className="error">{state.errors.content}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '创建文章'}
      </button>
    </form>
  )
}
```

### 乐观更新（useOptimistic）

```typescript
'use client'
import { useOptimistic } from 'react'
import { toggleLike } from '@/actions/likes'

export function LikeButton({ liked, count }: { liked: boolean; count: number }) {
  const [optimistic, setOptimistic] = useOptimistic(
    { liked, count },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : state.count - 1,
    })
  )

  async function handleLike() {
    setOptimistic(!optimistic.liked)
    await toggleLike()  // Server Action
  }

  return (
    <form action={handleLike}>
      <button>
        {optimistic.liked ? '❤️' : '🤍'} {optimistic.count}
      </button>
    </form>
  )
}
```

## 缓存失效

```typescript
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data })

  // 方式 1：失效路径
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)

  // 方式 2：失效标签（更精确）
  revalidateTag(`product-${id}`)
  revalidateTag('products-list')
}
```

## 重定向

```typescript
'use server'
import { redirect } from 'next/navigation'

export async function createUser(formData: FormData) {
  const user = await db.user.create({ data: { ... } })
  redirect(`/users/${user.id}`)  // 必须在 try/catch 外调用
}
```

⚠️ `redirect()` 通过抛出异常实现，不能在 `try/catch` 块内调用。

## 错误处理模式

```typescript
'use server'

// 返回结构化结果，不抛出异常
type ActionResult = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

export async function updateProfile(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const data = ProfileSchema.safeParse(Object.fromEntries(formData))
    if (!data.success) {
      return { success: false, errors: data.error.flatten().fieldErrors }
    }

    await db.user.update({ where: { id: userId }, data: data.data })
    revalidatePath('/profile')
    return { success: true, message: '更新成功' }
  } catch (error) {
    return { success: false, message: '更新失败，请重试' }
  }
}
```

## 安全注意事项

1. **始终验证输入**：Server Action 是公开端点，任何人可发送请求。
2. **始终检查认证和授权**：

```typescript
'use server'
import { auth } from '@/lib/auth'

export async function deletePost(id: string) {
  const session = await auth()
  if (!session) throw new Error('未认证')

  const post = await db.post.findUnique({ where: { id } })
  if (post.authorId !== session.user.id) throw new Error('无权限')

  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
}
```

3. **不要信任 formData 中的任何值**——包括 hidden inputs。

## 非表单调用

Server Actions 也可以在事件处理器中直接调用：

```typescript
'use client'
import { incrementViews } from '@/actions/analytics'

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    incrementViews(postId)
  }, [postId])

  return null
}
```

## 文件上传

```typescript
'use server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) return { error: '请选择文件' }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const path = join(process.cwd(), 'public/uploads', file.name)
  await writeFile(path, buffer)

  revalidatePath('/files')
  return { success: true, path: `/uploads/${file.name}` }
}
```
