# 状态管理

## useState

Nuxt 提供 `useState` composable，创建跨组件共享的 SSR 安全响应式状态。

### 基础用法

```vue
<script setup lang="ts">
// 创建/获取名为 'counter' 的全局状态
const counter = useState<number>('counter', () => 0)
// 初始化函数只在首次调用时执行

counter.value++
</script>
```

### 共享状态 Composable 模式

```typescript
// app/composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null)
}

export function useLoggedIn() {
  const user = useUser()
  return computed(() => !!user.value)
}
```

```vue
<!-- 任意组件中使用 -->
<script setup lang="ts">
const user = useUser()
const isLoggedIn = useLoggedIn()
</script>
```

### 注意事项

```typescript
// ❌ 错误：在模块顶层定义 ref（跨请求状态污染）
const globalState = ref(0)

export function useCounter() {
  return globalState
}

// ✅ 正确：使用 useState
export function useCounter() {
  return useState('counter', () => 0)
}
```

**为什么不能裸用 ref？** 在 SSR 模式下，模块顶层的 `ref` 会在多个请求之间共享，导致一个用户的状态污染另一个用户。`useState` 确保每个请求有独立的状态实例。

## Pinia 集成

对于复杂状态管理，推荐使用 Pinia。

### 安装配置

```bash
npx nuxi module add pinia
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
})
```

### 定义 Store

```typescript
// app/stores/user.ts
export const useUserStore = defineStore('user', () => {
  // state
  const user = ref<User | null>(null)
  const token = ref<string>('')

  // getters
  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(() => user.value?.name ?? 'Guest')

  // actions
  async function login(credentials: LoginInput) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    user.value = data.user
    token.value = data.token
  }

  function logout() {
    user.value = null
    token.value = ''
    navigateTo('/login')
  }

  return { user, token, isLoggedIn, displayName, login, logout }
})
```

### 在组件中使用

```vue
<script setup lang="ts">
const userStore = useUserStore()

// 解构响应式属性用 storeToRefs
const { user, isLoggedIn, displayName } = storeToRefs(userStore)

// actions 直接解构
const { login, logout } = userStore
</script>
```

### SSR 注意事项

Pinia 在 Nuxt 中自动处理 SSR 状态序列化。但需注意：

```typescript
// ❌ 错误：在 store 中使用浏览器 API
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')
  return { theme }
})

// ✅ 正确：使用 useCookie 或条件判断
export const useSettingsStore = defineStore('settings', () => {
  const themeCookie = useCookie('theme', { default: () => 'light' })
  return { theme: themeCookie }
})
```

## useCookie

跨 SSR/客户端 安全读写 Cookie：

```vue
<script setup lang="ts">
// 读取/创建 Cookie（SSR + 客户端都可用）
const locale = useCookie<string>('locale', {
  default: () => 'zh-CN',
  maxAge: 60 * 60 * 24 * 365, // 1 年
  watch: true, // 值变化时自动更新 Cookie
})

// 修改 Cookie
locale.value = 'en-US'
</script>
```

## shallowRef 与性能

大型数据集使用 `shallowRef` 避免深层响应式开销：

```typescript
// app/composables/useLargeList.ts
export function useLargeList() {
  const items = useState<Item[]>('large-list', () => shallowRef([]))

  function updateItems(newItems: Item[]) {
    // 必须整体替换触发更新
    items.value = [...newItems]
  }

  return { items: readonly(items), updateItems }
}
```

## 状态持久化

```typescript
// app/composables/usePersistedState.ts
export function usePersistedState<T>(key: string, defaultValue: T) {
  const cookie = useCookie<T>(key, {
    default: () => defaultValue,
    maxAge: 60 * 60 * 24 * 30, // 30 天
  })
  return cookie
}
```

## 选择建议

| 场景 | 方案 |
|---|---|
| 简单跨组件共享状态 | `useState` |
| 需要持久化到 Cookie | `useCookie` |
| 复杂业务逻辑（多 getter/action） | Pinia |
| 临时组件内状态 | `ref` / `reactive`（组件内） |
| 表单数据 | `ref` / `reactive`（组件内） |
| 全局 UI 状态（侧边栏开关等） | `useState` |
| 认证状态 | Pinia + `useCookie` |
