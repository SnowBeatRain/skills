# 条件编译（Conditional Compilation）

官方文档：https://uniapp.dcloud.net.cn/tutorial/platform.html

## 平台标识符

| 标识符 | 说明 |
|--------|------|
| `APP-PLUS` | App（iOS + Android） |
| `APP-PLUS-NVUE` | App nvue 页面 |
| `APP-ANDROID` | Android（HBuilderX 3.4.1+） |
| `APP-IOS` | iOS（HBuilderX 3.4.1+） |
| `H5` | H5/Web |
| `MP-WEIXIN` | 微信小程序 |
| `MP-ALIPAY` | 支付宝小程序 |
| `MP-BAIDU` | 百度小程序 |
| `MP-TOUTIAO` | 抖音/字节小程序 |
| `MP-QQ` | QQ 小程序 |
| `MP-KUAISHOU` | 快手小程序 |
| `MP-LARK` | 飞书小程序 |
| `MP` | 所有小程序 |
| `APP-HARMONY` | 鸿蒙 App（HarmonyOS Next） |
| `MP-HARMONY` | 鸿蒙元服务（HBuilderX 4.34+） |
| `QUICKAPP-WEBVIEW` | 快应用通用 |

**关键规则：** `APP` 包含 Android + iOS + **鸿蒙**；`APP-PLUS` **不包含**鸿蒙（仅 Android + iOS）。

## 语法格式

### JS / TS 中

```js
// #ifdef MP-WEIXIN
// 仅微信小程序编译此代码
wx.login({ success: res => {} })
// #endif

// #ifndef H5
// 非 H5 平台编译
uni.scanCode({ success: res => console.log(res.result) })
// #endif

// #ifdef APP-PLUS || H5
// App 或 H5（多平台用 || 分隔）
console.log('App 或 H5 专属逻辑')
// #endif
```

### Vue Template 中

```html
<!-- #ifdef MP-WEIXIN -->
<official-account />
<!-- #endif -->

<!-- #ifndef APP-PLUS -->
<view class="web-style">H5 和小程序的布局</view>
<!-- #endif -->
```

### CSS / SCSS / Less 中

```css
/* #ifdef APP-PLUS */
.container {
  padding-bottom: 20px;  /* 适配 iOS 底部安全区 */
}
/* #endif */

/* #ifdef H5 */
.nav-bar { display: none; }  /* H5 隐藏自定义导航栏 */
/* #endif */
```

### pages.json 中

```json
{
  "pages": [
    // #ifdef MP-WEIXIN
    { "path": "pages/weixin-only/index" },
    // #endif
    { "path": "pages/index/index" }
  ]
}
```

## 鸿蒙平台条件编译

```js
// #ifdef APP-HARMONY
console.log("仅鸿蒙 App 编译此代码");
// #endif

// #ifdef MP-HARMONY
console.log("仅鸿蒙元服务编译此代码");
// #endif

// #ifdef APP
console.log("安卓、苹果、鸿蒙都会编译（APP 包含鸿蒙）");
// #endif

// #ifdef APP-PLUS
console.log("仅安卓和苹果编译（APP-PLUS 不包含鸿蒙）");
// #endif
```

### 鸿蒙静态资源目录

```
static/
├── app-harmony/        仅鸿蒙 App 编译
│   └── icon.png
├── mp-harmony/         仅鸿蒙元服务编译
│   └── icon.png
└── icon.png            所有平台
```

## 静态资源条件编译

```
static/
├── app-plus/        仅 App 编译
│   └── icon.png
├── mp-weixin/       仅微信小程序编译
│   └── icon.png
├── h5/              仅 H5 编译
│   └── icon.png
└── icon.png         所有平台（目录名小写，与平台标识符一致）
```

## 常见使用场景

### 1. 自定义导航栏适配

```js
// 获取导航栏高度（App + 各小程序通用方案）
const getNavBarInfo = () => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight

  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
  const navBarHeight = menuButtonInfo.bottom + menuButtonInfo.top - statusBarHeight
  return { statusBarHeight, navBarHeight }
  // #endif

  // #ifndef MP-WEIXIN
  return { statusBarHeight, navBarHeight: 44 }
  // #endif
}
```

### 2. 平台差异化 API

```js
const shareToFriend = () => {
  // #ifdef APP-PLUS
  plus.share.sendWithSystem({ type: 'text', content: '分享内容' })
  // #endif

  // #ifdef MP-WEIXIN
  wx.updateShareMenu({ withShareTicket: true })
  // #endif

  // #ifdef H5
  navigator.share({ title: '分享', text: '内容', url: location.href })
  // #endif
}
```

### 3. 条件导入

```js
// #ifdef APP-PLUS
import { nativePlugin } from '@/native/plugin'
// #endif

// #ifdef H5
import { webPlugin } from '@/web/plugin'
// #endif
```

### 4. 安全区适配

```css
/* 底部安全区（iPhone X 等全面屏） */
.footer {
  padding-bottom: 0;
  /* #ifdef APP-PLUS || H5 */
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  /* #endif */
}
```

## HBuilderX 快捷操作

- 输入 `ifdef` 快速生成条件编译代码块
- `Ctrl + Alt + /`（Windows）生成正确注释格式
- 点击 `#ifdef` 或 `#endif` 高亮选中整个代码块
