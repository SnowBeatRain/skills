# 测试方案

## 测试策略概览

uni-app 项目推荐分层测试：

| 测试类型 | 工具 | 适用场景 |
|---------|------|---------|
| **单元测试** | Vitest | 纯函数、composable、store、工具方法 |
| **组件测试** | Vitest + @vue/test-utils | Vue 组件逻辑（不含 uni-app API 调用） |
| **E2E 自动化测试** | uni-automator + Jest | 多平台真机/模拟器自动化 |

---

## Vitest 单元测试

Vitest 是 Vite 原生测试框架，与 uni-app Vue3 + Vite 项目天然集成。

### 安装配置

```bash
npm install -D vitest @vue/test-utils happy-dom
```

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  test: {
    environment: 'happy-dom',
    globals: true,
    // 排除 uni-app 编译产物
    exclude: ['**/dist/**', '**/unpackage/**', '**/node_modules/**'],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['composables/**', 'store/**', 'utils/**']
    }
  }
})
```

### Mock uni-app API

uni-app 的全局 API（`uni.request`、`uni.getStorageSync` 等）在测试环境中不可用，需要 Mock：

```js
// tests/setup.js（在 vitest.config.js 的 setupFiles 中引入）
import { vi } from 'vitest'

// Mock uni 全局对象
const uni = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  request: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    platform: 'devtools',
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20
  })),
  $emit: vi.fn(),
  $on: vi.fn(),
  $off: vi.fn()
}

vi.stubGlobal('uni', uni)
```

```js
// vitest.config.js 中添加
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.js']
  }
})
```

### 测试工具函数

```js
// utils/format.js
export function formatPrice(price) {
  return (price / 100).toFixed(2)
}

export function formatDate(timestamp) {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

```js
// tests/utils/format.test.js
import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate } from '@/utils/format'

describe('formatPrice', () => {
  it('converts cents to yuan', () => {
    expect(formatPrice(1999)).toBe('19.99')
    expect(formatPrice(100)).toBe('1.00')
    expect(formatPrice(0)).toBe('0.00')
  })
})

describe('formatDate', () => {
  it('formats timestamp to YYYY-MM-DD', () => {
    expect(formatDate(1704067200000)).toBe('2024-01-01')
  })
})
```

### 测试 Composable

```js
// composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => { count.value = initial }
  return { count, doubled, increment, decrement, reset }
}
```

```js
// tests/composables/useCounter.test.js
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('initializes with custom value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })

  it('increments and decrements', () => {
    const { count, increment, decrement } = useCounter(0)
    increment()
    expect(count.value).toBe(1)
    decrement()
    expect(count.value).toBe(0)
  })

  it('computes doubled', () => {
    const { count, doubled, increment } = useCounter(5)
    expect(doubled.value).toBe(10)
    increment()
    expect(doubled.value).toBe(12)
  })

  it('resets to initial value', () => {
    const { count, increment, reset } = useCounter(3)
    increment()
    increment()
    expect(count.value).toBe(5)
    reset()
    expect(count.value).toBe(3)
  })
})
```

### 测试 Pinia Store

```js
// tests/store/user.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/user'

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 清空 storage mock
    uni.getStorageSync.mockReturnValue('')
  })

  it('starts logged out', () => {
    const store = useUserStore()
    expect(store.isLogin).toBe(false)
    expect(store.token).toBe('')
  })

  it('sets login data', () => {
    const store = useUserStore()
    store.setLogin('test-token', { name: 'Alice' })

    expect(store.token).toBe('test-token')
    expect(store.userInfo.name).toBe('Alice')
    expect(store.isLogin).toBe(true)
    expect(uni.setStorageSync).toHaveBeenCalledWith('token', 'test-token')
  })

  it('clears data on logout', () => {
    const store = useUserStore()
    store.setLogin('test-token', { name: 'Alice' })
    store.logout()

    expect(store.token).toBe('')
    expect(store.isLogin).toBe(false)
    expect(uni.removeStorageSync).toHaveBeenCalledWith('token')
    expect(uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/login/login' })
  })
})
```

### 测试含 uni API 调用的函数

```js
// utils/request.js
export async function fetchList(page = 1) {
  const [err, res] = await uni.request({
    url: '/api/list',
    data: { page }
  })
  if (err) throw new Error('请求失败')
  return res.data
}
```

```js
// tests/utils/request.test.js
import { describe, it, expect, vi } from 'vitest'
import { fetchList } from '@/utils/request'

describe('fetchList', () => {
  it('returns data on success', async () => {
    const mockData = { list: [1, 2, 3], total: 3 }
    uni.request.mockResolvedValue([null, { data: mockData }])

    const result = await fetchList(1)
    expect(result).toEqual(mockData)
    expect(uni.request).toHaveBeenCalledWith({
      url: '/api/list',
      data: { page: 1 }
    })
  })

  it('throws on error', async () => {
    uni.request.mockResolvedValue([new Error('网络错误'), null])

    await expect(fetchList()).rejects.toThrow('请求失败')
  })
})
```

---

## uni-automator E2E 测试

uni-automator 是 DCloud 官方的自动化测试方案，支持 App、H5、微信小程序平台。

### 安装

通过 HBuilderX 插件市场安装 **uni-automator** 插件，或 CLI 方式：

```bash
npm install -D @dcloudio/uni-automator @dcloudio/uni-cli-shared
```

### 测试文件结构

```
项目根目录/
├── pages/
│   └── index/
│       ├── index.vue
│       └── index.test.js     # 与页面同目录（推荐）
└── jest.config.js
```

### 编写 E2E 测试

```js
// pages/index/index.test.js
describe('首页', () => {
  let page

  beforeAll(async () => {
    // 跳转到首页
    page = await program.reLaunch('/pages/index/index')
    await page.waitFor(500)
  })

  it('页面标题正确', async () => {
    const title = await page.callMethod('getTitle')
    expect(title).toBe('首页')
  })

  it('列表渲染正确', async () => {
    const items = await page.$$('.list-item')
    expect(items.length).toBeGreaterThan(0)
  })

  it('点击跳转到详情页', async () => {
    const firstItem = await page.$('.list-item')
    await firstItem.tap()
    await page.waitFor(300)

    const currentPage = await program.currentPage()
    expect(currentPage.path).toContain('pages/detail/detail')
  })

  it('下拉刷新正常工作', async () => {
    page = await program.reLaunch('/pages/index/index')
    await page.waitFor(500)

    await program.callUniMethod('startPullDownRefresh')
    await page.waitFor(1000)

    const items = await page.$$('.list-item')
    expect(items.length).toBeGreaterThan(0)
  })

  it('截图对比', async () => {
    const image = await program.screenshot()
    expect(image).toMatchImageSnapshot()
  })
})
```

### 运行测试

```bash
# 通过 HBuilderX 运行（推荐）
# 菜单 → 运行 → 运行自动化测试

# 通过 CLI 运行
# H5 平台
npx cross-env UNI_PLATFORM=h5 jest --forceExit
# 微信小程序
npx cross-env UNI_PLATFORM=mp-weixin jest --forceExit
```

### uni-automator API 速查

| API | 说明 |
|-----|------|
| `program.reLaunch(url)` | 跳转到指定页面 |
| `program.navigateTo(url)` | 导航到页面 |
| `program.navigateBack()` | 返回上一页 |
| `program.currentPage()` | 获取当前页面信息 |
| `program.screenshot()` | 截图 |
| `program.callUniMethod(method, ...args)` | 调用 uni API |
| `page.$(selector)` | 查找单个元素 |
| `page.$$(selector)` | 查找多个元素 |
| `page.callMethod(method, ...args)` | 调用页面方法 |
| `page.setData(data)` | 设置页面数据 |
| `page.waitFor(condition)` | 等待条件（ms / selector / function） |
| `element.tap()` | 点击元素 |
| `element.input(value)` | 输入文本 |
| `element.attribute(name)` | 获取属性值 |
| `element.text()` | 获取文本内容 |

---

## 测试最佳实践

### 测什么

```
优先测试                       不必测试
─────────                     ─────────
composable 状态逻辑            简单的模板渲染
Pinia store actions/getters   第三方组件（uni-ui）
工具函数（格式化/校验/转换）     框架行为（路由跳转本身）
请求拦截器逻辑                 纯 CSS 样式
条件编译分支逻辑               uni-app 原生 API 本身
```

### package.json 脚本配置

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e:h5": "cross-env UNI_PLATFORM=h5 jest --forceExit",
    "test:e2e:mp-weixin": "cross-env UNI_PLATFORM=mp-weixin jest --forceExit"
  }
}
```

### 目录结构建议

```
项目根目录/
├── tests/
│   ├── setup.js              全局 mock（uni 对象）
│   ├── utils/                工具函数测试
│   ├── composables/          组合函数测试
│   └── store/                Pinia store 测试
├── pages/
│   └── index/
│       └── index.test.js     E2E 测试（与页面同目录）
├── vitest.config.js          Vitest 配置
└── jest.config.js            uni-automator 配置（E2E）
```
