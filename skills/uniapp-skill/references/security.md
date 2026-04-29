# 前端安全实践

## 安全清单总览

```
Token 安全
├── 短时效 access token + refresh token
├── 加密存储（AES 封装 uni.setStorageSync）
├── 登出时清除所有敏感数据
└── H5 端配合 CSP

接口安全
├── HTTPS 强制（manifest.json 配置）
├── 请求签名（timestamp + nonce + HMAC）
├── 后端校验时间窗口 + nonce 去重
└── 敏感操作二次验证

XSS 防护
├── 禁止直接 v-html / rich-text 渲染不可信数据
├── 富文本白名单净化（DOMPurify）
├── 用户输入 HTML 实体转义
└── H5 端 CSP 头

其他
├── 敏感数据不写入日志
├── 小程序端检查合法域名配置
├── UGC 内容走 uni-sec-check 安全检测
└── 定期更新依赖，修复已知漏洞
```

---

## Token 安全存储

### 风险分析

| 平台 | 存储位置 | 风险等级 | 说明 |
|------|---------|---------|------|
| H5 | localStorage / sessionStorage | **高** | XSS 可直接通过 JS 读取 |
| App | uni.setStorageSync（本地沙箱） | 中 | Root/越狱设备可能被读取 |
| 小程序 | uni.setStorageSync（宿主沙箱） | 低 | 沙箱隔离较好 |

### 加密存储封装

```js
// utils/secure-storage.js
import CryptoJS from 'crypto-js'

// 密钥建议从环境变量注入，不要硬编码在源码中
const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY || 'fallback-key-for-dev'

export function setSecure(key, value) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(value),
    SECRET_KEY
  ).toString()
  uni.setStorageSync(key, encrypted)
}

export function getSecure(key) {
  const encrypted = uni.getStorageSync(key)
  if (!encrypted) return null
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch {
    uni.removeStorageSync(key)  // 解密失败则清除
    return null
  }
}

export function removeSecure(key) {
  uni.removeStorageSync(key)
}

// 清除所有敏感数据
export function clearAllSecure() {
  const keys = ['token', 'refreshToken', 'userInfo']
  keys.forEach(key => uni.removeStorageSync(key))
}
```

### Token 刷新机制

```js
// utils/auth.js
import { getSecure, setSecure, clearAllSecure } from './secure-storage'

let refreshPromise = null  // 防止并发刷新

export async function refreshToken() {
  if (refreshPromise) return refreshPromise  // 复用正在进行的刷新

  refreshPromise = new Promise(async (resolve, reject) => {
    const refreshToken = getSecure('refreshToken')
    if (!refreshToken) {
      reject(new Error('no refresh token'))
      return
    }

    const [err, res] = await uni.request({
      url: '/api/auth/refresh',
      method: 'POST',
      data: { refreshToken }
    })

    if (!err && res.data?.code === 0) {
      setSecure('token', res.data.data.accessToken)
      setSecure('refreshToken', res.data.data.refreshToken)
      resolve(res.data.data.accessToken)
    } else {
      clearAllSecure()
      uni.reLaunch({ url: '/pages/login/login' })
      reject(new Error('refresh failed'))
    }
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}
```

### 在请求拦截器中自动刷新

```js
// App.vue onLaunch 中
uni.addInterceptor('request', {
  invoke(args) {
    const token = getSecure('token')
    if (token) {
      args.header = { ...args.header, Authorization: `Bearer ${token}` }
    }
  },
  async success(res) {
    if (res.data?.code === 401) {
      try {
        const newToken = await refreshToken()
        // 可选：重试原请求（需要自行封装）
      } catch {
        // 刷新失败，已在 refreshToken 中处理跳转
      }
    }
  }
})
```

---

## 接口签名

接口签名防止请求被伪造、篡改或重放。

### 签名工具

```js
// utils/api-sign.js
import CryptoJS from 'crypto-js'

const APP_SECRET = import.meta.env.VITE_API_SECRET

export function signRequest(params = {}, method = 'GET') {
  const timestamp = Date.now().toString()
  const nonce = Math.random().toString(36).substring(2, 15)

  // 1. 参数排序拼接
  const sortedKeys = Object.keys(params).sort()
  const paramStr = sortedKeys
    .map(k => `${k}=${params[k]}`)
    .join('&')

  // 2. 拼接签名原文
  const signStr = `${method.toUpperCase()}&${paramStr}&timestamp=${timestamp}&nonce=${nonce}`

  // 3. HMAC-SHA256 签名
  const signature = CryptoJS.HmacSHA256(signStr, APP_SECRET).toString()

  return { timestamp, nonce, signature }
}
```

### 在拦截器中使用

```js
uni.addInterceptor('request', {
  invoke(args) {
    const token = getSecure('token')
    const { timestamp, nonce, signature } = signRequest(args.data || {}, args.method || 'GET')

    args.header = {
      ...args.header,
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    }
  }
})
```

### 后端校验要点

| 校验项 | 规则 |
|--------|------|
| 时间戳 | `|服务器时间 - 请求时间戳| < 5 分钟`，超时拒绝 |
| Nonce | Redis 缓存已用 nonce（5 分钟 TTL），重复则拒绝 |
| 签名 | 用相同算法重新计算，与请求签名比对 |

---

## XSS 防护

### 场景一：富文本渲染

```vue
<!-- 危险：直接渲染用户输入 -->
<rich-text :nodes="userContent"></rich-text>

<!-- 安全：白名单净化后渲染 -->
<rich-text :nodes="sanitizedContent"></rich-text>
```

```js
// 使用 DOMPurify（需 npm install dompurify）
import DOMPurify from 'dompurify'

const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(userContent.value, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'br', 'img', 'span', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['src', 'alt', 'style', 'href', 'class']
  })
})
```

**注意**：DOMPurify 依赖 DOM API，在小程序端不可用。小程序端应在服务端完成净化。

### 场景二：HTML 实体转义

```js
// utils/escape.js
export function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

### 场景三：URL 参数注入

```js
// 页面接收参数时做校验
onLoad((options) => {
  // 危险：直接使用
  const id = options.id

  // 安全：校验格式
  if (!/^\d+$/.test(options.id)) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    uni.navigateBack()
    return
  }
  const id = parseInt(options.id)
})
```

### 场景四：H5 CSP 配置

```html
<!-- template.h5.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.example.com;">
```

---

## UGC 内容安全检测

使用 DCloud 官方的 **uni-sec-check** 模块检测文本和图片安全：

```js
// 云函数中调用
const { textSecCheck, imgSecCheck } = require('uni-sec-check')

// 文本安全检测
const textResult = await textSecCheck({
  content: '用户发布的文本内容',
  scene: 2  // 1:资料 2:评论 3:论坛 4:社交日志
})

if (!textResult.pass) {
  return { code: -1, message: '内容包含违规信息' }
}

// 图片安全检测
const imgResult = await imgSecCheck({
  image: 'https://example.com/user-upload.jpg'
})
```

---

## HTTPS 强制

### manifest.json 配置

```json
{
  "h5": {
    "devServer": {
      "https": true
    }
  }
}
```

### 请求拦截器强制 HTTPS

```js
uni.addInterceptor('request', {
  invoke(args) {
    // 生产环境强制 HTTPS
    if (process.env.NODE_ENV === 'production' && args.url.startsWith('http://')) {
      args.url = args.url.replace('http://', 'https://')
    }
  }
})
```

### 小程序合法域名

微信小程序管理后台 → 开发管理 → 服务器域名，必须配置：
- `request 合法域名`：API 服务器地址
- `uploadFile 合法域名`：上传服务器地址
- `downloadFile 合法域名`：下载/CDN 地址
- 所有域名必须为 HTTPS

---

## 敏感数据保护

### 日志脱敏

```js
// 请求日志中隐藏敏感字段
function sanitizeLog(data) {
  if (!data) return data
  const sensitive = ['token', 'password', 'secret', 'phone', 'idCard']
  const result = { ...data }
  for (const key of sensitive) {
    if (result[key]) result[key] = '***'
  }
  return result
}

// 开发环境日志
if (process.env.NODE_ENV === 'development') {
  console.log('Request:', sanitizeLog(requestData))
}
```

### 防止截屏/录屏（App 端）

```js
// #ifdef APP-PLUS
// Android 防截屏
plus.navigator.setSecure(true)
// #endif
```

---

## 平台特定安全注意事项

| 平台 | 注意事项 |
|------|---------|
| H5 | CSP 头防 XSS；HttpOnly cookie 存 token（如果后端支持）；CORS 严格配置 |
| 微信小程序 | 合法域名必须 HTTPS；code→token 在服务端完成，不要在客户端放 appSecret |
| App | androidPrivacy.json 合规；APK 加固防反编译；敏感数据加密存储 |
| 通用 | 不信任客户端数据，服务端必须二次校验；密钥通过环境变量注入，不硬编码 |
