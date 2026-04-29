# 鸿蒙进阶功能与发布

> 相关文档：`references/harmony-basics.md`（基础与快速参考）、`references/harmony-development.md`（核心开发）、`references/harmony-migration.md`（适配与迁移实战）

---

## 一、鸿蒙元服务开发（MP-HARMONY）

### 1.1 概述

鸿蒙元服务是鸿蒙 Next 上的快应用/小程序形态，仅支持鸿蒙 5.0+ 设备。

**关键限制：不支持 UTS 插件。** 使用 ASCF 技术方案，不支持 ArkTS 原生写法。

### 1.2 环境要求

```
- HBuilderX 4.51+
- DevEco Studio 5.1.1+
- API 20 模拟器（如需模拟器测试）
- AGC 注册元服务 APPID（bundleName 格式: com.atomicservice.[APPID]）
```

### 1.3 配置目录

```
harmony-mp-configs/
├── entry/src/main/module.json5    # 权限、metadata、client_id
├── build-profile.json5            # 签名配置
└── ...
```

### 1.4 Client ID 配置

```json5
// harmony-mp-configs/entry/src/main/module.json5
{
  "module": {
    "metadata": [{ "name": "client_id", "value": "your_client_id" }]
  }
}
```

### 1.5 运行

HBuilderX → 运行 → 运行到小程序模拟器 → 鸿蒙元服务

### 1.6 CLI 创建

```json
// Vue3
{ "dev:mp-harmony": "uni -p mp-harmony", "build:mp-harmony": "uni build -p mp-harmony" }

// Vue2
yarn add @dcloudio/uni-mp-harmony@2.0.2-alpha-4050720250316001
```

### 1.7 元服务打开其他应用

```html
<!-- 打开系统应用 -->
<button type="primary" open-type="launchApp"
  app-bundle-name="com.huawei.hmos.calendar"
  app-ability-name="MainAbility"
  @launchapp="onLaunchApp" @error="onError">
  打开日历
</button>

<!-- 打开同开发者应用 -->
<button open-type="launchApp"
  app-bundle-name="io.dcloud.hellouniapp.h"
  app-module-name="entry"
  app-ability-name="EntryAbility"
  :app-parameters='{from:"as"}'
  @launchapp="onLaunchApp" @error="onError">
  唤起应用
</button>
```

### 1.8 分包异步加载

```json
{
  "subPackages": [
    { "root": "packageA", "pages": [...] },
    { "root": "packageB", "pages": [], "common": true }
  ]
}
```

需配合页面样式中 `componentPlaceholder` 使用。

### 1.9 元服务支付

通过 uni-pay 配置华为支付：

```json
// uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js
{
  "huawei": {
    "mp": {
      "appId": "", "mchId": "", "mchAuthId": "",
      "mchPrivateKey": "", "platformPublicKey": "",
      "clientType": "mp-harmony"
    }
  }
}
```

页面中使用条件编译：

```html
<!-- #ifdef MP-HARMONY -->
<button @click="createOrder('huawei')">华为支付</button>
<!-- #endif -->
```

### 1.10 元服务 App Linking

仅企业开发者账号可用。需在域名根目录创建 `.well-known/applinking.json`：

```json
{
  "applinking": {
    "atomicServices": [{ "appIdentifier": "" }]
  }
}
```

---

## 二、调试

### 2.1 鸿蒙 App 调试（HBuilderX 4.61+）

```
1. 运行项目到鸿蒙设备
2. 点击 HBuilderX 控制台的红色虫子图标 → 选择"开启调试"
3. 安装鸿蒙调试插件（首次自动提示）
4. 可在 .uts、.uvue、.ets 文件设置断点
```

**调试快捷键：**
- 继续：F8
- 单步跳过：F10
- 单步进入：F11
- 单步跳出：Shift+F11

**注意事项：**
- 变量可能显示为 ets 风格（因 UTS 编译到 ArkTS）
- 断点命中初始化代码（如 App.uvue 的 onLaunch）需先点"重启应用"
- `console.log` 输出对象需用 `JSON.stringify()`

### 2.2 联编调试（HBuilderX 4.71+）

支持 uni-app x 项目和鸿蒙原生项目同时设断点调试：

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

### 2.3 UTS 调试（各平台）

| 平台 | HBuilderX 版本 | 说明 |
|------|---------------|------|
| Android | 4.0+ | uts/uvue/kt 文件调试 |
| iOS | 3.7.6+ (iOS17-) / 4.81+ (iOS17+) | Swift 模式 + JSCore 模式 |
| 鸿蒙 | 4.61+ | uts/uvue/ets 文件调试 |

---

## 三、发布

### 3.1 鸿蒙 App 发布

```
1. 授权 DCloud 为服务提供商（AGC 第三方授权）
2. 配置发布签名证书
3. HBuilderX → 发行 → App-Harmony-本地打包 → 生成安装包
4. 自动上传到 DCloud 开发者中心
5. 在开发者中心完成审核提交
```

### 3.2 元服务发布

```
1. 授权 DCloud（同上）
2. 配置发布签名
3. HBuilderX → 发行 → 鸿蒙元服务
4. 完成审核
```

### 3.3 隐私协议

两种方式：
1. 自行实现隐私弹窗
2. 华为托管隐私协议

调试模式需添加三个参数：`appgallery_privacy_hosted`、`appgallery_privacy_link_privacy_statement`、`appgallery_privacy_link_user_agreement`

---

## 四、内置模块与地图

### 4.1 地图

鸿蒙仅支持 **腾讯地图**（HBuilderX 4.26+），地图通过 WebView 加载。

```json5
// manifest.json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "maps": { "qqmap": { "key": "XXX-XXXX-XXXX" } }
      }
    }
  }
}
```

元服务仅支持 **华为地图**（免费，通过 AGC）。

### 4.2 WebView 通信

鸿蒙上 `plus` 对象不可用，使用 `WebviewContext.evalJs`：

```js
// 创建 WebviewContext
const webviewCtx = uni.createWebviewContext('web', this);

// 调用 WebView 内 JS
webviewCtx.evalJs('receiveMessage("hello")');

// WebView 通过 postMessage 向外通信
```

### 4.3 定位

系统定位已支持。精确+粗略定位权限需成对申请。

### 4.4 uniPush

4.31+ 支持，需配置 `ohos.permission.APP_TRACKING_CONSENT` 权限。
