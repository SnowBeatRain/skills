# 原生资源与平台配置参考

## Android 原生资源

### AndroidManifest.xml

在项目根目录创建 `nativeResources/android/AndroidManifest.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">

  <!-- 权限声明 -->
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.BLUETOOTH" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
  <uses-permission android:name="android.permission.READ_CONTACTS" />

  <application>
    <!-- 自定义 meta-data -->
    <meta-data android:name="CUSTOM_KEY" android:value="custom_value" />
  </application>
</manifest>
```

### 默认自动包含的权限

- `INTERNET`、`READ/WRITE_EXTERNAL_STORAGE`、`READ_PHONE_STATE`
- `ACCESS_NETWORK_STATE`、`ACCESS_WIFI_STATE`、`INSTALL_PACKAGES`
- 按模块使用自动追加更多权限

### 原生资源目录

```
nativeResources/
└─ android/
   ├─ AndroidManifest.xml    权限/组件配置
   ├─ assets/                原生 assets（需 UTS 插件访问）
   ├─ res/                   原生 res（布局/图片/XML）
   │  └─ xml/
   │     └─ network_security_config.xml
   └─ manifestPlaceholders.json   Gradle 占位符
```

### ABI 过滤器（CPU 架构）

```json
// manifest.json
{
  "app-plus": {
    "distribute": {
      "android": {
        "abiFilters": ["armeabi-v7a", "arm64-v8a"]
      }
    }
  }
}
```

| ABI | 说明 | 推荐 |
|-----|------|------|
| `armeabi-v7a` | 32 位 ARM（90% 兼容） | 必选 |
| `arm64-v8a` | 64 位 ARM（新设备） | 推荐，Google Play 必须 |
| `x86` | 平板/模拟器 | 仅调试模拟器需要 |

### URL Scheme

```json
// manifest.json
{
  "app-plus": {
    "distribute": {
      "android": {
        "schemes": "myapp,myapp2"
      }
    }
  }
}
```

```js
// 外部唤起：<a href="myapp://path?key=value">打开App</a>
// App 内获取启动参数
plus.runtime.arguments  // 在 onShow 中获取
```

### minSdkVersion

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "minSdkVersion": 21
      }
    }
  }
}
```

| API Level | Android 版本 | 说明 |
|-----------|-------------|------|
| 19 | 4.4 | 默认最低 |
| 21 | 5.0 | 推荐最低 |
| 26 | 8.0 | 通知渠道必需 |
| 30 | 11 | 存储权限变更 |
| 33 | 13 | 通知权限变更 |

> 注意：minSdkVersion 只能升不能降（否则已安装用户无法更新）

### 隐私合规弹窗

项目根目录创建 `androidPrivacy.json`：

```json
{
  "version": "1",
  "prompt": "template",
  "title": "用户协议和隐私政策",
  "message": "请阅读<a href=\"https://example.com/agreement\">《用户协议》</a>和<a href=\"https://example.com/privacy\">《隐私政策》</a>",
  "buttonAccept": "同意并继续",
  "buttonRefuse": "不同意",
  "second": {
    "title": "温馨提示",
    "message": "拒绝后将无法使用完整功能",
    "buttonAccept": "同意",
    "buttonRefuse": "退出应用"
  }
}
```

### 渠道包

```json
// manifest.json 根节点
{
  "channel_list": [
    { "id": "google", "name": "Google Play" },
    { "id": "huawei", "name": "华为" },
    { "id": "xiaomi", "name": "小米" }
  ]
}
```

```js
// 运行时获取当前渠道
const channel = plus.runtime.channel
```

### 安全加固

- DCloud 开发者中心 → uni 安全加固 → 上传 APK
- 加固后需用**相同证书**重新签名
- 功能：代码加密、防篡改、防重打包
- 测试版免费（15 天有效），正式版 600 元/次

### Android 16KB 页面大小

自 2025 年 11 月 1 日起，提交到 Google Play 且以 Android 15（API 35+）为目标平台的应用必须支持 16 KB 页面大小。

- **HBuilderX 4.81+** 已适配 16 KB。
- 适配后最低支持版本由 Android 4.4（API 19）提升到 **Android 5.0（API 21）**；如需兼容 Android 4.4，请继续使用 HBuilderX 4.76。

#### 提交 Google Play 时需规避的模块

以下模块/SDK 尚未适配 16 KB，若应用目标为 Google Play，请避免勾选：

| 模块 | 说明 |
|------|------|
| 国内广告渠道（穿山甲、优量汇、快手等） | 仅国内环境使用 |
| `applovin`、`pangle(海外穿山甲)` | 海外广告渠道未适配 |
| `uni-push` 中的卓信 ID SDK | 只勾选 Google FCM 推送即可规避 |
| `uni实人认证` | 仅国内环境使用 |
| 友盟统计 | SDK 版本较旧，无更新计划 |
| OAID | 默认在 Google Play 渠道包中不包含 |

> 高德地图在 HBuilderX 5.0+ 已更新 Google Play 渠道 SDK 版本，支持 16 KB。

### X5 内核（腾讯 TBS）

X5 内核用于拉齐低端 Android 设备的 WebView 能力，解决字体、CSS 兼容性、视频格式等问题。

#### 启用方式

在 `manifest.json` → App 模块配置 → 勾选 **Android X5 Webview(腾讯 TBS)**。

```json
// manifest.json
{
  "app-plus": {
    "webView": {
      "x5": {
        "timeOut": 3000,
        "showTipsWithoutWifi": true,
        "allowDownloadWithoutWifi": false
      }
    }
  }
}
```

#### 注意事项

- **不能提交 Google Play**：X5 使用动态热更新加载内核，违反 Google Play 政策。
- 不支持 x86，建议 CPU 类型配置 `armeabi-v7a`、`arm64-v8a`。
- 首次安装可能未下载完成，需杀进程重启后才生效。
- X5 内核存在自更新机制，不同版本可能带来兼容性问题。
- 云打包/APK 集成后才可通过 wgt 升级；否则需整包升级。

---

## iOS 原生资源

### Info.plist

项目根目录创建 `nativeResources/ios/Info.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- 隐私权限描述 -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>需要访问相册</string>
  <key>NSCameraUsageDescription</key>
  <string>需要使用相机</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>需要使用麦克风</string>
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>需要获取位置信息</string>
  <key>NSBluetoothPeripheralUsageDescription</key>
  <string>需要使用蓝牙</string>

  <!-- URL Scheme -->
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>myapp</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

### Entitlements（能力配置）

创建 `nativeResources/ios/UniApp.entitlements`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Universal Links -->
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:example.com</string>
  </array>

  <!-- Apple Sign In -->
  <key>com.apple.developer.applesignin</key>
  <array>
    <string>Default</string>
  </array>
</dict>
</plist>
```

### Bundle Resources

```
nativeResources/
└─ ios/
   ├─ Info.plist              隐私/URL Scheme/方向配置
   ├─ UniApp.entitlements     能力配置（Universal Links 等）
   ├─ Resources/              Bundle 资源文件
   ├─ PrivacyInfo.xcprivacy   隐私清单
   └─ Watch/                  Apple Watch App（.app 文件）
```

### dSYM 符号表

dSYM 文件存储着 iOS 应用的源码文件名、函数名、行号与内存地址的映射关系，是线上崩溃分析的关键。

#### 生成方式

1. **HBuilderX 云端打包**：
   - 打开 `manifest.json` → App 常用其它设置 → 勾选"生成 iOS 符号表（dsym）文件"。
   - 提交云打包后，HBuilderX 控制台会输出 dsym 文件下载地址。
   - 下载文件为 zip 格式，解压后获得 `.dSYM` 文件。

2. **Xcode 本地打包**：
   - 发布生成的 `.xcarchive` 文件中默认包含 `xxxx.app.dSYM`。

#### 使用场景

- 通过 Xcode → Organizer → Devices and Simulators → View Device Logs，导出 crash 文件。
- 使用崩溃分析平台（Firebase Crashlytics、Bugly 等）时，上传 dSYM 文件以解析源码堆栈。

#### 注意事项

- 生成 dSYM 会消耗云端打包 CDN 资源，需单独计费。
- 下载地址有效期为 **2 天**，过期自动删除，生成后请及时备份。
- 每次发布新版本都应保留对应版本的 dSYM 文件。

### 前提条件

- HBuilderX 4.27+
- 仅支持 Vue3 项目
- UTS 插件需使用 ArkTS

### URL Scheme 配置

```json
// module.json5 中配置 Deep Linking
{
  "skills": [{
    "actions": ["ohos.want.action.viewData"],
    "uris": [{
      "scheme": "myapp",
      "host": "router",
      "path": "detail"
    }]
  }]
}
```

### App Linking（域名验证深链）

需部署 `.well-known/applinking.json` 到域名服务器，配合 AGC 控制台验证。

### 原生 API 调用（UTS 插件）

```
uni_modules/
└─ my-plugin/
   ├─ package.json            { "arkts": true }
   ├─ utssdk/
   │  └─ app-harmony/
   │     └─ index.uts         ArkTS 实现代码
   └─ interface.uts           接口定义
```

---

## 地图服务配置

| 服务商 | 坐标系 | 费用 | 平台 |
|--------|--------|------|------|
| 高德地图 | GCJ02 | 商用 5 万/年 | App/小程序 |
| 百度地图 | BD09 | 商用 5 万/年 | App/小程序 |
| 腾讯地图 | GCJ02 | 商用 5 万/年 | App/小程序/鸿蒙 |
| Google Maps | WGS84 | 按调用付费 | App（海外） |

```json
// manifest.json 定位配置
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "geolocation": {
          "amap": {
            "appkey_android": "xxx",
            "appkey_ios": "xxx"
          }
        },
        "maps": {
          "amap": { "appkey_android": "xxx", "appkey_ios": "xxx" }
        }
      }
    }
  }
}
```

```json
// H5 端地图配置（manifest.json → h5）
{
  "h5": {
    "sdkConfigs": {
      "maps": {
        "qqmap": {
          "key": "你的腾讯地图key"
        }
      }
    }
  }
}
```

### 地图组件使用

```vue
<template>
  <map
    :latitude="location.lat"
    :longitude="location.lng"
    :markers="markers"
    :scale="14"
    show-location
    @markertap="onMarkerTap"
    @regionchange="onRegionChange"
    style="width: 100%; height: 300px;"
  />
</template>

<script setup>
import { ref } from 'vue'

const location = ref({ lat: 39.908, lng: 116.397 })
const markers = ref([
  {
    id: 1,
    latitude: 39.908,
    longitude: 116.397,
    title: '天安门',
    iconPath: '/static/marker.png',
    width: 30,
    height: 30,
    callout: { content: '天安门广场', display: 'ALWAYS', borderRadius: 4, padding: 8 }
  }
])

const onMarkerTap = (e) => {
  console.log('点击标记:', e.markerId)
}
</script>
```

### 平台差异注意

| 平台 | 底层地图 SDK | 注意事项 |
|------|-------------|---------|
| App-Android | 高德地图 | 需在高德开放平台申请 key，配置 SHA1 |
| App-iOS | 高德地图 | 需在高德开放平台申请 key，配置 Bundle ID |
| 微信小程序 | 腾讯地图 | 自动使用，无需额外配置 key |
| H5 | 腾讯地图/高德 | 需配置 JS API key，注意域名白名单 |

> 系统定位免费但功能有限：WGS84 坐标、Android 需 GMS、无地址解析

---

## 微信小程序插件

```json
// manifest.json
{
  "mp-weixin": {
    "plugins": {
      "myPlugin": {
        "version": "1.0.0",
        "provider": "wx插件appid"
      }
    }
  }
}
```

```json
// pages.json 中使用插件组件
{
  "pages": [{
    "path": "pages/index/index",
    "style": {
      "usingComponents": {
        "plugin-comp": "plugin://myPlugin/componentName"
      }
    }
  }]
}
```

支持平台：微信、支付宝（含 export）、百度、QQ、京东小程序。

---

## CORS 跨域处理（仅 H5）

App 和小程序**不存在**跨域问题，只有 H5 需要处理。

### 解决方案

1. **同域部署**：H5 页面与 API 同域名
2. **后端 CORS 头**：`Access-Control-Allow-Origin: *`
3. **云函数代理**：uniCloud 云函数转发请求（推荐）

### 开发调试

1. HBuilderX 内置浏览器（自动跳过 CORS）
2. Vite 代理：`vite.config.js` → `server.proxy`
3. 浏览器 CORS 扩展（仅简单请求有效）

---

## App 上架与合规

### Google Play 上架要点

#### 1. 必须适配 Android 11（API 30+）

在 `manifest.json` → App 常用其它设置中，将 `targetSdkVersion` 设置为 **30 或更高**。

#### 2. 不能包含安装应用权限

在 App 权限配置中**不要勾选**：

- `android.permission.INSTALL_PACKAGES`
- `android.permission.REQUEST_INSTALL_PACKAGES`

#### 3. 不要使用以下模块/SDK

| 模块 | 原因 |
|------|------|
| QQ 登录/分享 | 未安装 QQ 时会引导下载 APK，违反 Google Play 政策 |
| 国内增强广告 SDK（穿山甲、优量汇、快手等） | 广告落地页可能引导下载 APK |
| X5 内核 | 使用动态热更新 |
| 未适配 16 KB 的模块 | 2025-11-01 起强制要求 |

#### 4. 使用 Google Play（AAB）渠道包

云端打包时勾选 **Google Play(AAB)**，输出 AAB 格式上传到 Google Play Console。

#### 5. 避免动态加载代码

应用内不能直接下载 APK 安装，也不能使用热更新加载可执行代码。

---

### App Store 上架要点

1. **uni-app 不是 H5 套壳**：前端代码在本地 IPA 包内运行，属于 C/S 架构，可正常上架。
2. **避免体验不佳**：不要做成简单网页封装；应提供原生级交互和精美 UI。
3. **避免相似度过高**：不要使用通用模板直接上架；如被 4.3 拒绝，需申诉说明独特价值。
4. **注意 IDFA 使用**：如使用广告标识，需在隐私政策中披露，并在 App Store 后台正确勾选。
5. **移除 UIWebView**：iOS 已废弃 UIWebView，确保使用 WKWebView。

---

### Android 国内市场上架合规

#### 隐私协议自查清单

1. 使用 **HBuilderX 3.2.15+** 重新打包。
2. 配置 `androidPrivacy.json` 隐私弹窗，`prompt` 必须为 `template`。
3. 《隐私政策》中必须披露：
   - 基于 DCloud uni-app 开发
   - 收集设备唯一识别码（IMEI/Android ID/DEVICE_ID/IDFA/IMSI）用于统计分析
   - 集成的第三方 SDK 及其隐私协议链接
4. 用户点击"同意"前，App 和 SDK 不得初始化或收集任何用户信息。
5. 权限申请遵循最小必要原则：无对应功能不申请权限；用户拒绝后不得强制退出。

#### 常见拒审原因与处理

| 拒审原因 | 处理方案 |
|----------|----------|
| 强制/频繁/过度索取权限 | 按功能申请权限；用户拒绝后不重复弹窗；不在 `onShow` 中触发权限申请 |
| 隐私政策前获取用户信息 | 升级 HBuilderX；使用 template 弹窗；检查三方 SDK/原生插件合规 |
| 应用存在获取软件安装列表 | 升级 HBuilderX 3.2.15+；补充隐私协议说明 |
| 集成了广告但被检测未声明 | 去除误勾选的广告模块，或在隐私协议中补充广告 SDK 说明 |
| 华为市场仍检测旧版本 | 联系华为应用市场技术支持，要求重新检测 |

---

### 域名与 App 备案

#### 需要域名备案的场景

- 云函数绑定自定义域名
- 发布 H5 站点
- App 备案（填写后端服务器域名）
- 开通扩展存储

#### uniCloud 域名备案

- 已有备案域名：直接解析到 uniCloud 空间。
- 新注册域名：
  - 阿里云/支付宝云空间：可通过支付宝云获取[备案码](https://doc.dcloud.net.cn/uniCloud/price.html#备案码)，在阿里云备案系统完成备案。
  - 腾讯云空间：需购买一台腾讯云服务器用于备案。

#### App 备案流程

1. 先完成**域名备案**。
2. 前往云厂商（阿里云/腾讯云/华为云）App 备案入口。
3. 填写 App 信息、备案码、后端域名（与 App 主体一致）。
4. 提交审核。

#### 小程序备案

小程序备案在各自平台管理控制台完成，通常无需域名和固定 IP。

---

### 上架前检查清单

- [ ] targetSdkVersion 符合目标商店要求（Google Play ≥ 30）
- [ ] 已移除不必要的敏感权限和安装权限
- [ ] 已配置 `androidPrivacy.json` 隐私弹窗
- [ ] 《隐私政策》已补充 DCloud 及第三方 SDK 披露
- [ ] 已生成并备份 iOS dSYM 文件
- [ ] 已选择正确的渠道包（Google Play 用 AAB）
- [ ] 域名已完成 ICP 备案
- [ ] 已完成 App 备案（国内上架）
- [ ] 已完成应用加固（国内部分市场要求）
