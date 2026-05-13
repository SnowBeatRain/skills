# DevEco Studio 6.1 迁移指南

> 适用：从 DevEco 5.x 升级到 DevEco 6.1.0+，配合 HarmonyOS API 23 开发。

官方迁移文档：https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-migration-V5

---

## 一、版本对应关系

| HBuilderX 版本 | DevEco Studio | HarmonyOS API | 关键变化 |
|---------------|---------------|---------------|---------|
| 4.81+ | 5.1.0.x | API 14 | JSVM 子线程优化 |
| 5.0+ | 6.0.0.x | API 22 | DevEco 架构升级 |
| 5.1+ | 6.1.0+ | API 23 | 全套 Release 版本 |

**重要：** DevEco 6.1.0 Release 与 HarmonyOS 6.1.0 于 2026 年 4 月同步发布，标志 API 23 开发套件正式可用。

---

## 二、迁移前准备

### 2.1 检查现有项目兼容性

```bash
# 检查当前项目 API Level
# 在 harmony-configs/AppScope/app.json5 中查看
{
  "app": {
    "targetAPIVersion": 14  // 当前目标版本
  }
}
```

### 2.2 备份项目

```bash
# 备份 harmony-configs 目录
cp -r harmony-configs harmony-configs.backup

# 备份 oh-package.json5
cp oh-package.json5 oh-package.json5.backup
```

### 2.3 环境要求

```
- DevEco Studio 6.1.0+
- HarmonyOS SDK API 23
- Node.js 18+（DevEco 6.1 内置要求）
- JDK 17+（鸿蒙开发）
```

---

## 三、DevEco 6.1 主要变化

### 3.1 IDE 层面

| 变化项 | 说明 |
|-------|------|
| **工程结构优化** | `build-profile.json5` 配置项调整 |
| ** hvigor 版本** | 升级到 4.x，构建性能提升 |
| **模拟器改进** | 支持 API 23 特性模拟 |
| **预览器增强** | 实时预览性能优化 |

### 3.2 SDK 层面（API 23）

| Kit | 主要更新 |
|-----|---------|
| **ArkUI** | 新增组件、动画能力增强 |
| **ArkData** | RDB 性能优化、新查询接口 |
| **Network** | HTTP/3 支持、WebSocket 增强 |
| **Security** | 新加密算法、安全存储增强 |
| **AI** | 端侧 AI 能力扩展 |

### 3.3 构建系统

```json5
// build-profile.json5 新增配置项示例
{
  "app": {
    "signingConfigs": [],
    "compileSdkVersion": 23,  // 新增：编译 SDK 版本
    "compatibleSdkVersion": 14,  // 最低兼容版本
    "products": [
      {
        "name": "default",
        "signingConfig": "default"
      }
    ]
  }
}
```

---

## 四、迁移步骤

### 4.1 安装 DevEco 6.1

1. 下载 DevEco Studio 6.1.0+
2. 安装时选择覆盖旧版本或并行安装
3. 首次启动自动下载 API 23 SDK

### 4.2 更新项目配置

#### 更新 compileSdkVersion

```json5
// build-profile.json5
{
  "app": {
    "compileSdkVersion": 23,
    "compatibleSdkVersion": 14  // 保持向后兼容
  }
}
```

#### 更新依赖版本

```json5
// oh-package.json5
{
  "dependencies": {
    "@kit.ArkUI": "23.0.0",
    "@kit.ArkData": "23.0.0"
    // 其他 kit 按需更新
  }
}
```

### 4.3 处理 API 变更

#### 已废弃 API 替换

```typescript
// 旧版本（API 14-22）
import { deprecatedAPI } from '@kit.ExampleKit';

// 新版本（API 23）
import { newAPI } from '@kit.ExampleKit';
// 或使用兼容层
import { compatAPI } from '@kit.ExampleKit';
```

#### 新增权限声明

```json5
// module.json5
{
  "module": {
    "requestPermissions": [
      // API 23 新增权限示例
      { "name": "ohos.permission.NEW_API23_PERMISSION" }
    ]
  }
}
```

### 4.4 UTS 插件适配

#### 检查插件兼容性

```typescript
// 在 UTS 插件中检查 API 版本
import { deviceInfo } from '@kit.BasicServicesKit';

const apiVersion = deviceInfo.osFullName;
if (apiVersion >= '6.1.0') {
  // 使用 API 23 新能力
} else {
  // 降级到兼容实现
}
```

#### 更新插件配置

```json
// package.json
{
  "uni_modules": {
    "uni-ext-api": {
      "uni": {
        "yourAPI": {
          "app": {
            "arkts": true,
            "minVersion": "4.61"  // 更新最低版本要求
          }
        }
      }
    }
  }
}
```

---

## 五、常见迁移问题

### 5.1 构建失败

| 错误信息 | 解决方案 |
|---------|---------|
| `hvigor version mismatch` | 更新 `hvigor/hvigor-config.json5` 版本 |
| `SDK not found` | 在 DevEco 中下载 API 23 SDK |
| `dependency resolution failed` | 检查 oh-package.json5 依赖版本 |

### 5.2 运行时错误

| 错误信息 | 解决方案 |
|---------|---------|
| `API not supported` | 检查设备 API Level，添加版本判断 |
| `Permission denied` | API 23 部分权限申请流程变更 |
| `Native crash` | 检查 UTS 插件 ArkTS 代码兼容性 |

### 5.3 调试问题

```
问题：DevEco 6.1 断点不生效
解决：检查 build-mode 是否为 debug，清理缓存后重新构建

问题：日志无法显示
解决：DevEco 6.1 日志过滤器默认更严格，调整过滤级别
```

---

## 六、兼容性策略

### 6.1 保持向后兼容

```typescript
// 推荐：使用条件编译隔离新特性
// #ifdef APP-HARMONY
if (UTSHarmony.getApiVersion() >= 23) {
  // API 23 新能力
} else {
  // 兼容实现
}
// #endif
```

### 6.2 多版本支持

```json5
// build-profile.json5 支持多产物配置
{
  "app": {
    "products": [
      {
        "name": "api23",
        "compileSdkVersion": 23
      },
      {
        "name": "api14",
        "compileSdkVersion": 14
      }
    ]
  }
}
```

---

## 七、迁移检查清单

- [ ] DevEco Studio 已升级到 6.1.0+
- [ ] HarmonyOS SDK API 23 已下载
- [ ] 项目 `build-profile.json5` 已更新 `compileSdkVersion`
- [ ] `oh-package.json5` 依赖版本已更新
- [ ] 已废弃 API 已替换
- [ ] 新增权限已在 `module.json5` 声明
- [ ] UTS 插件已适配 API 23
- [ ] 真机测试通过（API 23 设备）
- [ ] 向后兼容测试通过（API 14-22 设备）

---

## 八、参考资源

- [DevEco Studio Release Notes](https://developer.huawei.com/consumer/cn/doc/harmonyos-release-V5/)
- [HarmonyOS API 23 变更日志](https://developer.huawei.com/consumer/cn/doc/harmonyos-releases-V5/)
- [API 迁移指南](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/api-diff-V5)
- [UTS 插件开发文档](https://doc.dcloud.net.cn/uni-app-x/uts/)
