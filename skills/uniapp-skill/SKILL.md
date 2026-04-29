---
name: uniapp-skill
description: 将此技能应用于所有 uni-app / uniapp / uni-app x / UTS / HBuilderX / DCloud 跨端开发任务；包括 H5、小程序、App、HarmonyOS、鸿蒙元服务、pages.json、manifest.json、uni API、Pinia、条件编译、测试、CI/CD、安全、UTS 插件等场景。
---

# uni-app Skill

## 意图

帮助 Agent 处理 uni-app / uni-app x 项目的开发、审查、调试、配置、测试与发布。主文件保持轻量；详细示例和长表格放在 `references/` 中，按任务读取。

官方文档：<https://uniapp.dcloud.net.cn/>

## 触发场景

用户提到以下内容时使用：

- `uni-app`、`uniapp`、`uni-app x`、`uvue`、`nvue`、`UTS`、HBuilderX、DCloud。
- H5、微信/支付宝/抖音/QQ 等小程序、App、HarmonyOS、鸿蒙元服务。
- `pages.json`、`manifest.json`、条件编译、`uni.request`、`uni.navigateTo`、easycom、uni-ui。
- Pinia、生命周期、路由、网络请求、组件、媒体文件、设备 API、web-view、RenderJS、WXS、subNVue。
- uni-automator、Vitest、CI/CD、安全、性能优化、发布打包。
- 需要通过 UTS / ArkTS / ETS 封装鸿蒙能力时，同时使用 `harmony-uts-plugin`。

## 工作流

1. **识别目标平台与项目形态**
   - 传统 uni-app 还是 uni-app x。
   - 目标是 H5、小程序、App、`APP-HARMONY`、`MP-HARMONY` 还是多端。
   - 优先检查 `pages.json`、`manifest.json`、项目结构和已有平台条件编译。
2. **先选官方跨端能力**
   - 能用 `uni.*`、内置组件、uni-ui、DCloud 插件解决时，不要直接引入 Web/Node/浏览器专用方案。
   - 网络请求优先 `uni.request`，路由优先 `uni.navigateTo` / `switchTab` 等 uni API。
3. **按场景读取 references**
   - 只读取当前任务需要的文件，避免一次加载全部长资料。
   - 如果不确定，从 `references/full-guide.md` 或下方索引开始。
4. **实现或审查时坚持平台差异显式化**
   - 用 `#ifdef` / `#ifndef` 隔离平台差异。
   - 注意 `APP` 包含鸿蒙，`APP-PLUS` 不包含鸿蒙；鸿蒙 App 用 `APP-HARMONY`。
5. **验证**
   - 代码任务优先跑目标平台可用的 lint/test/build。
   - 涉及 App/鸿蒙/硬件能力时，模拟器结果不能替代真机验证。

## 关键规则

- 不要在 uni-app 项目里默认使用 axios；跨端请求用 `uni.request`。
- tabBar 页面跳转用 `uni.switchTab()`，不要用 `navigateTo()`。
- 组件里用 Vue 生命周期；页面里用 `onLoad` / `onShow` 等页面生命周期。
- 条件编译支持 `||`，不要假设支持复杂 JS 表达式。
- 小程序主包体积受限，静态资源应分包、压缩或上 CDN。
- uni-app x / uvue 强类型和 CSS 能力更接近原生约束；布局优先 flex。
- 鸿蒙原生能力优先查 `uni.*` 是否已覆盖；确需原生封装时使用 `harmony-uts-plugin`。
- 不要输出或写入密钥、证书密码、token、真实用户隐私数据。

## 常用 references

| 场景 | 读取 |
|---|---|
| 完整详细指南 / 原长版内容 | `references/full-guide.md` |
| 项目搭建与目录 | `references/project-setup.md` |
| 页面与路由配置 | `references/pages-config.md` |
| `manifest.json` | `references/manifest.md` |
| 生命周期 | `references/lifecycle.md` |
| 网络、路由、存储、UI API | `references/api.md` |
| 组件与 uni-ui | `references/components.md`、`references/more-components.md` |
| 条件编译与平台标识 | `references/conditional-compilation.md` |
| Vue3 写法与迁移 | `references/vue3-patterns.md` |
| 样式、性能、RenderJS、WebView、SSR | `references/advanced-features.md` |
| App 原生能力 | `references/app-native.md`、`references/native-resources.md` |
| uniCloud、UniPush、统计、一键登录 | `references/cloud-services.md` |
| uni-app x / UTS | `references/uniapp-x-uts.md` |
| 鸿蒙基础/开发/发布/迁移 | `references/harmony-basics.md`、`references/harmony-development.md`、`references/harmony-advanced.md`、`references/harmony-migration.md` |
| 媒体、文件、设备系统 API | `references/media-file-api.md`、`references/system-device-api.md` |
| web-view / Native.js / WXS / subNVue | `references/webview.md`、`references/native-js.md`、`references/wxs.md`、`references/subnvue.md` |
| 富文本、共享元素、Datacom | `references/editor.md`、`references/share-element.md`、`references/datacom.md` |
| 测试、安全、CI/CD | `references/testing.md`、`references/security.md`、`references/cicd.md` |
| 调试发布与避坑 | `references/debug-publish.md`、`references/pitfalls.md`、`references/community-practices.md` |

## 开发检查清单

- [ ] 已确认目标平台和项目类型。
- [ ] 已优先使用 uni 官方跨端 API / 组件。
- [ ] 平台差异已用条件编译隔离。
- [ ] 页面、组件、store、utils 的职责清晰。
- [ ] 请求、登录态、权限、隐私数据处理符合目标平台限制。
- [ ] 对涉及硬件、App、鸿蒙的能力已规划真机验证。
- [ ] 文档表述与真实功能一致，没有承诺未验证能力。
