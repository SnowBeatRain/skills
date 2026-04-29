---
name: uniapp-skill
description: 将此技能应用于所有uni-app（uniapp）开发任务。每当用户提及uni-app、uniapp、uni-app x、uvue、UTS、HBuilderX、DCloud、跨端开发、小程序、多端、pages.json、manifest.json、uni.request、uni.navigateTo、easycom、nvue、uts，或请求构建/调试/配置/测试以uni-app为目标的微信小程序、H5、App、支付宝、字节跳动、QQ、HarmonyOS或其他平台的项目时，均可触发。同样适用于关于条件编译（#ifdef）、uniCloud、uni-ui组件、uniapp中的pinia、uniapp项目结构、uni-automator、uniapp中的vitest、uniapp CI/CD、uniapp安全或UTS插件开发的问题。当用户提及鸿蒙、HarmonyOS、Harmony、arkts、ets、鸿蒙元服务，或询问如何使用uni-app开发HarmonyOS应用或元服务时，亦可触发。如有不确定，优先使用此技能——拥有上下文总比没有好。
---

# uni-app 完整开发技能指南

uni-app 是使用 Vue.js 开发所有前端应用的框架，一套代码发布到 iOS、Android、Web（H5）及各种小程序（微信/支付宝/百度/抖音/QQ/快手/飞书等）和鸿蒙。

**官方文档：** https://uniapp.dcloud.net.cn/

---

## 第一部分：学习路径规划

### 阶段一：环境与基础（1-2 天）

- 安装 HBuilderX（App 开发版），或 CLI（`npx degit dcloudio/uni-preset-vue#vite my-project`，需 Node 18+）
- 创建项目，运行到浏览器
- 重点学习：项目结构、`pages.json`、`manifest.json`
- 参考：`references/project-setup.md`、`references/pages-config.md`、`references/manifest.md`

### 阶段二：核心概念（3-5 天）

- Vue3 Composition API（`<script setup>`、`ref`、`reactive`、`computed`、`watch`）
- 页面生命周期：`onLoad` → `onShow` → `onReady`
- 路由导航 + 页面传参 + 事件通信（`uni.$emit/$on`）
- 条件编译：`#ifdef` / `#ifndef`
- 参考：`references/lifecycle.md`、`references/conditional-compilation.md`、`references/vue3-patterns.md`

### 阶段三：项目实战（5-10 天）

- 完整功能应用：登录、列表（CRUD）、详情、个人中心
- Pinia 状态管理 + 持久化
- 网络请求封装（`uni.request` + 拦截器）
- easycom + uni-ui 组件化开发
- H5 + 微信小程序双端调试
- 参考：`references/api.md`、`references/components.md`、`references/more-components.md`

### 阶段四：进阶能力（按需）

- App 原生：OAuth、支付、推送、分享 → `references/app-native.md`
- **Native.js**：直接调用 Android/iOS 原生 API → `references/native-js.md`
- 云服务：uniCloud、UniPush、uni 统计、一键登录 → `references/cloud-services.md`
- 高级渲染：nvue、RenderJS（深入）、WXS、subNVue → `references/advanced-features.md`、`references/wxs.md`、`references/subnvue.md`
- **web-view 双向通信**：evalJS/postMessage/动态创建 webview → `references/webview.md`
- 媒体 API：图片/视频/音频/录音/文件 → `references/media-file-api.md`
- 系统 API：蓝牙/传感器/动画/TabBar/键盘 → `references/system-device-api.md`
- 原生配置：Android/iOS/鸿蒙权限与资源 → `references/native-resources.md`
- 性能优化、国际化（深入）、无障碍访问、暗黑模式、TypeScript → `references/advanced-features.md`
- **uni-app x / UTS 插件**：原生渲染、强类型开发、鸿蒙支持 → `references/uniapp-x-uts.md`
- **pages.json 宽屏适配**：leftWindow/topWindow/rightWindow → `references/pages-config.md`
- **Vue 3.4+ 新特性**：defineModel、useTemplateRef、defineOptions → `references/vue3-patterns.md`
- **鸿蒙开发专题**：HarmonyOS App / 元服务开发全流程 → `references/harmony-basics.md`（基础）、`references/harmony-development.md`（核心开发）、`references/harmony-advanced.md`（进阶与发布）、`references/harmony-migration.md`（适配与迁移）
- **manifest.json 配置**：全字段参考与平台配置 → `references/manifest.md`
- **测试方案**：Vitest 单元测试 + uni-automator E2E → `references/testing.md`
- **安全实践**：Token 存储、接口签名、XSS 防护 → `references/security.md`
- **CI/CD 与 Vite 配置**：GitHub Actions、环境变量、构建优化 → `references/cicd.md`
- **富文本编辑器**：editor 组件全套 API → `references/editor.md`
- **共享元素过渡**：share-element → `references/share-element.md`
- **Datacom 数据驱动组件**：unicloud-db、uni-data-select → `references/datacom.md`

---

## 第二部分：项目搭建

详见 `references/project-setup.md`。

### 项目结构

```
├─ pages/                  页面（必须在 pages.json 注册）
├─ static/                 静态资源（不编译，原样拷贝）
│  └─ app-plus/            App 专属资源（条件编译目录）
├─ components/             组件（easycom: comp-name/comp-name.vue 自动引入）
├─ composables/            组合式函数
├─ store/                  Pinia 状态管理
├─ utils/                  工具函数
├─ uni_modules/            插件市场插件（UTS 插件含 utssdk/app-harmony/ 可支持鸿蒙）
├─ nativeResources/        原生资源（Android/iOS 配置）
├─ harmony-configs/        鸿蒙 App 配置（首次运行到鸿蒙自动生成）
├─ harmony-mp-configs/     鸿蒙元服务配置
├─ App.vue                 应用入口（全局生命周期/样式，无 template）
├─ main.js                 Vue 初始化（createSSRApp + Pinia）
├─ manifest.json           应用配置（appid、各平台设置）（详见 `references/manifest.md`）
├─ pages.json              路由（页面注册、tabBar、globalStyle、easycom）
└─ uni.scss                全局 SCSS 变量（自动注入，无需 import）
```

### pages.json 核心配置

```json
{
  "globalStyle": {
    "navigationBarTitleText": "App",
    "navigationBarBackgroundColor": "#007AFF",
    "navigationBarTextStyle": "white"
  },
  "pages": [
    {
      "path": "pages/index/index",
      "style": { "navigationBarTitleText": "首页" }
    }
  ],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#007AFF",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/tab/home.png",
        "selectedIconPath": "static/tab/home-active.png"
      }
    ]
  },
  "subPackages": [{ "root": "subpkg", "pages": [{ "path": "detail/detail" }] }],
  "preloadRule": {
    "pages/index/index": { "network": "all", "packages": ["subpkg"] }
  },
  "easycom": {
    "autoscan": true,
    "custom": { "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue" }
  }
}
```

详细字段见 `references/pages-config.md`。

---

## 第三部分：核心功能实现

### 3.1 生命周期（`references/lifecycle.md`）

```vue
<script setup>
import {
  onLoad,
  onShow,
  onReady,
  onPullDownRefresh,
  onReachBottom,
  onShareAppMessage,
  onBackPress,
} from "@dcloudio/uni-app";
import { ref, onMounted } from "vue";

// 页面生命周期
onLoad((options) => {
  /* 接收参数，仅一次 */
});
onShow(() => {
  /* 每次显示（含返回） */
});
onReady(() => {
  /* DOM 可用 */
});
onPullDownRefresh(async () => {
  await refresh();
  uni.stopPullDownRefresh();
});
onReachBottom(() => {
  /* 触底加载 */
});
onShareAppMessage(() => ({ title: "分享", path: "/pages/index/index" }));
onBackPress(({ from }) => {
  return false; /* true 阻止返回 */
});

// 注意：组件中只能用 Vue 钩子（onMounted 等），不能用 onLoad/onShow
</script>
```

**App.vue**：`onLaunch`（全局初始化）→ `onShow`（前台）→ `onHide`（后台）→ `onError`（全局错误）

**顺序**：`onLoad` → `onShow` → `onReady` | 返回：B `onUnload` → A `onShow`

### 3.2 路由导航与页面通信

```js
uni.navigateTo({ url: "/pages/detail/detail?id=1" }); // 新页面（最多10层）
uni.redirectTo({ url: "/pages/login/login" }); // 替换当前
uni.switchTab({ url: "/pages/home/home" }); // tabBar 页必须用此方法
uni.reLaunch({ url: "/pages/index/index" }); // 关闭所有重开
uni.navigateBack({ delta: 1 });

// EventChannel 页面通信
uni.navigateTo({
  url: "/pages/child/child",
  events: { result: (data) => console.log(data) },
  success: (res) => res.eventChannel.emit("init", { msg: "hi" }),
});

// 全局事件
uni.$emit("refresh", data);
uni.$on("refresh", handler);
uni.$off("refresh", handler); // 页面卸载时务必移除
```

### 3.3 状态管理 Pinia

```js
// store/user.js — 手动持久化方式
import { defineStore } from "pinia";
export const useUserStore = defineStore("user", {
  state: () => ({
    token: uni.getStorageSync("token") || "",
    userInfo: uni.getStorageSync("userInfo") || {},
  }),
  getters: { isLogin: (s) => !!s.token },
  actions: {
    setLogin(token, info) {
      this.token = token;
      this.userInfo = info;
      uni.setStorageSync("token", token);
      uni.setStorageSync("userInfo", info);
    },
    logout() {
      this.token = "";
      this.userInfo = {};
      uni.removeStorageSync("token");
      uni.removeStorageSync("userInfo");
      uni.reLaunch({ url: "/pages/login/login" });
    },
  },
});
```

```js
// 推荐：使用 pinia-plugin-unistorage 自动持久化
// main.js
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { unistorage } from 'pinia-plugin-unistorage'

export function createApp() {
  const app = createSSRApp(App)
  const store = Pinia.createPinia()
  store.use(unistorage)
  app.use(store)
  return { app, Pinia }
}

// store/user.js — 自动持久化
import { defineStore } from 'pinia'
export const useUserStore = defineStore('user', {
  state: () => ({ token: '', userInfo: null }),
  getters: { isLogin: (s) => !!s.token },
  actions: {
    setLogin(token, info) { this.token = token; this.userInfo = info },
    logout() { this.token = ''; this.userInfo = null; uni.reLaunch({ url: '/pages/login/login' }) }
  },
  unistorage: { paths: ['token', 'userInfo'] }  // 选择性持久化
})
```

### 3.4 网络请求（`references/api.md`）

```js
// 全局拦截器（推荐在 App.vue onLaunch 中设置）
uni.addInterceptor("request", {
  invoke(args) {
    if (!args.url.startsWith("http"))
      args.url = "https://api.example.com" + args.url;
    args.header = {
      ...args.header,
      Authorization: `Bearer ${uni.getStorageSync("token")}`,
    };
  },
  success(res) {
    if (res.data?.code === 401) uni.reLaunch({ url: "/pages/login/login" });
  },
  fail() {
    uni.showToast({ title: "网络异常", icon: "none" });
  },
});

// 路由守卫
uni.addInterceptor("navigateTo", {
  invoke(args) {
    if (!uni.getStorageSync("token") && args.url.includes("/pages/mine/")) {
      uni.navigateTo({ url: "/pages/login/login" });
      return false;
    }
  },
});

// 发起请求（全平台，勿用 axios）
const [err, res] = await uni.request({
  url: "/api/list",
  method: "GET",
  data: { page: 1 },
});
```

### 3.5 CRUD 完整示例

```vue
<template>
  <view class="container">
    <uni-search-bar v-model="keyword" @confirm="onSearch" placeholder="搜索" />
    <scroll-view
      scroll-y
      style="flex:1"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <uni-list>
        <uni-swipe-action-item
          v-for="item in list"
          :key="item.id"
          :right-options="[
            { text: '删除', style: { backgroundColor: '#dd524d' } },
          ]"
          @click="deleteItem(item.id)"
        >
          <uni-list-item
            :title="item.name"
            :note="item.desc"
            clickable
            @click="goDetail(item.id)"
          />
        </uni-swipe-action-item>
      </uni-list>
      <uni-load-more :status="loadStatus" />
    </scroll-view>
    <uni-fab :pattern="{ backgroundColor: '#007AFF' }" @fabClick="addItem" />
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const list = ref([]);
const page = ref(1);
const loadStatus = ref("more"); // more | loading | noMore
const refreshing = ref(false);
const keyword = ref("");

const fetchList = async (reset = false) => {
  if (reset) {
    page.value = 1;
    loadStatus.value = "more";
  }
  loadStatus.value = "loading";
  const [err, res] = await uni.request({
    url: "/api/items",
    data: { page: page.value, keyword: keyword.value },
  });
  if (!err) {
    const items = res.data.data;
    list.value = reset ? items : [...list.value, ...items];
    loadStatus.value = items.length < 20 ? "noMore" : "more";
    page.value++;
  }
};

const onRefresh = async () => {
  refreshing.value = true;
  await fetchList(true);
  refreshing.value = false;
};
const loadMore = () => {
  if (loadStatus.value === "more") fetchList();
};
const onSearch = () => fetchList(true);
const goDetail = (id) =>
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` });

const addItem = async () => {
  // 跳转到新增页面或弹窗
  uni.navigateTo({ url: "/pages/form/form" });
};

const deleteItem = async (id) => {
  const { confirm } = await uni.showModal({
    title: "提示",
    content: "确认删除？",
  });
  if (!confirm) return;
  await uni.request({ url: `/api/items/${id}`, method: "DELETE" });
  uni.showToast({ title: "已删除" });
  list.value = list.value.filter((i) => i.id !== id);
};

onLoad(() => fetchList(true));
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
```

### 3.6 条件编译（`references/conditional-compilation.md`）

```js
// #ifdef MP-WEIXIN       仅微信
// #endif
// #ifndef H5             非 H5
// #endif
// #ifdef APP-PLUS || H5  App 或 H5（多平台用 ||，不支持 &&）
// #endif
```

标识符：`APP-PLUS` `APP-ANDROID` `APP-IOS` `H5` `MP-WEIXIN` `MP-ALIPAY` `MP-BAIDU` `MP-TOUTIAO` `MP-QQ` `MP` `APP-HARMONY` `MP-HARMONY`

**关键：`APP` 包含鸿蒙，`APP-PLUS` 不包含鸿蒙。**
静态资源：`static/app-plus/` `static/mp-weixin/` `static/h5/` `static/app-harmony/` `static/mp-harmony/`

### 3.7 样式要点

```css
/* rpx：750rpx = 屏幕宽度（推荐） | px：固定像素（边框等） */
/* 不推荐 rem/em/vw/vh（小程序兼容差） */
page {
  background-color: #f5f5f5;
} /* 页面根节点用 page，非 body */

/* rpx 换算：元素 rpx = 750 × 设计稿元素 px ÷ 设计稿宽度 px */
/* 例：375px 设计稿中 200px → 750 × 200 ÷ 375 = 400rpx */
```

- App/H5 支持全部 CSS；小程序不支持 `*` / `body` 选择器
- nvue 只支持 flex + class 选择器，默认 `flex-direction: column`
- 全局样式写 `App.vue <style>`（无 scoped）
- CSS 预处理器：less / sass / scss / stylus（Vue3 默认 dart-sass）

---

## 第四部分：调试与发布

详见 `references/debug-publish.md`。

| 平台       | 运行命令                   | 调试工具                      |
| ---------- | -------------------------- | ----------------------------- |
| H5         | `npm run dev:h5`           | Chrome DevTools               |
| 微信       | `npm run dev:mp-weixin`    | 微信开发者工具                |
| 支付宝     | `npm run dev:mp-alipay`    | 支付宝小程序开发者工具        |
| App        | HBuilderX 运行到手机       | HBuilderX 控制台调试窗口      |
| 鸿蒙 App   | HBuilderX 运行到鸿蒙       | HBuilderX 4.61+ 调试 + DevEco |
| 鸿蒙元服务 | HBuilderX 运行到鸿蒙元服务 | HBuilderX 控制台              |

| 发布平台   | 构建命令                    | 关键注意                                |
| ---------- | --------------------------- | --------------------------------------- |
| H5         | `npm run build:h5`          | 配 publicPath、router.base              |
| 微信       | `npm run build:mp-weixin`   | 主包 ≤ 2MB，善用分包                    |
| App        | 云打包 / 安心打包           | 配签名证书，安心打包更安全更快          |
| 鸿蒙 App   | 发行 → App-Harmony-本地打包 | 需签名证书(.p12+.cer+.p7b)，授权 DCloud |
| 鸿蒙元服务 | 发行 → 鸿蒙元服务           | 需企业开发者、华为图标底板              |

**调试技巧**：`condition` 配置直接启动到指定页面；`console.log` 直接输出到 HBuilderX 控制台

---

## 第五部分：避坑指南

详见 `references/pitfalls.md`。

| 问题                         | 正确做法                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| 用 axios 发请求              | 用 `uni.request`（axios 依赖 XMLHttpRequest，小程序/App 不支持） |
| navigateTo 跳 tabBar 页      | 用 `uni.switchTab()`                                             |
| 背景图用本地路径             | 小程序不支持，用网络 URL 或 base64                               |
| 组件内用 onLoad/onShow       | 组件只能用 Vue 钩子（onMounted 等）                              |
| 条件编译用 &&                | 不支持，多平台用 `\|\|`                                          |
| navigateTo 超 10 层          | 用 `redirectTo` 或 `reLaunch`                                    |
| 静态资源过大                 | 主包 ≤ 2MB，图片上 CDN，善用 subPackages                         |
| nvue 用 v-show               | nvue 不支持，只能用 v-if                                         |
| H5 跨域报错                  | App/小程序无此问题；H5 用后端 CORS 头或云函数代理                |
| Vue.prototype 挂全局         | Vue3 用 `app.config.globalProperties` 或 Pinia                   |
| uvue 布局错乱（uni-app x）   | App 端仅支持 flex 布局，不支持 block/float/inline                |
| UTS 类型报错                 | UTS 是强类型（接近 Kotlin/Swift），需显式标注所有类型            |
| JS 插件在 uni-app x 不可用   | 查找 UTS 版本或用混编（kt/swift）封装                            |
| 鸿蒙上 plus 对象不可用       | 统一使用 uni.\* API，WebView 通信用 WebviewContext.evalJs        |
| APP-PLUS 条件编译不包含鸿蒙  | 鸿蒙用 `APP-HARMONY`；如需 Android+iOS+鸿蒙用 `APP`              |
| 鸿蒙无法直接调用原生 API     | 必须通过 UTS 插件（arkts: true）中转                             |
| 元服务不支持 UTS 插件        | 元服务使用 ASCF 方案，不能用 ArkTS/UTS 原生写法                  |
| 鸿蒙路径过长报错             | 项目路径控制在 ~77 字符内，总路径 ~110 字符                      |
| nvue 在鸿蒙上渲染差异        | 鸿蒙 nvue 编译为 Web 渲染，非原生渲染                            |
| uni.showLoading 点击关闭失效 | 5.03+ 已改为基于 loading 组件，不再支持点击空白区关闭            |
| iOS 平台 async/await 不可用  | HBuilderX 4.31+ 已支持 App-iOS 平台 async/await                  |
| 编译缓存导致更新不生效       | 运行窗口勾选"清理构建缓存"或删除 unpackage 目录                  |
| 安全软件扫描编译产物耗时     | 将项目 unpackage 目录设置为信任目录提升性能                      |
| 对象字面量类型校验过严       | 5.03+ 目标语言为 js 时不再进行字段值类型校验                     |
| line-height 默认值异常       | 5.03+ 默认值已改为 normal，不再是固定 1.2                        |

---

## 第六部分：进阶功能速查

### Vue3 深入（`references/vue3-patterns.md`）

- Composition API + `<script setup>` + 组合式函数（composables）
- 组件通信：Props/Emits、v-model、provide/inject、插槽
- Vue2 → Vue3：`new Vue()` → `createSSRApp()`、`VUE_APP_*` → `VITE_*`
- **Vue 3.4+**：`defineModel` 简化 v-model、`useTemplateRef`、`defineOptions`、`defineSlots`

### uni-app x 最新特性（2025-2026 更新）

- **鸿蒙蒸汽模式**（5.03+）：鸿蒙平台渲染性能大幅提升
- **CSS 样式隔离策略 2.0**：统一全平台样式隔离策略，external-class 规范支持
- **useComputedStyle**（5.03+）：监听组件根节点计算后样式变化（Android/iOS/鸿蒙）
- **CSS line-height 默认值调整**：从固定 1.2 改为 normal
- **uni.showLoading 重构**（5.03+）：基于 loading 组件，不再支持点击空白区关闭
- **uni.setInnerAudioOption**（5.04+）：新增 speakerOn、obeyMuteSwitch 等参数
- **编译缓存机制**：持久化编译结果到 unpackage 目录，加快开发过程
- **对象字面量类型优化**：目标语言为 js 时不再进行字段值类型校验

### 高级功能（`references/advanced-features.md`）

- **nvue**：原生渲染，`<list>`/`<waterfall>` 自动回收内存
- **RenderJS**：视图层 JS，60fps（echarts/three.js），App-vue + H5（`:change:prop` 数据同步、动态加载第三方库）
- **WXS/SJS/Filter**：视图层脚本，避免逻辑层通信损耗（`references/wxs.md`）
- **i18n**：vue-i18n + pages.json `%key%` 语法 + locale 文件管理 + 复数
- **无障碍访问 a11y**：aria-label、role、颜色对比度
- **暗黑模式**：theme.json + CSS @media + `onThemeChange`
- **TypeScript**：`@dcloudio/types` + `lang="ts"`
- **环境变量**：Vue3 `.env` → `VITE_*` / Vue2 → `VUE_APP_*`
- **性能**：减少响应式数据、长列表用 list 组件、renderjs 避通信延迟、组件拆分细粒度更新
- **SSR**：SEO 友好，`ssrRef` 保持状态，uniCloud 部署（`onServerPrefetch` 数据获取）
- **PWA/H5 离线**：Service Worker + vite-plugin-pwa + NetworkFirst/CacheFirst 策略
- **WebSocket**：`uni.connectSocket()` → SocketTask（微信最多 5 连接）
- **拦截器**：`uni.addInterceptor()` 全局请求/路由拦截
- **WebView**：`<web-view>` + `evalJS()` 双向通信，本地 HTML 放 `/hybrid/html/`

### web-view 深度通信（`references/webview.md`）

- **应用 → web-view**：`evalJS()` 注入代码、调用网页函数
- **web-view → 应用**：`uni.postMessage()` + `@message` 事件（App-vue）、`@onPostMessage`（App-nvue 实时）
- **网页中调用 uni API**：引入 `uni.webview.js`，支持 navigateTo/redirectTo/reLaunch/switchTab
- **动态创建 webview**：`plus.webview.create()` + `append()` 控制大小/样式/缩放
- **层级覆盖**：原生 actionsheet、plus.nativeObj.view、subNVue、evalJS 注入

### App 原生能力（`references/app-native.md`）

- **登录**：`uni.login()` — 微信/QQ/Apple/一键登录(univerify)
- **支付**：`uni.requestPayment()` — 微信/支付宝/Apple IAP/Stripe/PayPal；uni-pay 2.x 云端一体方案
- **推送**：UniPush — `uni.getPushClientId()` + `uni.onPushMessage()`
- **分享**：`uni.share()` / `uni.shareWithSystem()` / `onShareAppMessage()`
- **安全**：APK 加固（代码加密/防篡改/防重打包）
- **隐私**：`androidPrivacy.json` 合规弹窗
- **渠道**：`plus.runtime.channel` 识别分发渠道

### 云服务（`references/cloud-services.md`）

- **uniCloud**：云函数/云对象 + 云数据库(JQL) + 云存储 + 前端网页托管
- **扩展数据库 MongoDB 版**（4.84+）：解决 serverless 云数据库稳定性、语法兼容度、独立工具管理等瓶颈
- **uni-ai**：支持客户端通过临时 token 直连 LLM，避免云函数持续产生费用；支持阿里云百炼、七牛云模型服务商
- **扩展存储**：视频转码 API、getUploadFileOptions、listFiles marker、uni 直播回放生成
- **UniPush 2.0**：全平台推送，聚合厂商离线通道，免费
- **一键登录**：运营商网关认证，0.2 分/次
- **uni 统计 2.0**：开源全平台，数据自主可控
- **uni-AD**：Banner/信息流/激励视频/贴片视频/开屏等广告变现

### 媒体与文件（`references/media-file-api.md`）

- 图片：选择/压缩/预览/保存/信息获取
- 视频：选择/压缩/编辑/保存/控制
- 音频：InnerAudioContext / BackgroundAudioManager
- 录音：RecorderManager（mp3/aac/wav/PCM）
- 相机：CameraContext（拍照/录像/帧数据）
- 文件：uploadFile/downloadFile/chooseFile/FileSystemManager

### 系统与设备（`references/system-device-api.md`）

- 设备信息/窗口信息/应用信息/授权状态/系统设置
- 网络状态监听、蓝牙（搜索/连接/通信）
- 加速度计/罗盘/陀螺仪、电池、屏幕亮度
- 导航栏/TabBar 动态控制、动画 API、键盘控制
- DOM 查询（SelectorQuery/IntersectionObserver）
- 物理按键拦截（onBackPress）

### 原生资源配置（`references/native-resources.md`）

- Android：AndroidManifest.xml、权限、ABI、URL Scheme、minSdkVersion、隐私合规、渠道包、安全加固
- iOS：Info.plist、Entitlements(Universal Links)、dSYM 符号表、**Watch App 嵌入支持**（4.84+）
- HarmonyOS：UTS 插件(ArkTS)、URL Scheme、App Linking、defineNativeEmbed 原生嵌入组件（4.66+）
- 地图服务：高德/百度/腾讯/Google 配置与费用
- 微信小程序插件集成、CORS 跨域处理

### 扩展组件（`references/more-components.md`）

- 原生覆盖：cover-view、movable-view
- 页面配置：page-meta、navigation-bar、custom-tab-bar、match-media
- 媒体组件：camera、barcode、live-pusher、live-player、animation-view
- **editor 富文本编辑器**：全套 EditorContext API（`references/editor.md`）
- uni-ui 补充：data-checkbox、data-select、file-picker、calendar、table、fab、indexed-list、countdown、number-box、segmented-control、drawer、pagination、breadcrumb、section、tooltip
- nvue 高性能：list、waterfall、recycle-list

### 数据驱动组件（`references/datacom.md`）

- **unicloud-db**：`<unicloud-db>` 组件通过插槽从云数据库获取数据
- **uni-data-select/checkbox/picker**：遵循 Datacom 规范的表单组件
- **联表查询**：field 字段 `{}` 子查询语法
- 与 uni-forms 结合实现搜索+列表

### subNVue 原生子窗体（`references/subnvue.md`）

- 页面级 subNVue（pages.json 配置）和动态创建
- 高于 WebView 的原生层级，覆盖 web-view 组件
- 父子通信：`uni.$emit/$on` 或 `evalJS`
- 侧边栏、抽屉菜单、复杂动画场景

### 共享元素过渡（`references/share-element.md`）

- `<share-element ident="...">` 创建列表到详情页平滑过渡
- 跳转 URL 需携带 `transition=share-element`
- App 和 H5 支持

---

## 第七部分：社区最佳实践

详见 `references/community-practices.md`。来源于 DCloud 社区精华帖和实战经验汇总。

### 核心主题

- **wgt 热更新**：资源包升级（跳过应用商店），官方 uni-upgrade-center 方案
- **性能优化**：分包策略、主包瘦身、异步分包/组件分包、白屏优化、骨架屏、数据/渲染优化
- **自定义导航栏**：状态栏高度适配、微信胶囊按钮计算、底部安全区
- **Android 合规**：隐私弹窗模板模式、运行时权限申请、自查清单
- **全局变量选型**：globalData vs Pinia vs provide/inject vs globalProperties
- **Pinia 持久化**：pinia-plugin-unistorage 全平台方案、选择性持久化
- **微信登录**：code 换 token 完整流程、手机号快速验证、session 管理
- **图片上传**：选择+压缩+批量上传 composable、多平台适配
- **分页加载**：通用 usePagination composable、z-paging 组件推荐
- **请求封装**：Promise 封装 + 错误处理 + API 模块化
- **路由守卫**：uni.addInterceptor 拦截、needLogin + uniIdRouter、角色权限控制
- **调试技巧**：condition 启动页、vConsole、平台差异调试

---

## 第八部分：uni-app x 与 UTS 插件

详见 `references/uniapp-x-uts.md`。

### uni-app x 核心架构

uni-app x 是 DCloud 下一代框架，**全原生渲染 + UTS 强类型语言**：

| 维度        | 传统 uni-app           | uni-app x                           |
| ----------- | ---------------------- | ----------------------------------- |
| App 渲染    | WebView / Weex（nvue） | **原生渲染（uvue）**                |
| 编程语言    | JavaScript             | **UTS（→ Kotlin / Swift / ArkTS）** |
| 页面后缀    | `.vue` / `.nvue`       | **`.uvue`**                         |
| Bridge 通信 | 有（性能瓶颈）         | **无（同层运行）**                  |

**官方文档：** https://doc.dcloud.net.cn/uni-app-x/

### 各平台支持

| 平台       | HBuilderX | 状态   |
| ---------- | --------- | ------ |
| Android    | 3.99+     | 已上线 |
| iOS        | 4.11+     | 已上线 |
| Web        | 4.0+      | 已上线 |
| HarmonyOS  | 4.61+     | 已上线 |
| 微信小程序 | 4.41+     | 推进中 |

### UTS 插件开发要点

```
目录结构：uni_modules/插件名/utssdk/app-android/index.uts
混编支持：4.28+ 支持 kt/java/swift/ets 直接混编
类型系统：强类型（接近 Kotlin/Swift），非 TypeScript 结构类型
```

### 选型建议

- **选传统 uni-app**：主攻小程序+H5、依赖大量 JS 插件、存量项目维护
- **选 uni-app x**：App 性能核心诉求、新项目、需要鸿蒙支持

### 版本兼容

| 项目类型     | Node.js | Vite    | Vue            |
| ------------ | ------- | ------- | -------------- |
| uni-app Vue3 | 18+     | 4.x/5.x | 3.4+           |
| uni-app Vue2 | 14+     | 不适用  | 2.6/2.7        |
| uni-app x    | 18+     | 5.x     | 3.4+（兼容层） |

---

## 第九部分：测试方案

详见 `references/testing.md`。

### 测试策略

| 测试类型     | 工具                     | 适用场景                            |
| ------------ | ------------------------ | ----------------------------------- |
| **单元测试** | Vitest                   | 纯函数、composable、store、工具方法 |
| **组件测试** | Vitest + @vue/test-utils | Vue 组件逻辑                        |
| **E2E 测试** | uni-automator + Jest     | 多平台真机/模拟器自动化             |

### Vitest 快速配置

```bash
npm install -D vitest @vue/test-utils happy-dom
```

需要 Mock uni 全局对象（`uni.request`、`uni.getStorageSync` 等）。详细 Mock 配置和测试示例见参考文件。

### uni-automator

DCloud 官方 E2E 方案，支持 App / H5 / 微信小程序：

```js
// pages/index/index.test.js
describe("首页", () => {
  it("列表渲染正确", async () => {
    const page = await program.reLaunch("/pages/index/index");
    await page.waitFor(500);
    const items = await page.$$(".list-item");
    expect(items.length).toBeGreaterThan(0);
  });
});
```

---

## 第十部分：安全实践

详见 `references/security.md`。

### 安全清单

```
Token 安全：短时效 access token + refresh token + 加密存储
接口安全：HTTPS 强制 + 请求签名（timestamp + nonce + HMAC）
XSS 防护：富文本白名单净化 + 用户输入转义 + H5 CSP 头
UGC 检测：uni-sec-check 文本/图片安全检测
```

### 加密存储示例

```js
import CryptoJS from "crypto-js";
const KEY = import.meta.env.VITE_STORAGE_KEY;

export function setSecure(key, value) {
  uni.setStorageSync(
    key,
    CryptoJS.AES.encrypt(JSON.stringify(value), KEY).toString()
  );
}

export function getSecure(key) {
  const enc = uni.getStorageSync(key);
  if (!enc) return null;
  try {
    return JSON.parse(
      CryptoJS.AES.decrypt(enc, KEY).toString(CryptoJS.enc.Utf8)
    );
  } catch {
    return null;
  }
}
```

### 平台安全要点

| 平台       | 要点                                             |
| ---------- | ------------------------------------------------ |
| H5         | CSP 头防 XSS；CORS 严格配置                      |
| 微信小程序 | 合法域名 HTTPS；appSecret 仅服务端使用           |
| App        | androidPrivacy.json 合规；APK 加固；敏感数据加密 |

---

## 第十一部分：CI/CD 与 Vite 配置

详见 `references/cicd.md`。

### GitHub Actions 基本流程

```yaml
# H5 构建部署
- run: npm ci
- run: npm run build:h5
  env:
    VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
- uses: peaceiris/actions-gh-pages@v4
  with:
    publish_dir: ./dist/build/h5
```

```yaml
# 微信小程序构建上传
- run: npm run build:mp-weixin
- run: miniprogram-ci upload --pp ./dist/build/mp-weixin --pkp "${{ secrets.WX_PRIVATE_KEY }}" --appid ${{ secrets.WX_APPID }}
```

### 环境变量

```bash
# .env.development
VITE_API_BASE=http://localhost:3000
# .env.production
VITE_API_BASE=https://api.example.com
```

代码中使用：`import.meta.env.VITE_API_BASE`（Vue3+Vite）

### Vite 配置要点

```js
// vite.config.js
export default defineConfig({
  plugins: [uni()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: {
    proxy: {
      "/api": { target: "https://api.example.com", changeOrigin: true },
    },
  },
  build: {
    minify: "terser",
    terserOptions: { compress: { drop_console: true } },
  },
});
```

---

## 参考文件完整索引

| 文件                                    | 覆盖内容                                                                                                                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/project-setup.md`           | 环境搭建（HBuilderX/CLI）、项目创建、目录结构、UI 库引入、main.js、uni.scss                                                                                                                                                                                                       |
| `references/pages-config.md`            | pages.json 全部字段：globalStyle、pages、tabBar、subPackages、preloadRule、easycom、condition、networkTimeout、**leftWindow/topWindow/rightWindow 宽屏适配、uniIdRouter 路由守卫、entryPagePath、页面动画配置**                                                                   |
| `references/lifecycle.md`               | 应用/页面/组件生命周期钩子表、执行顺序、时序图、Vue3 Composition API 用法、Pinia 交互、平台差异、常见模式与陷阱                                                                                                                                                                   |
| `references/api.md`                     | 网络请求、路由导航、UI 交互、本地存储、位置、设备信息、扫码、权限、工具方法                                                                                                                                                                                                       |
| `references/components.md`              | view、text、image、scroll-view、swiper、input、textarea、button、picker、form、navigator、video、map、canvas、rich-text、uni-ui 常用组件                                                                                                                                          |
| `references/conditional-compilation.md` | 平台标识符、JS/CSS/Template/pages.json/静态资源条件编译、导航栏适配、安全区                                                                                                                                                                                                       |
| `references/vue3-patterns.md`           | Composition API、组合式函数、Props/Emits/v-model/provide-inject/Slots、Vue2→3 迁移、**Vue 3.4+ 新特性（defineModel、useTemplateRef、defineOptions、defineSlots、useId）**                                                                                                         |
| `references/advanced-features.md`       | nvue、**RenderJS（深入：:change:prop 机制、动态加载第三方库）**、i18n（**locale 文件管理、pages.json %key% 语法、复数**）、**无障碍访问 a11y**、暗黑模式、TypeScript、环境变量、性能优化、SSR（**ssrRef、数据获取**）、**PWA/H5 离线策略**、WebSocket、拦截器、Vite 配置、WebView |
| `references/app-native.md`              | OAuth 登录、支付、推送(plus.push)、分享、安全加固、隐私合规、渠道包                                                                                                                                                                                                               |
| `references/cloud-services.md`          | UniPush 2.0（客户端+服务端）、一键登录 univerify、uni 统计 2.0、uniCloud（云函数/数据库/存储/JQL）、uni-AD 广告                                                                                                                                                                   |
| `references/media-file-api.md`          | 图片（选择/压缩/预览/保存）、视频（选择/压缩/编辑）、音频播放/背景音频、录音、相机、视频控制、文件上传下载                                                                                                                                                                        |
| `references/system-device-api.md`       | 设备/窗口/应用信息、网络、蓝牙、加速度计/罗盘/陀螺仪、电池、剪贴板、振动、导航栏/TabBar/动画/滚动/字体/键盘/DOM 查询                                                                                                                                                              |
| `references/native-resources.md`        | Android（Manifest/权限/ABI/Scheme/minSDK/隐私/渠道/加固）、iOS（Info.plist/Entitlements/dSYM）、鸿蒙、地图服务、小程序插件、CORS                                                                                                                                                  |
| `references/more-components.md`         | cover-view、movable-view、page-meta、navigation-bar、camera、barcode、live-pusher/player、match-media、animation-view、20+ uni-ui 组件、nvue list/waterfall/recycle-list                                                                                                          |
| `references/debug-publish.md`           | H5/小程序/App 运行调试方法、断点调试、打包发布（云打包/安心打包/离线打包）、各平台发布流程                                                                                                                                                                                        |
| `references/pitfalls.md`                | 13 大常见问题详解：静态资源路径、样式兼容、tabBar 跳转、请求封装、条件编译语法、生命周期混淆、包体积优化、nvue 限制、第三方库选择、uvue CSS 限制、UTS 类型系统、JS 插件兼容                                                                                                       |
| `references/community-practices.md`     | 社区精华：wgt 热更新、性能优化（分包/白屏/数据/渲染）、自定义导航栏、Android 合规、全局变量选型、微信登录流程、图片上传压缩、分页加载组合函数、请求封装、调试技巧                                                                                                                 |
| `references/uniapp-x-uts.md`            | uni-app x 架构对比、uvue 页面与 CSS 限制、UTS 语言要点与类型系统、UTS 插件开发（Android/iOS/鸿蒙）、混编（kt/swift/ets）、选型建议、版本兼容矩阵、迁移指南                                                                                                                        |
| `references/harmony-basics.md`          | 鸿蒙基础：概述、版本兼容矩阵、环境搭建、项目配置（harmony-configs）、签名权限、条件编译速查、常见错误排查、UTS 开发环境                                                                                                                                                           |
| `references/harmony-development.md`     | 鸿蒙核心开发：UTS 插件（arkts）、原生组件嵌入（defineNativeEmbed）、华为账号登录、URL Scheme/App Linking                                                                                                                                                                          |
| `references/harmony-advanced.md`        | 鸿蒙进阶：元服务开发（MP-HARMONY）、调试、发布、地图与内置模块                                                                                                                                                                                                                    |
| `references/harmony-migration.md`       | 鸿蒙适配与迁移：日常适配指南、API 兼容速查、老项目迁移实战、**架构师深度笔记（JSVM/第三方库/CSS 差异/隐私合规/代码审查/30+ FAQ）**                                                                                                                                                |
| `references/manifest.md`                | manifest.json 完整参考：核心字段、各平台配置（app-plus/app-harmony/h5/mp-weixin 等）、OAuth/Push/Maps/权限、环境变量、HBuilderX 可视化编辑器、实用模板                                                                                                                            |
| `references/testing.md`                 | 测试策略（Vitest 单元测试 + uni-automator E2E）、uni 全局对象 Mock、composable/store/组件测试模式、E2E API 速查、目录结构建议                                                                                                                                                     |
| `references/security.md`                | Token 安全存储（AES 加密封装）、refresh token 机制、接口签名（HMAC-SHA256）、XSS 防护（DOMPurify/CSP/转义）、UGC 安全检测、HTTPS 强制、平台安全要点                                                                                                                               |
| `references/cicd.md`                    | GitHub Actions 工作流（H5/微信小程序/多平台并行）、miniprogram-ci 上传、环境变量管理、Vite 配置（alias/proxy/构建优化/全局常量）、App 云打包/安心打包、小程序体积管控                                                                                                             |
| `references/native-js.md`               | **新增** Native.js 深度参考：Android/iOS 类型转换、importClass/newObject/invoke/implements 全套 API、快捷方式/拨打电话/Game Center 实战、性能优化                                                                                                                                 |
| `references/wxs.md`                     | **新增** WXS/SJS/Filter 视图层脚本：跨平台语法对照、触摸跟手/输入过滤/图片懒加载实战、与 RenderJS 选型对比                                                                                                                                                                        |
| `references/webview.md`                 | **新增** web-view 组件深度参考：双向通信（evalJS/postMessage/UniAppJSBridgeReady）、App 端动态创建 webview、层级覆盖方案、本地网页、浏览器内核                                                                                                                                    |
| `references/subnvue.md`                 | **新增** subNVue 原生子窗体：页面级配置/动态创建、nvue 编写、父子通信、动画类型、侧边栏/web-view 覆盖场景                                                                                                                                                                         |
| `references/share-element.md`           | **新增** share-element 共享元素过渡：ident 标识、transition 配置、列表到详情完整示例、平台支持                                                                                                                                                                                    |
| `references/editor.md`                  | **新增** editor 富文本编辑器组件：EditorContext 全套 API（format/insertImage/getContents/setContents/undo/redo）、工具栏实现、事件详情                                                                                                                                            |
| `references/datacom.md`                 | **新增** Datacom 数据驱动组件规范：unicloud-db 组件（插槽数据/增删改/联表查询）、uni-data-select/checkbox/picker 组件、与 uni-forms 结合                                                                                                                                          |
