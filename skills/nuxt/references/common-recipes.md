# 常用模式与配方

## 认证系统

### 基础登录流程

```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await verifyCredentials(email, password)
  if (!user) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }

  const token = generateJWT(user)

  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })

  return { user: { id: user.id, name: user.name, email: user.email } }
})
```

```typescript
// app/composables/useAuth.ts
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const { user: userData } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = userData
    await navigateTo('/dashboard')
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  async function fetchUser() {
    try {
      user.value = await $fetch('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  return { user, isLoggedIn, login, logout, fetchUser }
}
```

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
```

## 表单处理

### 基础表单

```vue
<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  message: '',
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

async function handleSubmit() {
  errors.value = {}
  isSubmitting.value = true

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form,
    })
    // 成功处理
    navigateTo('/thank-you')
  } catch (error: any) {
    if (error.data?.errors) {
      errors.value = error.data.errors
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="name">姓名</label>
      <input id="name" v-model="form.name" />
      <span v-if="errors.name" class="error">{{ errors.name }}</span>
    </div>
    <div>
      <label for="email">邮箱</label>
      <input id="email" v-model="form.email" type="email" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? '提交中...' : '提交' }}
    </button>
  </form>
</template>
```

## 无限滚动 / 分页

```vue
<script setup lang="ts">
const page = ref(1)
const allPosts = ref<Post[]>([])

const { data, status } = await useFetch('/api/posts', {
  query: { page, limit: 20 },
  watch: [page],
  transform: (newPosts) => {
    if (page.value === 1) {
      allPosts.value = newPosts
    } else {
      allPosts.value = [...allPosts.value, ...newPosts]
    }
    return newPosts
  },
})

const hasMore = computed(() => data.value?.length === 20)

function loadMore() {
  page.value++
}

// 使用 IntersectionObserver 自动加载
const loadMoreRef = ref<HTMLElement>()
onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasMore.value && status.value !== 'pending') {
      loadMore()
    }
  })
  if (loadMoreRef.value) observer.observe(loadMoreRef.value)
})
</script>

<template>
  <div>
    <div v-for="post in allPosts" :key="post.id">
      {{ post.title }}
    </div>
    <div ref="loadMoreRef" v-if="hasMore">
      <span v-if="status === 'pending'">加载中...</span>
    </div>
  </div>
</template>
```

## 国际化（i18n）

```bash
npx nuxi module add i18n
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'zh', name: '中文', file: 'zh.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'zh',
    langDir: 'locales/',
    strategy: 'prefix_except_default',
  },
})
```

```json
// locales/zh.json
{
  "welcome": "欢迎",
  "hello": "你好，{name}"
}
```

```vue
<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
</script>

<template>
  <div>
    <p>{{ t('welcome') }}</p>
    <p>{{ t('hello', { name: '世界' }) }}</p>
    <button @click="setLocale('en')">English</button>
  </div>
</template>
```

## 深色模式

```bash
npx nuxi module add color-mode
```

```vue
<script setup lang="ts">
const colorMode = useColorMode()
// colorMode.preference: 'system' | 'light' | 'dark'
// colorMode.value: 实际生效的模式
</script>

<template>
  <div>
    <button @click="colorMode.preference = 'dark'">暗色</button>
    <button @click="colorMode.preference = 'light'">亮色</button>
    <button @click="colorMode.preference = 'system'">跟随系统</button>
  </div>
</template>
```

## 错误处理

### 全局错误页

```vue
<!-- app/error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode === 404 ? '页面未找到' : '出错了' }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">返回首页</button>
  </div>
</template>
```

### 组件级错误处理

```vue
<template>
  <NuxtErrorBoundary @error="handleError">
    <SomeRiskyComponent />
    <template #error="{ error, clearError }">
      <div>
        <p>组件出错: {{ error.message }}</p>
        <button @click="clearError">重试</button>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>
```

### 编程式抛出错误

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/post/' + route.params.id)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode,
    statusMessage: '文章未找到',
    fatal: true, // 显示全屏错误页
  })
}
</script>
```

## WebSocket 实时通信

```typescript
// server/routes/_ws.ts
export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe('chat')
  },
  message(peer, message) {
    // 广播给所有订阅 'chat' 的连接
    peer.publish('chat', message.text())
  },
  close(peer) {
    peer.unsubscribe('chat')
  },
})
```

```vue
<!-- app/components/Chat.vue -->
<script setup lang="ts">
const messages = ref<string[]>([])

const ws = ref<WebSocket>()

onMounted(() => {
  ws.value = new WebSocket(`ws://${window.location.host}/_ws`)
  ws.value.onmessage = (event) => {
    messages.value.push(event.data)
  }
})

onUnmounted(() => {
  ws.value?.close()
})

function sendMessage(text: string) {
  ws.value?.send(text)
}
</script>
```

## 文件上传

```typescript
// server/api/upload.post.ts
export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: '没有上传文件' })
  }

  const file = files[0]
  const fileName = `${Date.now()}-${file.filename}`

  // 保存文件（示例用本地存储）
  await writeFile(`./public/uploads/${fileName}`, file.data)

  return { url: `/uploads/${fileName}` }
})
```

```vue
<script setup lang="ts">
async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const formData = new FormData()
  formData.append('file', input.files[0])

  const { url } = await $fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  console.log('上传成功:', url)
}
</script>
```

## 定时任务（Cron）

```typescript
// server/plugins/cron.ts
export default defineNitroPlugin((nitroApp) => {
  // 使用 Nitro 的定时任务（需开启实验性功能）
  // 或使用 node-cron
})
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '*/5 * * * *': ['cleanup'],  // 每 5 分钟
    },
  },
})
```

```typescript
// server/tasks/cleanup.ts
export default defineTask({
  meta: { description: '清理过期数据' },
  run() {
    console.log('执行清理任务')
    return { result: 'success' }
  },
})
```
