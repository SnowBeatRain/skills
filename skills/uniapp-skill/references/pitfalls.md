# uni-app 避坑指南

## 1. 静态资源路径

**问题**：图片/文件路径在不同平台表现不一致。

**规则**：
- `static/` 目录下的资源使用绝对路径：`/static/logo.png`
- 动态图片路径**不支持** `require()`（小程序端），应使用网络地址或 base64
- 背景图在小程序中不支持本地路径，必须用网络地址或 base64

```css
/* 错误 —— 小程序不支持本地背景图 */
.bg { background-image: url('/static/bg.png'); }

/* 正确 —— 使用网络地址 */
.bg { background-image: url('https://cdn.example.com/bg.png'); }

/* 或转 base64（仅适合小图标） */
.icon { background-image: url(data:image/png;base64,...); }
```

**最佳实践**：
- 小图标（< 40KB）可用 base64 内联
- 大图使用 CDN 网络地址
- `static/` 下的文件不会被编译压缩，保持原样拷贝

## 2. 样式兼容性

**常见问题**：

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `*` 选择器无效 | 小程序不支持 | 明确写出每个选择器 |
| `body` 选择器无效 | 小程序中页面根节点是 `page` | 使用 `page` 选择器 |
| `scoped` 样式不生效 | 组件中动态创建的 DOM | 使用 `:deep()` 穿透 |
| `position: fixed` 在 scroll-view 内无效 | 各平台限制 | 将 fixed 元素放在 scroll-view 外部 |
| nvue 样式大量不生效 | nvue 仅支持 CSS 子集 | 只用 flex 布局，不用 float/display:block |

```css
/* uni-app 响应式单位 */
/* rpx：750rpx = 屏幕宽度，推荐使用 */
/* px：固定像素，适合边框等不需缩放的场景 */
/* 不推荐用 rem/em/vw/vh（小程序兼容差） */

.container {
  width: 750rpx;        /* 满宽 */
  padding: 20rpx;
  font-size: 28rpx;     /* 约 14px */
  border: 1px solid #eee; /* 边框用 px */
}
```

## 3. 页面与路由

**tabBar 页面跳转**：
```js
// 错误 —— tabBar 页面不能用 navigateTo
uni.navigateTo({ url: '/pages/home/home' })  // 不生效

// 正确 —— 必须用 switchTab
uni.switchTab({ url: '/pages/home/home' })
```

**页面栈限制**：
- `navigateTo` 最多 10 层页面栈
- 超出后跳转无响应，应使用 `redirectTo` 或 `reLaunch`

**首页不能 navigateBack**：
- 首页是栈底，不能返回
- 可监听 `onBackPress` 实现双击退出

## 4. 网络请求

**不要用 axios**：
- axios 基于 XMLHttpRequest，小程序/App 端不支持
- 统一使用 `uni.request`

**请求封装最佳实践**：

```js
// utils/request.js
const BASE_URL = 'https://api.example.com'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('token')}`,
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/login' })
          return reject(new Error('未授权'))
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}
```

## 5. 条件编译常见误区

```js
// 错误 —— #ifdef 不支持 && 语法
// #ifdef MP-WEIXIN && MP-ALIPAY  ← 错误！
// #endif

// 正确 —— 多平台用 ||
// #ifdef MP-WEIXIN || MP-ALIPAY
console.log('微信或支付宝')
// #endif

// 错误 —— #ifndef 不支持 ||
// #ifndef H5 || MP-WEIXIN  ← 不支持！

// 正确 —— 分开写
// #ifndef H5
// 非 H5 的逻辑
// #endif
```

## 6. 生命周期混淆

**组件 vs 页面**：
- 页面可以使用 `onLoad`、`onShow`、`onReady` 等
- 组件**不能**使用页面生命周期，只能使用 Vue 标准钩子（`onMounted` 等）
- 如需在组件中获取页面事件，使用 `uni.$on` / `uni.$emit`

**onLoad vs onShow**：
- `onLoad`：仅触发一次，接收页面参数
- `onShow`：每次页面显示都触发（包括从其他页面返回）
- 初始化数据用 `onLoad`，刷新数据用 `onShow`

## 7. 表单与输入

**小程序端 v-model 注意**：
```vue
<!-- 小程序中 input 的 v-model 可能有延迟 -->
<!-- 推荐使用 @input 事件 -->
<input :value="inputVal" @input="(e) => inputVal = e.detail.value" />
```

**键盘遮挡输入框**：
```vue
<!-- 设置 adjust-position 自动上推页面 -->
<input adjust-position placeholder="输入内容" />

<!-- 或监听键盘高度手动调整 -->
<input @keyboardheightchange="onKeyboard" />
```

## 8. 小程序包体积

**主包限制 2MB，总包限制 20MB**。

优化策略：
- 使用分包 `subPackages`，把非首屏页面放分包
- 图片上 CDN，不放 `static/`
- 使用 `preloadRule` 预加载分包
- 删除无用的 `uni_modules` 插件
- 开启代码压缩（发行模式自动启用）

## 9. nvue 页面特殊限制

nvue 使用原生渲染（Weex 引擎），性能更好但限制更多：

- 只支持 `flex` 布局（默认 `flex-direction: column`）
- 文本必须放在 `<text>` 组件中
- 不支持 `v-show`，只支持 `v-if`
- 不支持 `<slot>` 的默认内容
- 不支持 CSS 动画，使用 `BindingX` 或 `weex.animation`
- 不支持 `position: sticky`
- 单位默认 `px`（非 rpx），需手动用 `uni.upx2px()` 转换

## 10. 跨端兼容通用建议

1. **优先使用 uni API**，避免直接使用 `wx.xxx` / `plus.xxx` / `document.xxx`
2. **不依赖 DOM 操作**：使用数据驱动（Vue 响应式）而非直接操作 DOM
3. **测试覆盖**：至少在微信小程序 + H5 两端测试
4. **ES6+ 语法**：小程序端对部分语法支持有限，避免使用过新的语法特性
5. **第三方库选择**：优先选 uni-app 插件市场的库，npm 库需确认不依赖浏览器/Node API
6. **全局变量**：简单数据用 `globalData`，复杂状态用 Pinia/Vuex，避免挂载到 `Vue.prototype`（Vue3 不支持）

---

## uni-app x 常见问题

### 11. uvue CSS 子集限制

**问题**：从传统 uni-app 迁移到 uni-app x 后，App 端页面布局错乱。

**原因**：uvue 在 App 端**仅支持 flex 布局**，不是完整浏览器 CSS。

```css
/* 错误 —— uvue App 端不支持 */
.container { display: block; }
.sidebar { float: left; width: 200rpx; }
.content { margin-left: 200rpx; }

/* 正确 —— 全部使用 flex */
.container { display: flex; flex-direction: row; }
.sidebar { width: 200rpx; }
.content { flex: 1; }
```

**注意**：
- uvue 默认 `flex-direction: column`（与 Web 默认 `row` 不同）
- Web 端不受此限制，CSS 能力完整
- 选择器支持受限，避免复杂嵌套选择器
- 部分 CSS 动画属性在不同平台表现有差异

### 12. UTS 类型系统差异

**问题**：把 TypeScript 代码直接复制到 UTS 中报类型错误。

**原因**：UTS 是**强类型系统**（接近 Kotlin/Swift），不是 TypeScript 的结构类型系统。

```ts
// 错误 —— UTS 不支持 TS 的部分联合类型用法
let value: string | number = 'hello'  // 部分场景受限

// 错误 —— 隐式 any
function process(data) { }  // UTS 需要显式类型标注

// 正确
function process(data: string): void { }

// 注意 null 处理更严格
let name: string | null = null
// 使用前必须判空
if (name != null) {
  console.log(name.length)
}
```

**最佳实践**：
- 所有函数参数和返回值都标注类型
- 避免使用 `any`，善用泛型
- 4.31+ 版本已增强对象字面量类型推导，减少手动 `as` 断言
- 4.41+ 版本支持 `import type`

### 13. 传统 JS 插件在 uni-app x 中不可用

**问题**：在传统 uni-app 中正常使用的 npm 包或插件市场插件，在 uni-app x 中报错。

**原因**：uni-app x 编译到原生（Kotlin/Swift），JS 插件依赖的 JS 引擎/浏览器 API 不存在。

**解决方案**：

| 方案 | 说明 |
|------|------|
| 查找 UTS 版本 | 插件市场搜索同功能的 UTS 插件 |
| 混编封装 | 用 UTS 调用原生 SDK（kt/swift/ets），4.28+ 支持直接混编 |
| 条件编译 | 非 App 平台继续用 JS 库，App 平台用 UTS 替代 |
| Web 端降级 | 如果只需要 H5/小程序，继续用传统 uni-app |

```ts
// 条件编译示例：不同平台用不同实现
// #ifdef APP-PLUS
import { nativeEncrypt } from '@/uni_modules/uts-crypto'
export const encrypt = nativeEncrypt
// #endif
// #ifndef APP-PLUS
import CryptoJS from 'crypto-js'
export const encrypt = (data: string) => CryptoJS.AES.encrypt(data, key).toString()
// #endif
```
