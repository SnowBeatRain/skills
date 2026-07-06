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

鸿蒙应用和元服务推荐通过**华为支付**完成支付。完整流程如下：

#### 1. 商户入网

1. 登录 [华为商户平台](https://petalpay-merchant.cloud.huawei.com/merchcenter/appIds)。
2. 提交入网资料，等待审核。
3. 审核通过后完成小额打款认证、签署协议、完成开户。
4. 选择合作身份：商户身份或平台身份。

#### 2. 获取商户号与证书

- **商户号**：登录商户平台，页面右上角展示的一串数字。
- **生成商户证书**：使用 Node.js 生成 RSA 密钥对：

```js
const crypto = require('crypto')
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})
console.log('公钥:', publicKey)
console.log('私钥:', privateKey)
```

- 将公钥上传到商户平台 **证书管理 - 上传商户证书**，选择 RSA 签名方式。
- 保存私钥到业务服务器，用于参数签名。
- 保存平台返回的**证书 ID**，即 `mchAuthId`。
- **下载华为支付证书**：在商户平台 **证书管理 - 华为支付证书** 中下载，保存公钥内容。

#### 3. 关联应用

在商户平台 **产品功能 - AppID 管理** 中，确认鸿蒙应用或鸿蒙元服务已关联，并记录对应的 `appId`。

#### 4. 配置 uni-pay

编辑 `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js`：

```js
{
  "huawei": {
    // 元服务支付
    "mp": {
      "appId": "your-app-id",
      "mchId": "your-mch-id",
      "mchAuthId": "your-mch-auth-id",
      "mchPrivateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "platformPublicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
      "clientType": "mp-harmony"
    },
    // 鸿蒙应用支付
    "app": {
      "appId": "your-app-id",
      "mchId": "your-mch-id",
      "mchAuthId": "your-mch-auth-id",
      "mchPrivateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "platformPublicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
      "clientType": "app-harmony"
    }
  }
}
```

同时配置 `notifyUrl` 为 uniCloud 云函数地址。

#### 5. 配置 manifest.json

在 `manifest.json` → 鸿蒙 App 配置 → `uni-payment` 中勾选**华为支付**。

#### 6. 前端调用

```html
<!-- #ifdef APP-HARMONY || MP-HARMONY -->
<button @click="createOrder('huawei')">华为支付</button>
<!-- #endif -->
```

### 1.10 元服务签名证书

HBuilderX 4.81+ 已提供可视化签名配置，推荐直接在 `manifest.json` 的鸿蒙配置中一键配置。

如需手动配置（HBuilderX 4.81 之前）：

1. 在 DevEco Studio 中新建元服务工程，选择已注册的 AppID。
2. 点击右上角 **Project Structure**，勾选 **Automatically generate signature**。
3. 运行官方 Hello World 示例，确认环境和签名配置正确。
4. 在项目根目录创建 `harmony-mp-configs/build-profile.json5`，配置签名信息。

> 自动签名仅用于运行调试；上架发布需使用正式签名。

### 1.11 元服务 App Linking

App Linking 用于通过二维码、短信、落地页唤起元服务。

#### 前提条件

- 企业开发者账号。
- 元服务已上架。

#### 配置步骤

1. **服务端配置**：在域名根目录部署 `.well-known/applinking.json`：

```json
{
  "applinking": {
    "atomicServices": [
      { "appIdentifier": "your-atomic-service-identifier" }
    ]
  }
}
```

> 确保服务器允许公开访问 `.well-known` 路径。

2. **AGC 后台配置**：
   - 登录 AppGallery Connect。
   - 开通 App Linking 服务，配置链接规则、自定义参数。
   - 确认生成的 App Linking 链接状态为"已生效"。

3. **传递参数打开指定页面**：

```js
const value = `ascfPara=${encodeURIComponent(
  JSON.stringify({ path: '/pages/tabBar/API/API' })
)}`
// 将 value 填入 AGC 后台自定义参数，生成的链接即可扫码打开指定页面
```

生成类似 `https://hoas.drcn.agconnect.link/AlXKm` 的链接，转成二维码即可扫码唤起元服务并直达指定页面。

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
