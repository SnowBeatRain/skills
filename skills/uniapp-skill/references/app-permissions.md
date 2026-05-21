# App 权限判断与系统服务检测

> 适用范围：传统 uni-app App 端（`APP-PLUS` 的 Android/iOS）与鸿蒙 App（`APP-HARMONY`）。H5、小程序、鸿蒙元服务（`MP-HARMONY`）的权限模型不同，应优先按各宿主平台官方 API 处理。

## 1. 核心原则

1. **权限声明不等于已授权**：Android 需在 `AndroidManifest.xml` / `manifest.json` 声明，iOS 需在 `Info.plist` 写用途描述，鸿蒙需在 `module.json5` 的 `requestPermissions` 声明；运行时仍可能需要用户授权。
2. **权限授权状态与系统服务开关是两件事**：例如定位权限已允许，但系统定位服务关闭，仍无法定位。
3. **优先用 uni API 做状态快照**：`uni.getAppAuthorizeSetting()` 查看 App 授权状态，`uni.getSystemSetting()` 查看定位、蓝牙、Wi-Fi 等系统开关。
4. **平台差异必须条件编译隔离**：Android/iOS 的 Native.js 写法只放在 `#ifdef APP-PLUS`；鸿蒙用 `#ifdef APP-HARMONY`，不要在鸿蒙里使用 `plus.android` / `plus.ios`。
5. **拒绝后的 UX 要明确**：用户首次拒绝可再次触发申请；永久拒绝/不再询问时，应解释原因并引导到系统设置页。

## 2. API 能力速查

| 能力 | API / 类 | 平台 | 用途 |
|---|---|---|---|
| 应用授权状态 | `uni.getAppAuthorizeSetting()` | App / 小程序等，按平台支持 | 获取相机、相册、定位、麦克风、通知等授权状态 |
| 系统服务开关 | `uni.getSystemSetting()` | App / 小程序等，按平台支持 | 判断定位、蓝牙、Wi-Fi 等系统开关 |
| Android 权限申请 | `plus.android.requestPermissions()` | `APP-PLUS` Android | 申请运行时权限 |
| Android 权限检查 | `Activity.checkSelfPermission()` | `APP-PLUS` Android | 判断单个权限是否已授权 |
| Android 设置页 | `Intent(Settings...)` | `APP-PLUS` Android | 打开应用详情、定位、蓝牙、通知设置 |
| iOS 权限状态 | `plus.ios.importClass(...)` | `APP-PLUS` iOS | 通过原生类读取授权状态 |
| iOS 设置页 | `UIApplicationOpenSettingsURLString` | `APP-PLUS` iOS | 打开当前 App 设置页 |
| 鸿蒙权限声明 | `module.requestPermissions` | `APP-HARMONY` | 声明 system_grant / user_grant / ACL 权限 |
| 鸿蒙运行时权限 | `UTSHarmony.requestSystemPermission()` / `abilityAccessCtrl.AtManager.requestPermissionsFromUser()` | `APP-HARMONY` UTS 插件 | 请求用户授权并处理“不再询问” |
| 鸿蒙设置页授权 | `abilityAccessCtrl.createAtManager().requestPermissionOnSetting()` | `APP-HARMONY` UTS 插件 | 引导到权限设置页补授权 |

## 3. 推荐返回结构

不要只返回 `true/false`。业务通常需要区分“未申请”“已拒绝”“需要打开设置”“系统服务关闭”。推荐统一返回：

```js
{
  authorized: false,
  status: 'denied',          // authorized | notDetermined | denied | deniedAlways | restricted | limited | unavailable
  needRequest: false,
  needOpenSetting: true,
  serviceEnabled: true,
  message: '请在系统设置中允许相机权限'
}
```

## 4. 跨端入口封装示例

页面层只调用一个入口，平台差异放到工具函数内部：

```js
// utils/app-permission.js
export async function checkAppPermission(type, options = {}) {
  const defaultResult = {
    authorized: false,
    status: 'unavailable',
    needRequest: false,
    needOpenSetting: false,
    serviceEnabled: true,
    message: ''
  }

  // #ifdef APP-PLUS
  const { platform } = uni.getSystemInfoSync()
  if (platform === 'android') return checkAndroidPermission(type, options)
  if (platform === 'ios') return checkIosPermission(type, options)
  return { ...defaultResult, message: `Unsupported APP-PLUS platform: ${platform}` }
  // #endif

  // #ifdef APP-HARMONY
  return checkHarmonyPermission(type, options)
  // #endif

  // #ifndef APP
  return { ...defaultResult, message: '当前平台不支持 App 原生权限判断' }
  // #endif
}
```

> 注意：上例中的 `checkAndroidPermission`、`checkIosPermission`、`checkHarmonyPermission` 分别见下文。真实项目可按需拆到 `utils/permission.android.js`、`utils/permission.ios.js`、UTS 插件中。

## 5. Android：权限判断、申请与设置页

### 5.1 权限映射

```js
const ANDROID_PERMISSIONS = {
  camera: 'android.permission.CAMERA',
  microphone: 'android.permission.RECORD_AUDIO',
  location: 'android.permission.ACCESS_FINE_LOCATION',
  coarseLocation: 'android.permission.ACCESS_COARSE_LOCATION',
  bluetooth: 'android.permission.BLUETOOTH_CONNECT', // Android 12+；旧版还涉及 BLUETOOTH / BLUETOOTH_ADMIN
  notification: 'android.permission.POST_NOTIFICATIONS' // Android 13+
}
```

### 5.2 检查与申请

```js
function getAndroidPermissionStatus(permission) {
  const main = plus.android.runtimeMainActivity()
  const PackageManager = plus.android.importClass('android.content.pm.PackageManager')
  if (!main.checkSelfPermission) return 'authorized' // Android 6 以下安装时授权
  return main.checkSelfPermission(permission) === PackageManager.PERMISSION_GRANTED
    ? 'authorized'
    : 'denied'
}

function requestAndroidPermissions(permissions) {
  return new Promise((resolve) => {
    plus.android.requestPermissions(
      permissions,
      (res) => {
        const granted = res.granted || []
        const deniedPresent = res.deniedPresent || []
        const deniedAlways = res.deniedAlways || []
        resolve({ granted, deniedPresent, deniedAlways })
      },
      (err) => resolve({ granted: [], deniedPresent: permissions, deniedAlways: [], err })
    )
  })
}

async function checkAndroidPermission(type, options = {}) {
  const permission = ANDROID_PERMISSIONS[type]
  if (!permission) {
    return { authorized: false, status: 'unavailable', needRequest: false, needOpenSetting: false, serviceEnabled: true, message: `未知权限类型: ${type}` }
  }

  const serviceEnabled = checkAndroidServiceEnabled(type)
  let status = getAndroidPermissionStatus(permission)
  if (status === 'authorized') {
    return { authorized: true, status, needRequest: false, needOpenSetting: false, serviceEnabled, message: '' }
  }

  if (!options.request) {
    return { authorized: false, status, needRequest: true, needOpenSetting: false, serviceEnabled, message: '权限未授权' }
  }

  const res = await requestAndroidPermissions([permission])
  if (res.granted.includes(permission)) {
    return { authorized: true, status: 'authorized', needRequest: false, needOpenSetting: false, serviceEnabled, message: '' }
  }

  const deniedAlways = res.deniedAlways.includes(permission)
  return {
    authorized: false,
    status: deniedAlways ? 'deniedAlways' : 'denied',
    needRequest: !deniedAlways,
    needOpenSetting: deniedAlways,
    serviceEnabled,
    message: deniedAlways ? '权限已被永久拒绝，请到系统设置中开启' : '用户拒绝授权'
  }
}
```

### 5.3 系统服务检测与设置页跳转

```js
function checkAndroidServiceEnabled(type) {
  const system = uni.getSystemSetting?.() || {}
  if (type === 'location') return system.locationEnabled !== false
  if (type === 'bluetooth') return system.bluetoothEnabled !== false
  return true
}

function openAndroidAppSetting() {
  const main = plus.android.runtimeMainActivity()
  const Intent = plus.android.importClass('android.content.Intent')
  const Settings = plus.android.importClass('android.provider.Settings')
  const Uri = plus.android.importClass('android.net.Uri')
  const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
  intent.setData(Uri.parse('package:' + main.getPackageName()))
  main.startActivity(intent)
}

function openAndroidLocationSetting() {
  const main = plus.android.runtimeMainActivity()
  const Intent = plus.android.importClass('android.content.Intent')
  const Settings = plus.android.importClass('android.provider.Settings')
  main.startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
}

function openAndroidBluetoothSetting() {
  const main = plus.android.runtimeMainActivity()
  const Intent = plus.android.importClass('android.content.Intent')
  const Settings = plus.android.importClass('android.provider.Settings')
  main.startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
}
```

## 6. iOS：按权限类型分别判断

iOS 没有 Android 式统一权限申请 API。首次申请通常由相机、定位、录音等能力调用触发；一旦用户拒绝，通常只能跳系统设置页。

```js
function checkIosPermission(type) {
  if (type === 'camera') return checkIosCamera()
  if (type === 'microphone') return checkIosMicrophone()
  if (type === 'album') return checkIosAlbum()
  if (type === 'location') return checkIosLocation()
  return { authorized: false, status: 'unavailable', needRequest: false, needOpenSetting: false, serviceEnabled: true, message: `未知权限类型: ${type}` }
}

function normalizeIosAuthStatus(status) {
  // AVAuthorizationStatus / PHAuthorizationStatus: 0 notDetermined, 1 restricted, 2 denied, 3 authorized, 4 limited(iOS14+ Photos)
  if (status === 3) return { authorized: true, status: 'authorized' }
  if (status === 4) return { authorized: true, status: 'limited' }
  if (status === 0) return { authorized: false, status: 'notDetermined', needRequest: true }
  if (status === 1) return { authorized: false, status: 'restricted', needOpenSetting: false }
  if (status === 2) return { authorized: false, status: 'denied', needOpenSetting: true }
  return { authorized: false, status: 'unavailable' }
}

function checkIosCamera() {
  const AVCaptureDevice = plus.ios.importClass('AVCaptureDevice')
  const status = AVCaptureDevice.authorizationStatusForMediaType('vide')
  plus.ios.deleteObject(AVCaptureDevice)
  return { serviceEnabled: true, message: '', ...normalizeIosAuthStatus(status) }
}

function checkIosMicrophone() {
  const AVAudioSession = plus.ios.importClass('AVAudioSession')
  const session = AVAudioSession.sharedInstance()
  const status = session.recordPermission() // 1735552628 granted, 1684369017 denied, 1970168948 undetermined
  plus.ios.deleteObject(session)
  plus.ios.deleteObject(AVAudioSession)
  if (status === 1735552628) return { authorized: true, status: 'authorized', needRequest: false, needOpenSetting: false, serviceEnabled: true, message: '' }
  if (status === 1970168948) return { authorized: false, status: 'notDetermined', needRequest: true, needOpenSetting: false, serviceEnabled: true, message: '麦克风权限尚未申请' }
  return { authorized: false, status: 'denied', needRequest: false, needOpenSetting: true, serviceEnabled: true, message: '麦克风权限被拒绝' }
}

function checkIosAlbum() {
  const PHPhotoLibrary = plus.ios.importClass('PHPhotoLibrary')
  const status = PHPhotoLibrary.authorizationStatus()
  plus.ios.deleteObject(PHPhotoLibrary)
  return { serviceEnabled: true, message: '', ...normalizeIosAuthStatus(status) }
}

function checkIosLocation() {
  const CLLocationManager = plus.ios.importClass('CLLocationManager')
  const serviceEnabled = CLLocationManager.locationServicesEnabled()
  const status = CLLocationManager.authorizationStatus() // 0 notDetermined, 1 restricted, 2 denied, 3 always, 4 whenInUse
  plus.ios.deleteObject(CLLocationManager)
  if (status === 3 || status === 4) return { authorized: true, status: 'authorized', needRequest: false, needOpenSetting: false, serviceEnabled, message: '' }
  if (status === 0) return { authorized: false, status: 'notDetermined', needRequest: true, needOpenSetting: false, serviceEnabled, message: '定位权限尚未申请' }
  return { authorized: false, status: status === 1 ? 'restricted' : 'denied', needRequest: false, needOpenSetting: status !== 1, serviceEnabled, message: '定位权限不可用或被拒绝' }
}

function openIosAppSetting() {
  const UIApplication = plus.ios.importClass('UIApplication')
  const NSURL = plus.ios.importClass('NSURL')
  const settingUrl = NSURL.URLWithString('app-settings:')
  const application = UIApplication.sharedApplication()
  application.openURL(settingUrl)
  plus.ios.deleteObject(settingUrl)
  plus.ios.deleteObject(application)
}
```

## 7. 鸿蒙 App：权限判断与 UTS 插件封装

鸿蒙 App 不使用 `plus.android` / `plus.ios`。uni-app 鸿蒙原生能力需要通过 UTS 插件访问 ArkTS API；权限在 `harmony-configs/entry/src/main/module.json5` 声明。

### 7.1 module.json5 声明

```json5
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" },
      { "name": "ohos.permission.GET_NETWORK_INFO" },
      { "name": "ohos.permission.CAMERA" },
      { "name": "ohos.permission.MICROPHONE" },
      { "name": "ohos.permission.LOCATION" },
      { "name": "ohos.permission.APPROXIMATELY_LOCATION" },
      { "name": "ohos.permission.ACCESS_BLUETOOTH" },
      { "name": "ohos.permission.NOTIFICATION" }
    ]
  }
}
```

权限类型：

| 类型 | 说明 | 示例 |
|---|---|---|
| `system_grant` | 安装后自动授予，不弹窗 | `INTERNET`、`GET_NETWORK_INFO` |
| `user_grant` | 运行时需用户确认 | `CAMERA`、`MICROPHONE`、`LOCATION`、`NOTIFICATION` |
| ACL / 受限权限 | 需要华为开发者后台审批或 profile 支持 | 部分通讯录、相册写入、剪贴板等敏感权限 |

### 7.2 UTS 插件接口示例

`uni_modules/app-permission/utssdk/interface.uts`：

```ts
export type PermissionStatus = {
  authorized: boolean,
  status: string,
  needRequest: boolean,
  needOpenSetting: boolean,
  message: string
}

export type CheckHarmonyPermissionOptions = {
  permission: string,
  request?: boolean | null
}

export function checkHarmonyPermission(options: CheckHarmonyPermissionOptions): Promise<PermissionStatus>
```

`uni_modules/app-permission/utssdk/app-harmony/index.uts`：

```ts
import { abilityAccessCtrl, Permissions } from '@kit.AbilityKit'
import type { common } from '@kit.AbilityKit'

export async function checkHarmonyPermission(options: CheckHarmonyPermissionOptions): Promise<PermissionStatus> {
  const permission = options.permission as Permissions
  const context = UTSHarmony.getUIAbilityContext() as common.UIAbilityContext
  const atManager = abilityAccessCtrl.createAtManager()

  try {
    const grantStatus = await atManager.checkAccessToken(context.applicationInfo.accessTokenId, permission)
    if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
      return { authorized: true, status: 'authorized', needRequest: false, needOpenSetting: false, message: '' }
    }

    if (options.request !== true) {
      return { authorized: false, status: 'denied', needRequest: true, needOpenSetting: false, message: '权限未授权' }
    }

    return await new Promise<PermissionStatus>((resolve) => {
      UTSHarmony.requestSystemPermission(
        [permission],
        (_allRight: boolean, grantedList: Array<string>) => {
          resolve({
            authorized: grantedList.includes(permission),
            status: grantedList.includes(permission) ? 'authorized' : 'denied',
            needRequest: false,
            needOpenSetting: false,
            message: grantedList.includes(permission) ? '' : '用户拒绝授权'
          })
        },
        async (doNotAskAgain: boolean, _grantedList: Array<string>) => {
          if (doNotAskAgain) {
            resolve({ authorized: false, status: 'deniedAlways', needRequest: false, needOpenSetting: true, message: '权限已被拒绝且不再询问' })
          } else {
            resolve({ authorized: false, status: 'denied', needRequest: true, needOpenSetting: false, message: '用户拒绝授权' })
          }
        }
      )
    })
  } catch (err) {
    return { authorized: false, status: 'unavailable', needRequest: false, needOpenSetting: false, message: String(err) }
  }
}

export async function openHarmonyPermissionSetting(permission: string): Promise<void> {
  const permissions: Permissions[] = [permission as Permissions]
  const context = UTSHarmony.getUIAbilityContext() as common.UIAbilityContext
  const atManager = abilityAccessCtrl.createAtManager()
  await atManager.requestPermissionOnSetting(context, permissions)
}
```

页面中调用：

```vue
<script setup>
// #ifdef APP-HARMONY
import { checkHarmonyPermission, openHarmonyPermissionSetting } from '@/uni_modules/app-permission'

async function ensureCamera() {
  const res = await checkHarmonyPermission({ permission: 'ohos.permission.CAMERA', request: true })
  if (res.needOpenSetting) {
    const { confirm } = await uni.showModal({ title: '需要相机权限', content: '请在系统设置中允许相机权限' })
    if (confirm) await openHarmonyPermissionSetting('ohos.permission.CAMERA')
  }
  return res.authorized
}
// #endif
</script>
```

### 7.3 鸿蒙注意事项

- `APP` 条件编译包含鸿蒙；如果代码里使用 `plus.*`，必须限定为 `APP-PLUS`。
- `APP-HARMONY` 的权限能力应通过 UTS / ArkTS 插件封装；页面 JS 不要直接调用 ohpm 包或 ArkTS API。
- `MP-HARMONY` 元服务不支持 UTS 插件，权限与能力应按元服务/ASCF 文档处理。
- 部分权限即使代码正确，也可能因为未在 AGC / profile 中配置或 ACL 未审批而失败。
- 定位类能力通常要同时检查权限授权和系统定位服务开关；可先用 `uni.getSystemSetting()` 读取 `locationEnabled`，再请求 `LOCATION`。

## 8. 业务使用建议

```js
async function requirePermission(type, label) {
  const res = await checkAppPermission(type, { request: true })
  if (res.authorized && res.serviceEnabled !== false) return true

  if (res.serviceEnabled === false) {
    await uni.showModal({ title: `${label}不可用`, content: `请先打开系统${label}服务`, showCancel: false })
    return false
  }

  if (res.needOpenSetting) {
    const { confirm } = await uni.showModal({ title: `需要${label}权限`, content: `请在系统设置中允许${label}权限` })
    if (confirm) {
      // #ifdef APP-PLUS
      const { platform } = uni.getSystemInfoSync()
      if (platform === 'android') openAndroidAppSetting()
      if (platform === 'ios') openIosAppSetting()
      // #endif
    }
  } else if (!res.authorized) {
    uni.showToast({ title: res.message || `${label}权限未授权`, icon: 'none' })
  }

  return false
}
```

## 9. 配置联动

- Android 权限声明见 `references/native-resources.md` 的 AndroidManifest.xml 小节。
- iOS `Info.plist` 用途描述见 `references/native-resources.md` 的 iOS 原生资源小节。
- 鸿蒙 `module.json5`、UTS 插件结构见 `references/harmony-basics.md` 与 `references/harmony-development.md`。
- App 原生能力整体使用方式见 `references/app-native.md`。
