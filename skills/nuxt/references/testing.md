# 测试

## 概述

Nuxt 提供 `@nuxt/test-utils` 库，与 Vitest 集成，支持单元测试和端到端测试。

## 安装配置

```bash
pnpm add -D @nuxt/test-utils vitest @vue/test-utils
```

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    // 环境选项
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom', // 'happy-dom' | 'jsdom'
      },
    },
  },
})
```

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## 单元测试

### 测试 Composables

```typescript
// tests/composables/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('useCounter', () => {
  it('should increment counter', async () => {
    const component = await mountSuspended({
      setup() {
        const count = useState('counter', () => 0)
        const increment = () => count.value++
        return { count, increment }
      },
      template: '<button @click="increment">{{ count }}</button>',
    })

    expect(component.text()).toBe('0')
    await component.find('button').trigger('click')
    expect(component.text()).toBe('1')
  })
})
```

### 测试组件

```typescript
// tests/components/UserCard.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UserCard from '~/components/UserCard.vue'

describe('UserCard', () => {
  it('renders user name', async () => {
    const component = await mountSuspended(UserCard, {
      props: {
        user: { id: 1, name: 'Alice', email: 'alice@example.com' },
      },
    })

    expect(component.text()).toContain('Alice')
    expect(component.text()).toContain('alice@example.com')
  })

  it('emits click event', async () => {
    const component = await mountSuspended(UserCard, {
      props: {
        user: { id: 1, name: 'Alice', email: 'alice@example.com' },
      },
    })

    await component.find('.user-card').trigger('click')
    expect(component.emitted('select')).toHaveLength(1)
  })
})
```

### 测试页面

```typescript
// tests/pages/index.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('Index Page', () => {
  it('renders welcome message', async () => {
    const page = await mountSuspended(IndexPage)
    expect(page.text()).toContain('欢迎')
  })
})
```

## Mock 数据获取

```typescript
// tests/pages/users.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import UsersPage from '~/pages/users/index.vue'

describe('Users Page', () => {
  it('renders user list', async () => {
    // 注册 mock API 端点
    registerEndpoint('/api/users', () => [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])

    const page = await mountSuspended(UsersPage)

    expect(page.text()).toContain('Alice')
    expect(page.text()).toContain('Bob')
  })
})
```

## 测试 Server API

```typescript
// tests/server/api/users.test.ts
import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Users API', async () => {
  await setup({
    // 启动 Nuxt 服务
  })

  it('GET /api/users returns user list', async () => {
    const users = await $fetch('/api/users')
    expect(Array.isArray(users)).toBe(true)
  })

  it('POST /api/users creates user', async () => {
    const user = await $fetch('/api/users', {
      method: 'POST',
      body: { name: 'Charlie', email: 'charlie@example.com' },
    })
    expect(user.name).toBe('Charlie')
  })

  it('GET /api/users/:id returns 404 for missing user', async () => {
    const response = await $fetch('/api/users/999', {
      ignoreResponseError: true,
    })
    expect(response.statusCode).toBe(404)
  })
})
```

## 端到端测试

### 使用 Playwright

```bash
pnpm add -D @playwright/test
```

```typescript
// tests/e2e/navigation.test.ts
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'

describe('Navigation', async () => {
  await setup({
    browser: true,  // 启用浏览器
  })

  it('navigates to about page', async () => {
    const page = await createPage('/')

    await page.click('a[href="/about"]')
    await page.waitForURL('/about')

    expect(await page.title()).toContain('关于')
  })

  it('login flow works', async () => {
    const page = await createPage('/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    expect(await page.textContent('h1')).toContain('仪表盘')
  })
})
```

## 测试工具函数

```typescript
// tests/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '~/utils/formatDate'

describe('formatDate', () => {
  it('formats date correctly', () => {
    expect(formatDate('2025-01-01')).toBe('2025年1月1日')
  })

  it('handles invalid date', () => {
    expect(formatDate('invalid')).toBe('')
  })
})
```

## 测试最佳实践

1. **文件组织**：测试文件放在 `tests/` 目录或与源文件同目录的 `*.test.ts`。
2. **使用 `mountSuspended`**：替代 Vue Test Utils 的 `mount`，正确处理 Nuxt 上下文（自动导入、composables 等）。
3. **Mock 外部依赖**：使用 `registerEndpoint` mock API，避免真实网络请求。
4. **环境隔离**：每个测试独立，不依赖其他测试的状态。
5. **关注行为而非实现**：测试用户可见的结果，而非内部实现细节。

## 测试覆盖率

```typescript
// vitest.config.ts
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    },
  },
})
```

```bash
pnpm vitest run --coverage
```
