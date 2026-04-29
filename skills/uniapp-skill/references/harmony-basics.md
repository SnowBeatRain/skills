# 鸿蒙开发基础与快速参考

官方文档：https://uniapp.dcloud.net.cn/tutorial/harmony/intro.html
UTS 文档：https://doc.dcloud.net.cn/uni-app-x/uts/

> 相关文档：`references/harmony-development.md`（核心开发）、`references/harmony-advanced.md`（进阶功能与发布）、`references/harmony-migration.md`（适配与迁移实战）

---

## 一、概述

uni-app 从 HBuilderX 4.24 起支持 HarmonyOS Next，4.27 起内置鸿蒙项目模板。支持两种形态：

| 形态 | 条件编译标识 | 目录 | 说明 |
|------|-------------|------|------|
| **鸿蒙 App** | `APP-HARMONY` | `harmony-configs/` | 完整原生应用 |
| **鸿蒙元服务** | `MP-HARMONY` | `harmony-mp-configs/` | 快应用/小程序形态 |

### 关键限制

```
- 鸿蒙 App 仅支持 Vue3，Vue2 项目需先迁移
- nvue 在鸿蒙上编译为 Web 渲染（非原生渲染），自动注入兼容样式
- plus 对象不可用，统一使用 uni.* API
- 条件编译中 APP 包含鸿蒙，但 APP-PLUS 不包含鸿蒙
- 元服务不支持 UTS 插件（使用 ASCF 技术方案，非 ArkTS）
```

### 版本兼容矩阵

| HBuilderX 版本 | 关键能力 | DevEco Studio 版本 | 鸿蒙 API |
|---------------|---------|-------------------|---------|
| 4.24+ | 基础鸿蒙支持 | 5.0.3.400+ | API 12+ |
| 4.27+ | 内置鸿蒙项目模板，无需手动打开 DevEco | 5.0.3.400+ | API 12+ |
| 4.31+ | **架构改为 JSVM**；仅 arm64；UTS 插件仍为 ArkTS | 5.0.3.800+ | API 12+ |
| 4.34+ | 鸿蒙元服务 (MP-HARMONY) | 5.0.3.800+ | API 12+ |
| 4.41+ | 热重载（uni-app）；源码映射日志 | 5.0.3.800+ | API 12+ |
| 4.51+ | 元服务 ASCF 模板更新 | 5.1.1+ | API 12+ |
| 4.61+ | **uni-app x 鸿蒙支持**；调试支持；可视化签名 | 5.0.7.100+ | API 14+ (uni-app x) |
| 4.71+ | 联编调试（uni-app x + 原生鸿蒙项目） | 5.0.7.210+ | API 14+ |
| 4.81+ | JSVM 逻辑层移至子线程；元服务热重载 | 5.1.0.849+ | API 14+ |

---

## 二、环境搭建与运行

### 2.1 环境要求

```
- HarmonyOS 开发者账号（华为开发者联盟）
- HBuilderX 4.24+（推荐最新正式版）
- DevEco Studio（版本与 HBuilderX 匹配，见上方矩阵）
- 鸿蒙 API 12+（uni-app）/ API 14+（uni-app x）
```

### 2.2 配置 DevEco 路径

HBuilderX → 工具 → 设置 → 运行配置 → `harmony.devTools.path`，指向 DevEco Studio 安装目录。

### 2.3 运行流程

```
1. 连接鸿蒙设备（USB 调试）或启动模拟器
2. HBuilderX → 运行 → 运行到手机或模拟器 → 运行到鸿蒙
3. 首次运行自动生成 harmony-configs/ 目录
4. 选择设备、缓存策略、构建模式（debug/release）
```

### 2.4 项目路径

| 模式 | 路径 |
|------|------|
| 开发 | `unpackage/dist/dev/app-harmony` |
| 构建 | `unpackage/dist/build/app-harmony` |

路径限制：不含中文/特殊字符，鸿蒙项目目录总长约 110 字符以内。

### 2.5 自定义鸿蒙项目路径（HBuilderX 4.61+）

在 `.hbuilderx/launch.json` 中配置：

```json
{
  "version": "1.0",
  "configurations": [
    {
      "type": "uni-app:app-harmony",
      "distPathDev": "D:/harmony-project-dev",
      "distPathBuild": "D:/harmony-project-build"
    }
  ]
}
```

### 2.6 构建模式

| 模式 | 特点 |
|------|------|
| **debug** | 支持断点调试，包体积较大 |
| **release** | 性能更优，无断点，无 ArkTS 热重载 |

---

## 三、项目配置

### 3.1 harmony-configs 目录结构

```
harmony-configs/
├── AppScope/
│   └── app.json5              # bundleName 等应用级配置
├── entry/
│   └── src/main/
│       ├── module.json5        # 权限、skills、metadata
│       └── resources/          # 鸿蒙资源文件
├── build-profile.json5         # 签名配置
└── oh-package.json5            # 依赖配置
```

### 3.2 Bundle Name 配置

方式一：`harmony-configs/AppScope/app.json5` → `app.bundleName`
方式二（4.31+）：`manifest.json` 中配置

### 3.3 权限配置

在 `harmony-configs/entry/src/main/module.json5` 的 `module.requestPermissions` 中配置：

```json5
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" },
      { "name": "ohos.permission.GET_NETWORK_INFO" }
    ]
  }
}
```

#### 权限分类

| 类型 | 说明 | 示例 |
|------|------|------|
| **system_grant** | 自动授权，无需用户确认 | INTERNET, VIBRATE, GET_NETWORK_INFO |
| **user_grant** | 需用户弹窗确认 | LOCATION, NOTIFICATION, CAMERA |
| **ACL/受限权限** | 需华为后台审批 | WRITE_IMAGEVIDEO, WRITE_CONTACTS, READ_PASTEBOARD |

#### 通过 UTS 插件请求运行时权限

```typescript
import { abilityAccessCtrl, Permissions } from "@kit.AbilityKit";

export const requestPermission = async () => {
  const permissions: Permissions[] = ["ohos.permission.ACCESS_BLUETOOTH"];
  let atManager = abilityAccessCtrl.createAtManager();
  const context = UTSHarmony.getUIAbilityContext();

  UTSHarmony.requestSystemPermission(
    permissions,
    (allRight, grantedList) => {
      console.log("权限授予:", allRight, grantedList);
    },
    async (doNotAskAgain: boolean, grantedList: Array<string>) => {
      if (doNotAskAgain) {
        // 用户拒绝且勾选"不再询问"，引导到设置页
        const res = await atManager.requestPermissionOnSetting(context, permissions);
      }
    }
  );
};
```

### 3.4 签名配置

#### 签名文件

| 文件 | 说明 |
|------|------|
| `.p12` | 密钥库文件 |
| `.cer` | 证书文件 |
| `.p7b` | Profile 文件 |

#### 调试签名

- HBuilderX 4.61+ 可可视化配置：运行配置 → 鸿蒙签名证书
- 支持自动申请调试证书（通过 AGC API）
- 自动生成证书存储位置：`%USERPROFILE%\.ohos\config`（Windows）/ `~/.ohos/config`（Mac）
- `.p12` 文件移动时须同时移动 `material` 目录

#### 发布签名

- 必须手动通过 AGC 申请
- `build-profile.json5` 中 `signingConfigs` 的 `name` 必须为 `"release"`

### 3.5 热重载

| 项目类型 | HBuilderX 版本 | 要求 |
|---------|---------------|------|
| uni-app | 4.41+ | DevEco 5.1.1.823+ |
| uni-app x | 4.81+ | DevEco 5.1.1.823+ |

---

## 四、条件编译速查

```js
// #ifdef APP-HARMONY
console.log("仅鸿蒙 App 编译");
// #endif

// #ifdef MP-HARMONY
console.log("仅鸿蒙元服务编译");
// #endif

// #ifdef APP
console.log("安卓、苹果、鸿蒙都会编译");
// #endif

// #ifdef APP-PLUS
console.log("仅安卓和苹果编译（鸿蒙不会编译）");
// #endif
```

**关键规则：`APP` 包含鸿蒙，`APP-PLUS` 不包含鸿蒙。**

静态资源目录：
- `static/app-harmony/` — 鸿蒙 App 专属
- `static/mp-harmony/` — 鸿蒙元服务专属

---

## 五、常见错误与排查

| 错误 | 原因/解决方案 |
|------|-------------|
| "依赖包与运行设备不兼容" | 从 oh-package.json5 中移除 `@cashier_alipay/cashiersdk` 或使用真机 |
| "运行所需的权限没有签名授权" | 移除 ACL 权限或配置调试证书 |
| "配置的 bundleName 与签名证书不符" | 确认 manifest.json 或 harmony-configs 中 bundleName 一致 |
| "签名验证失败" | 在签名 Profile 中添加设备 UUID |
| "没有签名无法安装" | 真机需配置签名 |
| "签名不一致" | 手动卸载已有应用后重装 |
| "hvigor ERROR: Tools execution failed" | Java 版本冲突，移除 PATH 中的 java 或升级 HX 4.31+ |
| 路径过长错误 | 项目路径控制在 ~77 字符内 |
| 元服务登录失败 | 必须使用 AGC 调试证书（非自动签名）；client_id 用应用级非项目级 |
| 元服务配置不生效 | 从设备设置中移除元服务后重新运行 |

---

## 六、UTS 插件开发环境

### Android UTS 开发

```
- Gradle 7.5+（9.0+ 暂不支持）
- JDK 17+（Gradle 8.0+）
- Android SDK: build-tools >= 30.0.0, platforms >= android-30
```

### iOS UTS 开发

```
- Xcode 15.2+
- 匹配的 Command Line Tools
- UTS Development Extension - iOS 插件
```

### 鸿蒙 UTS 开发

```
- DevEco Studio（见版本矩阵）
- 鸿蒙 SDK（API 12+ / 14+ for uni-app x）
- 鸿蒙调试插件
```

### UTS 编译目标

| 平台 | 编译目标 |
|------|---------|
| Android | Kotlin |
| iOS | Swift |
| 鸿蒙 | ArkTS/ETS |

**重要提示：** UTS 插件代码中的变量在调试时可能显示为编译目标语言的格式（Kotlin/Swift/ArkTS）。
