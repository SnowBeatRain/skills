# uniapp-skill 说明文件

## 概述

`uniapp-skill` 是为 Claude Code 构建的 uni-app 开发知识技能库，涵盖 uni-app 框架全链路开发知识（含 uni-app x / UTS 插件）。当用户提及 uni-app、uniapp、uni-app x、uvue、UTS、HBuilderX、DCloud、小程序、跨端开发等关键词时自动触发。

## 知识来源

| 来源 | 说明 |
|------|------|
| uni-app 官方文档 | `E:\claude\unidocs-zh\docs\` 下 500+ 篇 markdown 文件，系统性学习 |
| uni-app x 官方文档 | `https://doc.dcloud.net.cn/uni-app-x/` UTS 语言、uvue 渲染、鸿蒙支持 |
| DCloud 社区精华帖 | `ask.dcloud.net.cn` 推荐/精华帖，覆盖 8 页 ~120+ 帖子 |
| 实战经验 | 社区高频问题、最佳实践、避坑指南 |

## 文件结构

```
uniapp-skill/
├── SKILL.md                              主入口（意图、触发场景、工作流、关键规则、references 索引、检查清单）
│   ├── 意图与触发场景                      何时加载本 skill、覆盖的平台与技术栈
│   ├── 工作流                              识别平台→选官方能力→读取 references→条件编译→验证
│   ├── 关键规则                            禁用 axios、switchTab、页面生命周期、条件编译等 11 条铁律
│   ├── 常用 references                     38 个参考文件按场景索引
│   └── 开发检查清单                        13 项上线前必检
│
├── references/                           38 个参考文件（~17,200 行）
│   ├── project-setup.md         (173)    环境搭建、项目创建、目录结构、UI 库
│   ├── pages-config.md          (315)    pages.json 全部字段：globalStyle/tabBar/分包/easycom/宽屏适配/路由守卫
│   ├── manifest.md              (455)    manifest.json 完整参考：核心字段、各平台配置、OAuth/Push/Maps、模板
│   ├── lifecycle.md             (521)    应用/页面/组件生命周期、时序图、Vue3 用法、Pinia 交互、平台差异、陷阱
│   ├── api.md                   (282)    网络请求、路由、UI、存储、位置、设备
│   ├── network-advanced.md      (266)    WebSocket / SocketTask / UDP / mDNS 进阶网络能力
│   ├── components.md            (475)    内置组件 + uni-ui 常用组件
│   ├── more-components.md       (433)    扩展组件、媒体组件、nvue 高性能组件、广告组件
│   ├── conditional-compilation.md (201)  条件编译语法与平台标识
│   ├── vue3-patterns.md         (335)    Composition API、组合函数、Vue2→3 迁移、Vue 3.4+ 新特性
│   ├── advanced-features.md     (824)    nvue/RenderJS/WXS/i18n/a11y/暗黑/TS/SSR/PWA/WebSocket（概览）
│   ├── app-native.md            (418)    微信/QQ/Apple/一键登录/Facebook/Google 登录、微信/支付宝/Apple IAP/PayPal/Stripe 支付、推送、分享
│   ├── advertising.md           (385)    uni-ad 信息流/激励视频/插屏/全屏视频/小程序广告
│   ├── cloud-services.md        (295)    UniPush/一键登录/uni统计/uniCloud/uni-AD
│   ├── media-file-api.md        (275)    图片/视频/音频/录音/相机/文件操作
│   ├── canvas-api.md            (355)    Canvas 2D 绘图、导出图片、离屏画布、海报生成
│   ├── hardware-open-api.md     (447)    BLE/WiFi/NFC/iBeacon/生物认证/截屏/内存告警/通讯录
│   ├── system-device-api.md     (374)    设备信息/蓝牙/传感器/UI控制/DOM查询
│   ├── native-resources.md      (610)    Android/iOS/鸿蒙原生配置、地图、CORS、Android 16KB/X5、App 上架与合规
│   ├── debug-publish.md         (308)    各平台运行调试、打包发布、内存泄漏/OOM/真机运行 FAQ
│   ├── pitfalls.md              (282)    13 大常见问题（含 uni-app x 坑点）
│   ├── community-practices.md  (1,048)   社区精华实战（热更新/性能/登录等）
│   ├── uniapp-x-uts.md          (442)    uni-app x 架构/uvue/UTS/插件开发/混编/鸿蒙/迁移
│   ├── harmony-basics.md        (283)    鸿蒙基础：环境搭建/项目配置/签名/条件编译/错误排查
│   ├── harmony-development.md   (431)    鸿蒙核心开发：UTS 插件/原生组件/华为登录/URL Scheme
│   ├── harmony-advanced.md      (346)    鸿蒙进阶：元服务/支付/签名/App Linking/调试/发布/地图
│   ├── harmony-migration.md   (1,637)    鸿蒙适配迁移：日常适配/老项目迁移/架构师笔记
│   ├── testing.md               (422)    Vitest 单元测试 + uni-automator E2E 测试
│   ├── security.md              (383)    Token 安全/接口签名/XSS 防护/UGC 检测
│   ├── cicd.md                  (391)    GitHub Actions/环境变量/Vite 配置/包体积管控
│   ├── dev-center.md            (259)    DCloud 开发者中心：账号/应用/云打包计费/发票
│   ├── native-js.md             (319)    Native.js：直接调用 Android/iOS 原生 API
│   ├── webview.md               (272)    web-view 双向通信：evalJS/postMessage/动态创建/层级覆盖
│   ├── wxs.md                   (305)    WXS/SJS/Filter：视图层脚本，避免逻辑层通信损耗
│   ├── subnvue.md               (169)    subNVue 原生子窗体：侧边栏/抽屉/父子通信
│   ├── share-element.md         (153)    共享元素过渡：列表→详情页平滑动画
│   ├── editor.md                (239)    富文本编辑器：editor 组件全套 EditorContext API
│   └── datacom.md               (229)    Datacom 数据驱动组件：unicloud-db/uni-data-select/联表查询
│
└── README.md                             本说明文件
```

**总计：40 个文件，约 17,800 行**

## 快速上手

| 阶段 | 天数 | 重点 | 参考文件 |
|------|------|------|----------|
| 一：环境与基础 | 1-2 天 | 安装 HBuilderX/CLI、项目结构、pages.json、manifest.json | `project-setup.md`、`pages-config.md`、`manifest.md` |
| 二：核心概念 | 3-5 天 | Vue3 Composition API、页面生命周期、路由导航、条件编译 | `lifecycle.md`、`vue3-patterns.md`、`conditional-compilation.md`、`api.md` |
| 三：项目实战 | 5-10 天 | 完整 CRUD、Pinia 状态管理、网络请求封装、组件化开发 | `components.md`、`more-components.md`、`community-practices.md` |
| 四：进阶能力 | 按需 | App 原生能力、云服务、nvue/RenderJS/WXS、测试、安全、CI/CD | 按需查阅对应参考文件 |

> 详细代码示例和最佳实践见 `SKILL.md` 正文。

## 知识覆盖范围

### 基础开发

| 模块 | 覆盖内容 |
|------|----------|
| 项目搭建 | HBuilderX / CLI 创建、目录结构、main.js、uni.scss |
| 页面配置 | pages.json 全字段、globalStyle、tabBar、分包、easycom、宽屏适配 |
| 应用配置 | manifest.json 核心字段、各平台配置（app-plus/app-harmony/h5/小程序）、SDK 集成 |
| 应用配置详解 | manifest.json 完整参考：appid、权限、OAuth/Push/Maps、环境变量、HBuilderX 编辑器、模板 |
| 生命周期 | App/页面/组件三级钩子、执行顺序、时序图、Vue3 Composition API、Pinia 交互、平台差异、常见陷阱 |
| 路由导航 | navigateTo/redirectTo/switchTab/reLaunch、EventChannel 页面通信、uni.$emit/$on 全局事件 |
| 条件编译 | #ifdef/#ifndef、平台标识符、JS/CSS/Template/pages.json/静态资源 |
| 样式体系 | rpx 单位及换算公式（750rpx = 屏幕宽度）、page 根节点、CSS 预处理器、nvue flex 限制 |

### 核心 API

| 模块 | 覆盖内容 |
|------|----------|
| 网络请求 | uni.request + 拦截器、路由守卫、请求封装、WebSocket / SocketTask / UDP / mDNS |
| UI 交互 | showToast/showModal/showLoading/showActionSheet |
| 本地存储 | getStorage/setStorage（同步/异步） |
| 媒体文件 | 图片选择压缩预览、视频处理、音频播放录音、文件上传下载、Canvas 2D 绘图 |
| 系统设备 | 设备信息、网络、蓝牙、传感器、电池、剪贴板、振动、BLE、WiFi、NFC、iBeacon、生物认证、内存告警 |
| UI 控制 | 导航栏、TabBar、动画、滚动、字体、键盘、DOM 查询 |

### 鸿蒙开发

| 模块 | 覆盖内容 |
|------|----------|
| 鸿蒙基础 | 环境搭建（DevEco Studio 5.0.7+/API 14+）、项目配置、签名权限、条件编译、错误排查 |
| 鸿蒙核心 | UTS 插件开发（arkts）、原生组件嵌入、华为账号登录、URL Scheme/App Linking |
| 鸿蒙进阶 | 元服务开发（MP-HARMONY）、调试技巧、发布流程、地图服务 |
| 鸿蒙迁移 | 日常适配指南、API 兼容速查、老项目迁移实战、架构师深度笔记（JSVM 原理/第三方库替代/CSS 差异/隐私合规/30+ FAQ），1637 行最全鸿蒙迁移参考 |
| 鸿蒙蒸汽模式 | 5.03+ 新增，鸿蒙平台渲染性能大幅提升 |

### uni-app x 最新特性（2025-2026）

| 模块 | 覆盖内容 |
|------|----------|
| 鸿蒙蒸汽模式 | 5.03+ 渲染性能大幅提升 |
| CSS 样式隔离策略 2.0 | 统一全平台样式隔离、external-class 规范支持 |
| useComputedStyle | 5.03+ 监听组件根节点计算后样式变化 |
| CSS line-height 调整 | 5.03+ 默认值改为 normal |
| uni.showLoading 重构 | 5.03+ 基于 loading 组件，不再支持点击空白区关闭 |
| uni.setInnerAudioOption | 5.04+ 新增 speakerOn、obeyMuteSwitch 等参数 |
| 编译缓存机制 | 持久化编译结果，加快开发过程 |
| 对象字面量类型优化 | 目标语言为 js 时不再进行字段值类型校验 |

### 组件体系

| 类别 | 组件 |
|------|------|
| 基础 | view、text、image、scroll-view、swiper |
| 表单 | input、textarea、button、picker、picker-view、form、switch、slider、checkbox、radio、label、editor |
| 导航 | navigator、tabBar、custom-tab-bar |
| 媒体 | video、audio、camera、live-pusher、live-player、animation-view |
| 覆盖 | cover-view、coverage-image、movable-view |
| 页面 | page-meta、navigation-bar、custom-tab-bar、match-media |
| web-view | web-view 内嵌网页、双向通信 |
| uni-ui | 30+ 组件（badges/cards/lists/forms/popups/tables 等） |
| nvue | list、waterfall、recycle-list（自动内存回收） |
| Datacom | unicloud-db（云数据驱动）、uni-data-select/checkbox/picker、与 uni-forms 结合 |

### uni-app x 与 UTS（新增）

| 模块 | 覆盖内容 |
|------|----------|
| 架构对比 | 传统 uni-app vs uni-app x（渲染引擎/编译目标/性能） |
| uvue 页面 | 文件后缀、CSS 子集限制（仅 flex）、各平台支持状态 |
| UTS 语言 | 语法要点、类型系统（强类型 vs TS）、类型推导演进 |
| UTS 插件开发 | 目录结构、Android/iOS/鸿蒙插件示例、config.json 配置 |
| 混编能力 | kt/java/swift/ets 直接混编、导入方式 |
| 鸿蒙支持 | 环境要求（DevEco Studio 5.0.7+/API 14+）、特有功能 |
| 版本兼容 | HBuilderX 版本功能矩阵、Node/Vite/Vue 版本要求 |
| 迁移指南 | 传统→x 迁移步骤、常见问题与解决方案 |
| 选型建议 | 何时选传统 uni-app / 何时选 uni-app x |

### 测试方案（新增）

| 模块 | 覆盖内容 |
|------|----------|
| Vitest 单元测试 | 安装配置、uni API Mock、setup 文件、覆盖率 |
| 测试工具函数 | 纯函数测试示例 |
| 测试 Composable | useCounter 组合函数测试 |
| 测试 Pinia Store | Store actions/getters 测试、mock storage |
| 测试 uni API 调用 | uni.request mock、异步测试 |
| uni-automator E2E | 安装、页面测试编写、API 速查表 |
| 最佳实践 | 测什么/不测什么、目录结构、package.json 脚本 |

### 安全实践（新增）

| 模块 | 覆盖内容 |
|------|----------|
| Token 安全 | 加密存储（AES 封装）、refresh token 机制、自动刷新 |
| 接口签名 | HMAC-SHA256 签名、拦截器集成、后端校验要点 |
| XSS 防护 | DOMPurify 富文本净化、HTML 实体转义、URL 参数校验、CSP |
| UGC 检测 | uni-sec-check 文本/图片安全检测 |
| HTTPS | manifest.json 配置、拦截器强制 HTTPS、小程序合法域名 |
| 敏感数据 | 日志脱敏、App 端防截屏 |
| 平台要点 | H5 CSP/CORS、小程序 appSecret 仅服务端、App 加固 |

### CI/CD 与工程化（新增）

| 模块 | 覆盖内容 |
|------|----------|
| GitHub Actions | H5 构建部署、微信小程序上传（miniprogram-ci）、多平台并行 |
| 环境变量 | .env 文件管理、VITE_* 注入、CI Secrets 配置 |
| Vite 配置 | 路径别名、开发代理、构建优化（terser）、全局常量 |
| App 构建 | 云打包 CLI、安心打包 |
| 小程序管控 | 主包 2MB 限制检查、分包策略、preloadRule |

### 进阶能力

| 模块 | 覆盖内容 |
|------|----------|
| Vue3 深入 | Composition API、composables、Props/Emits/v-model/provide-inject/Slots、Vue 3.4+ defineModel/useTemplateRef |
| 原生渲染 | nvue 限制与优势、RenderJS 60fps 交互（`:change:prop` 数据同步、动态加载第三方库） |
| WXS/SJS/Filter | 视图层脚本，避免逻辑层通信损耗，跨平台语法对照、触摸跟手/输入过滤/图片懒加载实战 |
| 国际化 | vue-i18n + pages.json %key% 语法 + locale 文件管理 + 复数 |
| 无障碍访问 | aria-label、role、颜色对比度 |
| 暗黑模式 | theme.json + CSS @media + onThemeChange |
| TypeScript | @dcloudio/types + lang="ts" |
| SSR | 服务端渲染、SEO 优化、onServerPrefetch 数据获取 |
| PWA/H5 离线 | Service Worker + vite-plugin-pwa + NetworkFirst/CacheFirst 策略 |
| WebSocket / UDP / mDNS | `uni.connectSocket` 实时通信、UDP、mDNS；详见 `network-advanced.md` |
| WebView 深度通信 | evalJS 注入、postMessage 双向、uni.webview.js、动态创建 webview、层级覆盖 |
| subNVue | 原生子窗体，高于 WebView 层级，侧边栏/抽屉/父子通信、动画 |
| Native.js | importClass/newObject/invoke/implements 全套 API，直接调用 Android/iOS 原生 API，无需插件 |
| 共享元素过渡 | share-element 列表→详情页平滑动画，ident/transition 配置 |
| 富文本编辑器 | editor 组件全套 EditorContext API（format/insertImage/getContents/setContents/undo/redo） |
| Datacom 组件 | unicloud-db 插槽获取云数据、uni-data-select/checkbox/picker、联表查询 |
| 宽屏适配 | pages.json leftWindow/topWindow/rightWindow 多栏布局 |

### App 原生

| 模块 | 覆盖内容 |
|------|----------|
| 登录 | 微信/QQ/Apple/Facebook/Google/一键登录(univerify) |
| 支付 | 微信/支付宝/Apple IAP/Stripe/PayPal |
| 推送 | UniPush 2.0 + 厂商离线通道 |
| 分享 | 系统分享 + 平台分享 + 小程序分享 |
| 安全 | APK 加固、防篡改、防重打包 |
| 隐私 | androidPrivacy.json 合规弹窗 |
| 原生配置 | AndroidManifest.xml、Info.plist、Entitlements、鸿蒙 |

### 云服务

| 模块 | 覆盖内容 |
|------|----------|
| uniCloud | 云函数/云对象 + 云数据库(JQL) + 云存储 + 前端网页托管 |
| 扩展数据库 MongoDB 版 | 4.84+ 解决 serverless 云数据库稳定性、语法兼容度、独立工具管理等瓶颈 |
| uni-ai | 支持客户端通过临时 token 直连 LLM，避免云函数持续产生费用；支持阿里云百炼、七牛云模型服务商 |
| 扩展存储 | 视频转码 API、getUploadFileOptions、listFiles marker、uni 直播回放生成 |
| UniPush 2.0 | 全平台推送，客户端+服务端完整代码 |
| 一键登录 | 运营商网关认证，换取手机号完整流程 |
| uni 统计 | 开源全平台统计，自定义事件上报 |
| uni-AD | Banner/信息流/激励视频/插屏/全屏视频/沉浸视频流/小程序广告；详见 `advertising.md` |

### 社区实战

| 主题 | 覆盖内容 |
|------|----------|
| wgt 热更新 | 服务端 API + 客户端下载安装 + uni-upgrade-center |
| 性能优化 | 分包策略、主包瘦身、异步分包/组件分包、白屏骨架屏、数据/渲染优化 |
| 自定义导航栏 | 状态栏适配、微信胶囊计算、底部安全区 |
| Android 合规 | 隐私弹窗模板、权限申请、自查清单、常见拒审原因 |
| 全局变量 | globalData/Pinia/provide-inject/globalProperties 选型 |
| Pinia 持久化 | pinia-plugin-unistorage 全平台方案、选择性持久化、Composition API 写法 |
| 微信登录 | code→token 完整流程、手机号快速验证、静默登录 |
| 图片上传 | useImageUpload composable（选择+压缩+批量上传） |
| 分页加载 | usePagination composable + z-paging 组件 |
| 请求封装 | Promise 封装 + 错误处理 + API 模块化 |
| 调试技巧 | condition 启动页、vConsole、平台差异调试 |
| 路由守卫 | uni.addInterceptor 拦截、needLogin + uniIdRouter、tabBar 检查、角色权限控制 |

## 触发条件

当用户消息中包含以下任一关键词时自动加载：

`uni-app` `uniapp` `uni-app x` `uvue` `UTS` `HBuilderX` `DCloud` `跨端开发` `小程序` `多端` `pages.json` `manifest.json` `uni.request` `uni.navigateTo` `easycom` `nvue` `uts` `uniCloud` `uni-ui` `条件编译` `#ifdef` `uni-automator` `vitest` `pinia` `arkts` `ets` `鸿蒙元服务` `HarmonyOS` `uniapp CI/CD` `uniapp security` `UTS plugin`

以及涉及目标平台：微信小程序、H5、App、支付宝、抖音、QQ、百度、鸿蒙、HarmonyOS、Harmony、Meta-Service。
