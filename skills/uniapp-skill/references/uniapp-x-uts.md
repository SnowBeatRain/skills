# uni-app x 与 UTS 插件

## uni-app x 概述

uni-app x 是 DCloud 推出的下一代跨平台框架，与传统 uni-app 的核心区别是**全原生渲染 + 强类型语言**：

| 维度 | 传统 uni-app | uni-app x |
|------|-------------|-----------|
| App 渲染 | WebView（vue 页面）/ Weex（nvue 页面） | **原生渲染引擎（uvue）** |
| 编程语言 | JavaScript（弱类型） | **UTS（强类型，类 TypeScript）** |
| Android 编译目标 | JS Bundle → JS 引擎执行 | **UTS → Kotlin 原生应用** |
| iOS 编译目标 | JS Bundle → JavaScriptCore | **UTS → Swift** |
| Web 编译目标 | JS | JS（内置 vue.js） |
| 逻辑-渲染通信 | Bridge 通信（性能瓶颈） | **同层运行，无 Bridge 开销** |
| 启动速度 | 需初始化 JS 引擎 + WebView | **原生启动，更快** |
| 包体积 | 包含 JS 引擎和 WebView 依赖 | **无额外引擎，更小** |
| 页面文件后缀 | `.vue` / `.nvue` | **`.uvue`** |

**官方文档：** https://doc.dcloud.net.cn/uni-app-x/

---

## uvue 页面

uvue 是 uni-app x 的核心渲染方案，兼容 Vue 3 语法但不依赖浏览器 DOM。

### 各平台支持状态

| 平台 | HBuilderX 版本 | 状态 |
|------|---------------|------|
| Android | 3.99+ | 已上线 |
| Web | 4.0+ | 已上线 |
| iOS | 4.11+ | 已上线 |
| 微信小程序 | 4.41+ | 推进中 |
| HarmonyOS | 4.61+ | 已上线（DevEco Studio 5.0.7.210+） |

### uvue 与 vue 的关键差异

```
1. 页面文件后缀为 .uvue，不支持 .vue 和 .uvue 混用
2. Web 端直接内置 vue.js，走标准浏览器渲染
3. 非 Web 端由 DCloud 提供"参考 Vue 规范的兼容实现"，非真正运行 vue.js
4. HBuilderX 4.14 对应 Vue 3.4 语法兼容级别
```

### uvue CSS 限制（App 端）

uvue 在 App 端的 CSS **不是完整浏览器 CSS**，主要限制：

| 维度 | 说明 |
|------|------|
| 布局 | **仅支持 flex 布局**（默认 flex-direction: column） |
| 选择器 | 受限，不支持复杂选择器 |
| 动画 | 部分支持 transition/animation，持续完善中 |
| 单位 | 支持 rpx / px，但部分 CSS 属性在不同平台表现有差异 |

**从传统 uni-app 迁移注意事项：**
- 所有 `display: block` / `inline` 布局需改为 flex
- nvue 的限制在 uvue 中仍然存在（仅 App 端）
- Web 端不受此限制，CSS 能力完整

### uvue 页面示例

```vue
<!-- pages/index/index.uvue -->
<template>
  <view class="container">
    <text class="title">{{ message }}</text>
    <button @click="handleClick">点击</button>
  </view>
</template>

<script setup lang="uts">
  import { ref } from 'vue'

  const message = ref<string>('Hello uni-app x')

  const handleClick = () => {
    message.value = '已点击'
  }
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
}
.title {
  font-size: 36rpx;
  color: #333;
}
</style>
```

---

## UTS 语言

UTS（uni Type Script）是 DCloud 定义的跨平台强类型语言，语法接近 TypeScript，但编译到各平台的原生语言。

### 与 TypeScript 的关键区别

```
1. UTS 是强类型系统（接近 Kotlin/Swift/ArkTS），非 TS 的结构类型系统
2. 变量声明后类型不可变，不支持 TS 的联合类型部分场景
3. 4.31+ 版本对象字面量类型推导增强，很多场景不再需要手动 as 断言
4. 4.41+ 版本支持 import type
5. 4.53+ 新增 IJSONStringify 接口，可自定义 class 的 JSON 序列化
6. 5.0+ JSON.parse 出来的对象第一层属性可直接用 . 访问
```

### UTS 基础语法

```ts
// 变量声明（类型推导或显式标注）
let count = 0                      // 推导为 number
let name: string = 'uni-app x'    // 显式标注

// 函数
function add(a: number, b: number): number {
  return a + b
}

// 类
class User {
  name: string
  age: number

  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }

  greet(): string {
    return `Hello, ${this.name}`
  }
}

// 接口
interface ApiResponse {
  code: number
  data: any
  message: string
}

// 泛型
function fetchData<T>(url: string): Promise<T> {
  // ...
}

// 平台特有类型（条件编译中使用）
// #ifdef APP-ANDROID
import Activity from 'android.app.Activity'
// #endif
```

### UTS 类型系统注意事项

```
- number：在 Kotlin 中编译为 Number（可能是 Int/Long/Double）
- string：在 Kotlin 中编译为 String
- boolean：在 Kotlin 中编译为 Boolean
- any：尽量避免，失去类型安全优势
- null/undefined：UTS 中更严格，需要显式处理可空类型
- 数组：使用 Array<T> 或 T[]，在 Kotlin 中编译为 MutableList<T>
- Map：使用 Map<K, V>，在 Kotlin 中编译为 MutableMap<K, V>
```

---

## UTS 插件开发

UTS 插件是 uni-app x 调用原生能力的标准方式，取代了传统 uni-app 的原生插件机制。

### 插件目录结构

```
uni_modules/
└── my-uts-plugin/
    ├── package.json              插件配置
    ├── index.uts                 跨平台入口
    ├── utssdk/
    │   ├── index.uts             通用逻辑（可选）
    │   ├── app-android/
    │   │   ├── index.uts         Android 入口
    │   │   ├── config.json       Android 配置（权限、依赖等）
    │   │   └── libs/             Android 原生依赖 jar/aar
    │   ├── app-ios/
    │   │   ├── index.uts         iOS 入口
    │   │   ├── config.json       iOS 配置
    │   │   └── Frameworks/       iOS 原生依赖
    │   └── app-harmony/
    │       ├── index.uts         鸿蒙入口
    │       └── config.json       鸿蒙配置
    └── readme.md
```

### Android UTS 插件示例

```ts
// utssdk/app-android/index.uts
import Context from 'android.content.Context'
import Toast from 'android.widget.Toast'

// 导出函数供页面调用
export function showNativeToast(message: string) {
  const context = UTSAndroid.getAppContext() as Context
  Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
}

// 获取设备信息
export function getDeviceModel(): string {
  return android.os.Build.MODEL
}
```

```json
// utssdk/app-android/config.json
{
  "minSdkVersion": 21,
  "dependencies": [
    "androidx.core:core-ktx:1.10.1"
  ],
  "permissions": [
    "android.permission.INTERNET"
  ]
}
```

### iOS UTS 插件示例

```ts
// utssdk/app-ios/index.uts
import UIKit

export function showNativeAlert(title: string, message: string) {
  const rootVC = UTSiOS.getKeyWindow()?.rootViewController
  if (rootVC != null) {
    const alert = new UIAlertController(title: title, message: message, preferredStyle: UIAlertController.Style.alert)
    alert.addAction(new UIAlertAction(title: "OK", style: UIAlertAction.Style.default, handler: null))
    rootVC!.present(alert, animated: true, completion: null)
  }
}
```

### 混编能力（4.28+）

UTS 支持直接混编原生语言文件，无需全量改写为 UTS：

```
utssdk/
├── app-android/
│   ├── index.uts              UTS 入口
│   ├── NativeHelper.kt        Kotlin 文件（直接混编）
│   └── LegacyUtils.java       Java 文件（直接混编）
├── app-ios/
│   ├── index.uts              UTS 入口
│   └── NativeHelper.swift     Swift 文件（直接混编）
└── app-harmony/
    ├── index.uts              UTS 入口
    └── NativeHelper.ets       ArkTS 文件（直接混编）
```

在 UTS 中导入混编文件：

```ts
// utssdk/app-android/index.uts
import { NativeHelper } from './NativeHelper.kt'  // 导入 Kotlin 类
import { doSomething } from './LegacyUtils.java'   // 导入 Java 方法

export function callNative(): string {
  return NativeHelper.getInstance().getData()
}
```

**HBuilderX alpha 版** 已支持在 UTS 文件中对混编的 Kotlin 文件做代码提示和跳转定义。

---

## 鸿蒙平台支持（4.61+）

uni-app x 从 HBuilderX 4.61 起正式支持纯血鸿蒙（HarmonyOS Next）。

**详细鸿蒙开发指南见鸿蒙系列文档**：`references/harmony-basics.md`（基础与快速参考）、`references/harmony-development.md`（核心开发：UTS 插件/原生组件/华为登录/URL Scheme）、`references/harmony-advanced.md`（元服务/调试/发布）、`references/harmony-migration.md`（适配与迁移实战）。

### 鸿蒙平台 UTS 插件要点

**编译目标：** UTS → ArkTS/ETS

**package.json 启用鸿蒙：**

```json
{
  "uni_modules": {
    "uni-ext-api": {
      "uni": {
        "apiName": {
          "name": "apiName",
          "app": { "arkts": true }
        }
      }
    }
  }
}
```

**鸿蒙插件实现** (`utssdk/app-harmony/index.uts`)：

```typescript
import { productViewManager } from '@kit.StoreKit';
import type { common, Want } from '@kit.AbilityKit';

export function myNativeAPI(options: MyOptions) {
    const context = UTSHarmony.getUIAbilityContext();
    // 使用鸿蒙原生 Kit
}
```

**使用鸿蒙 ohpm 第三方库：**

```typescript
// 在 utssdk/app-harmony/ 目录下可直接 import ohpm 包
import { Pay } from '@cashier_alipay/cashiersdk'
```

**注意：** 不能在项目页面中直接使用 ohpm 包，必须通过 UTS 插件中转。UTS 插件导入必须至少 import 一次（在任意页面），否则插件代码会被 tree-shaking 移除。

**调试注意：** 变量在调试时显示为 ets/ArkTS 风格；console.log 输出对象需用 `JSON.stringify()`。

### 环境要求

| 依赖 | 版本要求 |
|------|---------|
| HBuilderX | 4.61+ |
| DevEco Studio | 5.0.7.210+ |
| 鸿蒙 API 版本 | API 14+ |

### 鸿蒙特有功能

```ts
// 条件编译鸿蒙平台
// #ifdef APP-HARMONY
import { AbilityConstant } from '@kit.AbilityKit'

export function getHarmonyInfo(): string {
  // 鸿蒙特有 API
  return 'HarmonyOS'
}
// #endif
```

### 5.03 版本新增

- **蒸汽模式**：鸿蒙平台性能优化
- CSS 样式隔离策略 2.0
- `external-class` 规范支持

---

## 选型建议

### 选传统 uni-app 的场景

- 项目主要面向**小程序 + H5**，App 不是核心
- 依赖大量现有 JS 插件和组件库
- 团队 JS/Vue 经验丰富，不想学 UTS
- 存量项目维护，迁移成本高

### 选 uni-app x 的场景

- **App 性能是核心诉求**（尤其 Android）
- 新项目，不存在历史包袱
- 愿意接受 UTS 强类型和 CSS 子集的限制
- 目标是做出接近原生体验的跨平台应用
- 需要鸿蒙 HarmonyOS Next 支持

### 注意事项

```
- 传统 uni-app 的 JS 插件不能直接用于 uni-app x，需要用 UTS 重写
- 主流 UI 库（uView、ThorUI 等）大多还是为传统 uni-app 设计
- 传统 uni-app 短期内不会被废弃，但官方重心已向 uni-app x 倾斜
- 2026 年随着小程序和鸿蒙支持完善，uni-app x 跨端覆盖面将进一步扩大
```

---

## 版本兼容矩阵

### HBuilderX 版本与功能对应

| HBuilderX 版本 | 关键功能 | 发布时间 |
|----------------|---------|---------|
| 3.99 | uni-app x Android 首发 | 2024 |
| 4.0 | Web 平台支持 | 2024 |
| 4.11 | iOS 平台支持 | 2024 |
| 4.14 | Vue 3.4 语法兼容 | 2024 |
| 4.28 | UTS 混编（kt/java/swift） | 2025 初 |
| 4.31 | 对象字面量类型推导增强 | 2025 |
| 4.41 | import type 支持、微信小程序推进 | 2025 |
| 4.53 | IJSONStringify 接口 | 2025 |
| 4.61 | **鸿蒙 HarmonyOS Next 正式支持** | 2025 |
| 4.64 | 鸿蒙编译正式发布 | 2025 |
| 4.84 | uni.createWorker（Worker 线程） | 2025-11 |
| 4.87 | 本地打包原生 Android 资源、iOS UTS 断点调试 | 2025-12 |
| 5.0+ | JSON.parse 属性直接 `.` 访问 | 2026 初 |
| 5.03 | 鸿蒙蒸汽模式、CSS 隔离 2.0、iOS SPM 依赖 | 2026-03 |
| 5.05 | 当前最新正式版 | 2026-03-24 |

### Node.js / Vite 版本要求

| 项目类型 | Node.js | Vite | Vue |
|---------|---------|------|-----|
| uni-app Vue3 | 18+ | 4.x / 5.x | 3.4+ |
| uni-app Vue2 | 14+ | 不适用（webpack） | 2.6/2.7 |
| uni-app x | 18+ | 5.x | 3.4+（兼容层） |

---

## 迁移指南（传统 uni-app → uni-app x）

### 步骤概览

1. **文件后缀**：`.vue` → `.uvue`（全量替换）
2. **语言切换**：`<script setup>` → `<script setup lang="uts">`
3. **类型标注**：为所有变量、函数参数、返回值添加类型
4. **CSS 改造**：所有布局改为 flex，移除不支持的 CSS 属性（App 端）
5. **插件替换**：JS 原生插件 → UTS 插件
6. **API 兼容**：大部分 `uni.*` API 保持不变，少数有差异需查文档
7. **测试验证**：逐平台测试（Android → iOS → Web → 小程序）

### 常见迁移问题

| 问题 | 解决方案 |
|------|---------|
| JS 插件不可用 | 查找 UTS 版本或用混编方式封装 |
| CSS 布局错乱 | 全部改为 flex 布局 |
| 类型错误大量报错 | 逐步添加类型标注，善用 `as` 断言过渡 |
| 第三方 npm 包不兼容 | 检查是否依赖浏览器 API，改用平台原生方案 |
