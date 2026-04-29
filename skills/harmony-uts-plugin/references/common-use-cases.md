# 常见 UTS 鸿蒙插件场景

## 1. 获取应用 / 包信息

适合：显示版本号、bundleName、检查渠道信息。

常用模块：`@kit.AbilityKit` 的 `bundleManager`。

封装返回：

```ts
type AppInfo = {
  bundleName: string
  versionName?: string | null
  versionCode?: number | null
}
```

注意：不要返回签名证书、敏感标识。

## 2. 打开系统设置页

适合：权限被拒绝且不再询问后，引导用户开启。

常用模块：`AbilityKit`，通过 `Want` 或 `abilityAccessCtrl.requestPermissionOnSetting`。

建议优先使用权限管理器提供的设置跳转；不要硬编码系统设置 Ability，除非官方文档确认。

## 3. 权限申请

适合：相机、位置、蓝牙、通知、麦克风。

流程：

1. `module.json5` 声明。
2. 页面说明用途。
3. 插件调用 `UTSHarmony.requestSystemPermission`。
4. 成功后再调用原生能力。
5. 拒绝时返回清晰错误。

## 4. 文件选择 / 保存

优先：`uni.chooseImage`、`uni.chooseVideo`、`uni.saveFile` 等。

需要插件的情况：

- 需要鸿蒙系统 picker 特定能力。
- 需要访问应用沙箱特殊目录。
- 需要和三方 SDK 共享文件 URI。

返回对象建议：

```ts
type PickedFile = {
  path: string
  name?: string | null
  size?: number | null
  mimeType?: string | null
}
```

## 5. 相机自定义能力

优先：简单拍照用 uni API。

需要插件的情况：

- 自定义预览。
- 连续帧分析、扫码、OCR。
- 特殊分辨率、曝光、焦距控制。

实现建议：

- `.uts` 作为 API 门面。
- `.ets` 管理 CameraKit session / ArkUI preview。
- 提供 `start`、`stop`、`takePhoto`、`release`。
- 页面卸载必须释放。

## 6. 位置能力

优先：`uni.getLocation`。

需要插件的情况：

- 鸿蒙特定定位参数。
- 连续定位 / 地理围栏 / 后台定位。
- 对接地图或运动轨迹 SDK。

接口建议：

```ts
type StartLocationOptions = {
  interval?: number | null
  accuracy?: 'low' | 'balanced' | 'high' | null
  success?: ((res: LocationResult) => void) | null
  fail?: ((err: NativeFail) => void) | null
}
```

必须提供 `stopLocation()`。

## 7. 蓝牙 / BLE

优先检查 uni 蓝牙 API 是否满足。

插件适合：

- uni API 缺失的 HarmonyOS BLE 特性。
- 厂商设备 SDK 只提供鸿蒙实现。
- 需要更细粒度扫描/连接参数。

设计：

- `openBluetoothAdapter`
- `startBluetoothDevicesDiscovery`
- `stopBluetoothDevicesDiscovery`
- `createBLEConnection`
- `closeBLEConnection`
- `writeBLECharacteristicValue`
- `onBLECharacteristicValueChange` / `off...`

注意：扫描和连接都要考虑权限、蓝牙开关、超时和释放。

## 8. NFC

适合门禁卡、标签读取、设备配网。

设计：

- `isNfcAvailable`
- `startNfcDiscovery`
- `stopNfcDiscovery`
- `readNfcTag`
- `writeNfcTag`

注意：NFC 通常强依赖真机，模拟器不可用；要返回“设备不支持/未开启”。

## 9. 传感器

适合计步、陀螺仪、方向、加速度等。

设计：订阅类 API 必须成对：

```ts
startSensorListen(options)
stopSensorListen()
```

不要把高频数据直接无限量传给页面；必要时节流。

## 10. 通知

适合本地通知、提醒、下载完成通知。

流程：权限声明 → 请求通知权限 → 发布通知 → 点击/取消处理。

注意：如果只是业务消息，优先考虑平台推送/UniPush 能力；本地通知只负责本机提醒。

## 11. 剪贴板

优先：`uni.setClipboardData` / `uni.getClipboardData`。

需要插件的情况：

- 需要鸿蒙特定 pasteboard 类型。
- 需要富文本/图片剪贴板。

注意：读取剪贴板属于隐私敏感能力，必须由用户动作触发。

## 12. 三方鸿蒙 SDK / ohpm

适合支付、登录、地图、厂商设备 SDK。

模式：

1. 在鸿蒙原生层 / ohpm 配置依赖。
2. 在 `app-harmony/index.uts` 或 `.ets` 中调用 SDK。
3. 对页面只暴露简单 API。
4. 把 SDK 错误码映射为统一错误对象。
5. 验证 HBuilderX 运行、本地打包/云打包都能解析依赖；不要只在生成工程里手工改一次。

不要让页面直接 import ohpm 包。
