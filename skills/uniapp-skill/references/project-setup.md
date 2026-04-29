# uni-app 项目搭建详解

## 开发环境搭建

### HBuilderX（推荐，可视化方式）

1. **下载安装**：前往 [HBuilderX 官网](https://www.dcloud.io/hbuilderx.html) 下载 App 开发版（内置相关插件）
2. **安装编译器插件**：首次使用时，HBuilderX 会自动提示安装 uni-app 编译器插件
3. **配置小程序 IDE 路径**：工具 → 设置 → 运行配置 → 设置微信开发者工具路径

### CLI 方式（适合已有 Node.js 环境）

```bash
# Vue3 + Vite（推荐）
npx degit dcloudio/uni-preset-vue#vite my-project
cd my-project && npm install

# Vue3 + Vite + TypeScript
npx degit dcloudio/uni-preset-vue#vite-ts my-project
```

## 创建项目

### HBuilderX 创建

1. 文件 → 新建 → 项目（快捷键 `Ctrl+N`）
2. 选择 uni-app 类型
3. 选择模板（默认模板 / uni-ui 模板 / Hello uni-app 模板）
4. 选择 Vue 版本（推荐 Vue3）
5. 点击创建

### 推荐目录结构

```
├── pages/                    页面目录
│   ├── index/
│   │   └── index.vue         首页
│   ├── login/
│   │   └── login.vue         登录页
│   ├── list/
│   │   └── list.vue          列表页
│   └── detail/
│       └── detail.vue        详情页
├── subpkg/                   分包目录（按需加载）
│   └── user/
│       ├── profile.vue
│       └── settings.vue
├── components/               公共组件
│   └── my-card/
│       └── my-card.vue       easycom 自动引入
├── composables/              组合式函数（Vue3）
│   ├── useAuth.js            登录/鉴权
│   └── useRequest.js         封装网络请求
├── store/                    状态管理
│   ├── index.js
│   └── modules/
│       └── user.js
├── static/                   静态资源（不编译）
│   ├── images/
│   ├── tab/                  tabBar 图标
│   └── app-plus/             App 平台专属资源
├── uni_modules/              插件市场下载的插件
├── utils/                    工具函数
│   ├── request.js            请求封装
│   └── auth.js               Token 管理
├── App.vue                   应用入口（全局生命周期/样式）
├── main.js                   Vue 初始化
├── manifest.json             应用配置
├── pages.json                路由配置
└── uni.scss                  全局 SCSS 变量
```

## 引入 UI 库

### uni-ui（官方推荐，全平台兼容）

```bash
npm install @dcloudio/uni-ui
```

在 `pages.json` 中配置 easycom：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
}
```

配置后直接在模板中使用，无需 import：

```vue
<template>
  <uni-card title="标题">内容</uni-card>
  <uni-list>
    <uni-list-item title="列表项" />
  </uni-list>
</template>
```

### uView（社区流行，功能丰富）

```bash
npm install uview-plus  # Vue3 版本
```

### 通过 uni_modules 安装

在 HBuilderX 中：工具 → 插件安装 → 前往插件市场，搜索并导入到项目。

## main.js 入口配置

### Vue3 标准写法

```js
import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  return { app }
}
```

### App.vue 基本配置

```vue
<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch((options) => {
  console.log('App Launch', options)
  // 检查登录状态
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' })
  }
})
</script>

<style>
/* 全局样式（不加 scoped） */
page {
  background-color: #f5f5f5;
  font-size: 28rpx;
  color: #333;
}
</style>
```

> 注意：App.vue 没有 `<template>` 模板部分，它不是一个页面，只是全局入口。

## uni.scss 全局变量

```scss
/* uni.scss —— 无需 import，全局可用 */
$uni-primary: #007AFF;
$uni-success: #4CD964;
$uni-warning: #F0AD4E;
$uni-error: #DD524D;
$uni-text-color: #333333;
$uni-border-color: #E5E5E5;
$uni-bg-color: #F8F8F8;
$uni-font-size-base: 28rpx;
$uni-spacing-row-base: 20rpx;
```
