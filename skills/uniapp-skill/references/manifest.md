# manifest.json 完整参考

官方文档：https://uniapp.dcloud.net.cn/collocation/manifest.html

---

## 一、概述

`manifest.json` 是 uni-app 应用的配置文件，用于指定应用名称、图标、权限等信息。它是应用运行的基础配置。

**编辑方式：**
- **HBuilderX 可视化编辑**：双击 manifest.json → 可视化界面（推荐配置 OAuth、模块、原生插件等复杂配置）
- **源码编辑**：右键 manifest.json → 源码视图（适合精确控制所有字段）

> `manifest.json` 管理应用级配置（appid、平台设置、SDK 配置）；`pages.json` 管理页面级配置（路由、tabBar、样式）。两者分工明确，互不替代。详见 `references/pages-config.md`。

---

## 二、核心字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 应用名称 |
| `appid` | string | 是 | DCloud APPID（在 [开发者中心](https://dev.dcloud.net.cn/) 申请） |
| `description` | string | 否 | 应用描述 |
| `versionName` | string | 是 | 版本号（展示用，如 `"1.0.0"`） |
| `versionCode` | number | 是 | 内部版本号（递增整数，如 `100`） |
| `locale` | string | 否 | 默认语言（如 `"zh-Hans"`） |
| `transformPx` | boolean | 否 | 是否自动将 px 转为 rpx（默认 `true`） |

**最小配置示例：**

```json
{
  "name": "MyApp",
  "appid": "__UNI__XXXXXX",
  "description": "我的应用",
  "versionName": "1.0.0",
  "versionCode": 100
}
```

---

## 三、平台配置

### 3.1 app-plus（Android / iOS）

App 端核心配置块，管理分发、SDK、模块等：

```json
{
  "app-plus": {
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "autoclose": true,
      "waiting": true
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": ["<uses-permission android:name=\"android.permission.INTERNET\"/>"],
        "minSdkVersion": 21,
        "targetSdkVersion": 30,
        "abiFilters": ["armeabi-v7a", "arm64-v8a"]
      },
      "ios": {
        "dSYMs": false
      },
      "sdkConfigs": {
        "oauth": {},
        "push": {},
        "maps": {},
        "payment": {}
      }
    },
    "safearea": {
      "background": "#ffffff",
      "bottom": { "offset": "auto" }
    },
    "darkmode": false
  }
}
```

**常用子字段：**

| 路径 | 说明 |
|------|------|
| `distribute.android.permissions` | Android 权限列表 |
| `distribute.android.minSdkVersion` | 最低 Android SDK 版本（默认 21） |
| `distribute.android.abiFilters` | CPU 架构过滤（armeabi-v7a / arm64-v8a / x86） |
| `distribute.ios.dSYMs` | 是否生成 dSYM 调试符号文件 |
| `distribute.sdkConfigs.oauth` | 第三方登录配置（微信/QQ/Apple/华为） |
| `distribute.sdkConfigs.push` | 推送配置（uniPush） |
| `distribute.sdkConfigs.maps` | 地图 SDK 配置（高德/百度/腾讯/Google） |
| `distribute.sdkConfigs.payment` | 支付配置（微信/支付宝/Apple IAP） |
| `modules` | 启用的原生模块（蓝牙、指纹、SQLite 等） |
| `safearea` | 安全区配置 |

> 详细 Android/iOS 原生配置见 `references/native-resources.md`。

### 3.2 app-harmony（鸿蒙）

HBuilderX 4.31+ 支持，鸿蒙 App 专属配置：

```json
{
  "app-harmony": {
    "bundleName": "com.example.app",
    "icons": {
      "foreground": "static/icon-foreground.png",
      "background": "static/icon-background.png"
    },
    "splashScreens": {
      "startWindowBackground": "#FFFFFF",
      "startWindowIcon": "static/splash-icon.png"
    },
    "safearea": {
      "background": "#ffffff",
      "backgroundDark": "#1a1a1a",
      "bottom": { "offset": "none" }
    },
    "darkmode": true,
    "themeLocation": "theme.json",
    "useragent": {
      "value": "uni-app",
      "concatenate": true
    }
  }
}
```

**与 app-plus 的关键差异：**
- 图标需要 **前景 + 背景两张** 分层图片（1024x1024px），非单个图标
- 安全区在 `app-harmony.safearea` 下单独配置，支持 `backgroundDark`
- 暗黑模式在 `app-harmony.darkmode` 中单独控制
- `bundleName` 必须与 `harmony-configs/AppScope/app.json5` 中一致

> 详细鸿蒙配置见 `references/harmony-basics.md`。

### 3.3 h5

H5 端配置：

```json
{
  "h5": {
    "title": "我的应用",
    "router": {
      "mode": "hash",
      "base": "./"
    },
    "publicPath": "./",
    "devServer": {
      "https": false,
      "port": 8080,
      "proxy": {
        "/api": {
          "target": "https://api.example.com",
          "changeOrigin": true
        }
      }
    },
    "optimization": {
      "treeShaking": {
        "enable": true
      }
    },
    "darkmode": false
  }
}
```

| 字段 | 说明 |
|------|------|
| `router.mode` | `hash`（默认）或 `history`（需服务器配置） |
| `router.base` | 路由基础路径（部署到子目录时设置） |
| `publicPath` | 静态资源基础路径（CDN 或子目录） |
| `devServer` | 开发服务器配置（端口、代理、HTTPS） |

> H5 发布时务必同步配置 `publicPath` 和 `router.base`。详见 `references/debug-publish.md`。

### 3.4 mp-weixin（微信小程序）

```json
{
  "mp-weixin": {
    "appid": "wx1234567890abcdef",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "optimization": {
      "subPackages": true
    },
    "darkmode": false,
    "plugins": {}
  }
}
```

| 字段 | 说明 |
|------|------|
| `appid` | 微信小程序 APPID（微信公众平台申请） |
| `setting.urlCheck` | 是否检查安全域名（开发时可关闭） |
| `optimization.subPackages` | 启用分包优化（推荐开启） |

### 3.5 其他小程序平台

```json
{
  "mp-alipay": { "appid": "" },
  "mp-baidu": { "appid": "" },
  "mp-toutiao": { "appid": "" },
  "mp-qq": { "appid": "" },
  "mp-kuaishou": { "appid": "" },
  "mp-lark": { "appid": "" }
}
```

每个平台仅需配置对应的 `appid`，其余字段参考各平台开发文档。

---

## 四、常用子配置

### 4.1 OAuth 第三方登录

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "oauth": {
          "weixin": {
            "appid": "wx_appid",
            "appsecret": "wx_secret",
            "UniversalLinks": "https://example.com/uni-link/"
          },
          "qq": { "appid": "qq_appid" },
          "apple": {},
          "huawei": { "client_id": "huawei_client_id" }
        }
      }
    }
  }
}
```

> `appsecret` 仅服务端使用，不应出现在客户端代码中。详见 `references/app-native.md`。

### 4.2 推送配置

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "push": {
          "unipush": {}
        }
      }
    }
  }
}
```

UniPush 2.0 开箱即用，无需额外配置 SDK 参数。详见 `references/cloud-services.md`。

### 4.3 地图 SDK

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "maps": {
          "qqmap": { "key": "YOUR_TENCENT_MAP_KEY" },
          "amap": { "appkey_android": "", "appkey_ios": "" },
          "bmap": { "appkey_android": "", "appkey_ios": "" },
          "google": { "APIKey_android": "", "APIKey_ios": "" }
        }
      }
    }
  }
}
```

> 鸿蒙仅支持腾讯地图。地图服务费用和配置详见 `references/native-resources.md`。

### 4.4 支付配置

```json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "payment": {
          "weixin": { "appid": "", "UniversalLinks": "" },
          "alipay": {},
          "appleiap": {},
          "stripe": { "returnURL": "" },
          "paypal": { "returnURL": "" }
        }
      }
    }
  }
}
```

### 4.5 统计配置

```json
{
  "uniStatistics": {
    "enable": true
  }
}
```

开启后自动采集页面访问、设备信息等数据。详见 `references/cloud-services.md`。

### 4.6 渠道包

```json
{
  "channel_list": [
    { "id": "huawei", "name": "华为应用市场" },
    { "id": "xiaomi", "name": "小米应用商店" },
    { "id": "oppo", "name": "OPPO 软件商店" }
  ]
}
```

代码中获取渠道：`plus.runtime.channel`（仅 Android/iOS）。

---

## 五、环境变量

manifest.json **不直接支持** 环境变量注入。推荐通过 Vite 环境文件管理：

```bash
# .env.development
VITE_API_BASE=http://localhost:3000

# .env.production
VITE_API_BASE=https://api.example.com
```

代码中使用：

```js
const baseUrl = import.meta.env.VITE_API_BASE
```

> 环境变量以 `VITE_` 前缀才会暴露到客户端代码。CI/CD 中可通过 Secrets 注入。详见 `references/cicd.md`。

---

## 六、HBuilderX 可视化编辑器

| 可视化可编辑 | 建议直接编辑 JSON |
|-------------|-----------------|
| 基本信息（名称、APPID、版本号） | 自定义平台配置块 |
| App 模块配置（蓝牙、指纹等） | 条件编译相关配置 |
| App SDK 配置（登录、支付、推送、地图） | 精确控制字段嵌套 |
| App 图标、启动图 | 环境变量相关 |
| 各平台 APPID | 渠道列表 |

> **注意：** 可视化编辑器可能重新格式化 JSON（调整缩进、字段顺序）。混用两种编辑方式时需注意 Git diff。

---

## 七、实用模板

### 多平台完整配置

```json
{
  "name": "MyApp",
  "appid": "__UNI__XXXXXX",
  "description": "跨端应用",
  "versionName": "1.0.0",
  "versionCode": 100,
  "transformPx": false,
  "app-plus": {
    "compilerVersion": 3,
    "distribute": {
      "android": {
        "minSdkVersion": 21,
        "targetSdkVersion": 33,
        "abiFilters": ["armeabi-v7a", "arm64-v8a"]
      },
      "sdkConfigs": {
        "oauth": {
          "weixin": { "appid": "", "UniversalLinks": "" }
        },
        "push": { "unipush": {} },
        "maps": { "qqmap": { "key": "" } }
      }
    },
    "safearea": { "background": "#ffffff", "bottom": { "offset": "auto" } }
  },
  "app-harmony": {
    "bundleName": "com.example.app",
    "icons": { "foreground": "", "background": "" },
    "safearea": { "background": "#ffffff", "backgroundDark": "#1a1a1a", "bottom": { "offset": "none" } }
  },
  "h5": {
    "router": { "mode": "hash", "base": "./" },
    "publicPath": "./"
  },
  "mp-weixin": {
    "appid": "",
    "setting": { "urlCheck": false },
    "optimization": { "subPackages": true }
  },
  "uniStatistics": { "enable": true }
}
```

---

## 八、常见问题

| 问题 | 原因与解决 |
|------|-----------|
| "请重新获取 appid" | 在 [开发者中心](https://dev.dcloud.net.cn/) 注册并获取 APPID |
| 平台配置不生效 | 检查字段嵌套层级是否正确（如 `app-plus.distribute.sdkConfigs`） |
| OAuth 开发调试报错 | 需要自定义调试基座（标准基座不含第三方 SDK） |
| 地图不显示 | 检查 key 配置和域名白名单（鸿蒙无需白名单） |
| 鸿蒙 bundleName 不匹配 | `manifest.json`、`harmony-configs/AppScope/app.json5`、AGC 后台三处必须一致 |
| H5 发布后页面空白 | 检查 `publicPath` 和 `router.base` 是否匹配部署路径 |
| 小程序包体积超限 | 开启 `optimization.subPackages`，将非首屏页面移入分包 |
| versionCode 必须递增 | 每次发版需手动递增，否则应用商店拒绝上传 |

---

## 九、相关文档

| 配置领域 | 参考文件 |
|----------|---------|
| 页面路由、tabBar、分包 | `references/pages-config.md` |
| Android/iOS 原生权限与资源 | `references/native-resources.md` |
| 鸿蒙项目配置与签名 | `references/harmony-basics.md` |
| 登录/支付/推送 SDK 集成 | `references/app-native.md` |
| uniCloud / UniPush / 统计 | `references/cloud-services.md` |
| 环境变量与 Vite 配置 | `references/cicd.md` |
| 条件编译与平台差异 | `references/conditional-compilation.md` |
| 调试与发布流程 | `references/debug-publish.md` |
