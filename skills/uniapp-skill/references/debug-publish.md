# 调试与发布指南

## 运行调试

### H5（浏览器）

HBuilderX 中：运行 → 运行到浏览器 → Chrome

CLI 方式：
```bash
npm run dev:h5
```

- 支持 Chrome DevTools 完整调试
- 支持热更新（HMR）
- 注意：部分 uni API 在 H5 端不可用（如 `uni.scanCode`），需做条件编译

### 微信小程序

1. **配置路径**：HBuilderX → 工具 → 设置 → 运行配置 → 微信开发者工具路径
2. **开启服务端口**：微信开发者工具 → 设置 → 安全设置 → 开启"服务端口"
3. **运行**：HBuilderX → 运行 → 运行到小程序模拟器 → 微信开发者工具

CLI 方式：
```bash
npm run dev:mp-weixin
# 然后用微信开发者工具打开 dist/dev/mp-weixin 目录
```

### App（真机/模拟器）

1. **Android 真机**：手机开启 USB 调试 → 连接电脑 → HBuilderX 运行到 Android App 基座
2. **iOS 模拟器**（仅 macOS）：运行 → 运行到 iOS 模拟器
3. **自定义基座**：运行 → 运行到手机或模拟器 → 制作自定义调试基座（包含原生插件时必需）

### 调试技巧

```js
// console.log 直接输出到 HBuilderX 控制台
console.log('调试信息:', data)

// 条件编译调试
// #ifdef APP-PLUS
console.log('App 端调试')
// #endif
```

- **H5 端**：直接使用 Chrome DevTools（F12）
- **小程序端**：使用对应开发者工具的调试面板
- **App 端**：HBuilderX 控制台 → 点击调试图标 → 打开调试窗口
  - Elements 面板查看页面结构（仅 nvue）
  - Sources 面板支持断点调试
  - Console 面板查看日志

### 启动模式配置（开发期间）

在 `pages.json` 中配置 `condition`，可直接启动到指定页面：

```json
{
  "condition": {
    "current": 0,
    "list": [
      { "name": "详情页", "path": "pages/detail/detail", "query": "id=123" },
      { "name": "用户页", "path": "pages/user/profile", "query": "uid=456" }
    ]
  }
}
```

## 打包发布

### H5 发布

```bash
npm run build:h5
# 产出目录：dist/build/h5
```

HBuilderX 中：发行 → 网站-PC Web 或手机 H5

部署注意：
- 配置 `manifest.json` → h5 → `publicPath`（部署路径前缀）
- 配置 `manifest.json` → h5 → `router.base`（路由基础路径）
- 如使用 history 模式，服务器需配置 fallback 到 index.html

### 微信小程序发布

```bash
npm run build:mp-weixin
# 产出目录：dist/build/mp-weixin
```

流程：
1. HBuilderX 发行 → 小程序-微信（或 CLI 构建）
2. 微信开发者工具打开产出目录
3. 点击"上传" → 填写版本号和描述
4. 登录微信小程序后台 → 版本管理 → 提交审核 → 审核通过后发布

优化建议：
- 使用分包 `subPackages` 减小主包体积（主包限制 2MB，总包限制 20MB）
- 开启 `treeShaking`
- 图片使用网络地址或压缩后放入

### App 发布

#### 云打包（推荐）

HBuilderX 中：发行 → 原生 App-云打包

- **Android**：配置签名证书（keystore）、包名、版本号
- **iOS**：配置 Bundle ID、证书（.p12）、描述文件（.mobileprovision）

#### 安心打包（Safe Pack）

更安全的云打包方式：
- 仅上传模块配置，不上传源码
- 本地签名，证书不上传服务器
- 第二次及以后打包更快（复用缓存）

#### 离线打包

适合需要深度原生定制的场景：
1. 下载 uni-app 离线 SDK
2. 配置 Android Studio / Xcode 原生项目
3. 集成 uni-app SDK 模块
4. 本地编译打包

### 鸿蒙 App 调试

**环境要求：** HBuilderX 4.61+、DevEco Studio 5.0.7.210+、鸿蒙 API 14+（uni-app x）

```
1. 运行项目到鸿蒙设备（真机或模拟器）
2. 点击 HBuilderX 控制台红色虫子图标 → 选择"开启调试"
3. 首次使用会提示安装鸿蒙调试插件
4. 在 .uts、.uvue、.ets 文件中设置断点（右键或双击行号）
```

**调试快捷键：** 继续 F8 | 单步跳过 F10 | 单步进入 F11 | 单步跳出 Shift+F11

**注意事项：**
- 变量显示为 ets/ArkTS 风格（UTS 编译到 ArkTS）
- 断点命中初始化代码（如 onLaunch）需先点"重启应用"
- console.log 输出对象需用 `JSON.stringify()`

**联编调试（HBuilderX 4.71+）：** 支持在 uni-app x 项目和原生鸿蒙项目中同时设断点：

```json
// .hbuilderx/launch.json
{
  "version": "1.0",
  "configurations": [
    {
      "type": "uni-app:app-harmony",
      "debugWithNativeHarmony": true,
      "nativeHarmonyProjectPath": "D:/native-harmony-project"
    }
  ]
}
```

**鸿蒙元服务调试：** HBuilderX → 运行 → 运行到小程序模拟器 → 鸿蒙元服务

详细鸿蒙开发文档见 `references/harmony-basics.md`（基础）和 `references/harmony-development.md`（核心开发）。

### 其他平台发布

```bash
npm run build:mp-alipay      # 支付宝小程序
npm run build:mp-baidu       # 百度小程序
npm run build:mp-toutiao     # 抖音小程序
npm run build:mp-qq          # QQ 小程序
```

各平台发布流程类似微信：构建 → 对应开发者工具上传 → 平台后台审核发布。

### 鸿蒙 App 发布

```
1. 授权 DCloud 为服务提供商（AGC 第三方授权链接绑定）
2. 配置发布签名证书（.p12 + .cer + .p7b，release name）
3. HBuilderX → 发行 → App-Harmony-本地打包 → 生成安装包
4. 自动上传 .app 到 DCloud 开发者中心
5. 在开发者中心完成审核提交到华为应用市场
```

**签名文件：** `.p12`（密钥库）+ `.cer`（证书）+ `.p7b`（Profile）
- 调试签名：HBuilderX 4.61+ 可视化配置，支持自动申请
- 发布签名：手动通过 AGC 申请，signingConfigs 中 name 必须为 "release"

### 鸿蒙元服务发布

```
1. 授权 DCloud（同上）
2. 配置发布签名证书
3. HBuilderX → 发行 → 鸿蒙元服务
4. 完成审核提交
```

**元服务图标要求：** 必须使用华为标准图标底板（216x216 上传开发者中心，512x512 代码中）。

详细鸿蒙发布文档见 `references/harmony-advanced.md`（调试、发布、元服务）。
