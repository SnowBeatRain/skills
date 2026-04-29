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

- 用于崩溃分析，将内存地址映射为源码位置
- HBuilderX 3.5.0+：发行 → 云打包 → 勾选"生成 iOS 符号表"
- 生成后自动下载，有效期 2 天

---

## HarmonyOS（鸿蒙）配置

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
