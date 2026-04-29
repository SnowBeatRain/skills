# OpenHarmony 官方 Kit/API 细查表（UTS 鸿蒙插件视角）

> 来源：`https://gitee.com/openharmony/docs` 的 `zh-cn/application-dev/reference/`。本文件只做索引和封装建议，具体函数签名、API Level、系统接口标记以当前 SDK 文档为准。

## 使用方法

1. 先根据业务场景在下表定位 Kit 与文档目录。
2. 打开对应 `Readme-CN.md` 看官方分类，再进入具体 `js-apis-*` / `arkts-apis-*` 文件。
3. 遇到权限、错误码、系统接口，必须回到官方文件逐项确认。
4. UTS 插件中优先导入 `@kit.*`，对页面暴露普通 JSON/DTO，不暴露鸿蒙对象。

## Kit/API 总表

| 业务能力 | 官方目录 | 常用官方模块/文件 | 常见导入 | 常见权限 | UTS 插件封装建议 |
|---|---|---|---|---|---|
| Ability 上下文、页面/应用拉起、Want | `apis-ability-kit` | `js-apis-app-ability-common.md`、`js-apis-inner-application-uiAbilityContext.md`、`js-apis-app-ability-want.md`、`js-apis-app-ability-startOptions.md` | `common`, `Want`, `StartOptions` from `@kit.AbilityKit` | 视目标 Ability；跨应用/不可见 Ability 可能受限 | 用 `UTSHarmony.getUIAbilityContext()` 获取上下文；对外只暴露 bundleName/abilityName/uri/action/parameters |
| 权限申请与查询 | `apis-ability-kit` | `js-apis-abilityAccessCtrl.md`、`errorcode-access-token.md` | `abilityAccessCtrl`, `Permissions` from `@kit.AbilityKit` | 目标权限本身 | 优先 `UTSHarmony.requestSystemPermission`；拒绝且不再询问时再引导到设置 |
| 包信息/应用信息 | `apis-ability-kit` | `js-apis-bundleManager.md`、`js-apis-launcherBundleManager.md`、`errorcode-bundle.md` | `bundleManager` from `@kit.AbilityKit` | `GET_BUNDLE_INFO`；特权查询常见 `GET_BUNDLE_INFO_PRIVILEGED` | 普通应用只查自身或允许范围内信息；不要默认用 `*-sys` 文件里的接口 |
| 应用前后台、生命周期 | `apis-ability-kit` | `js-apis-app-ability-applicationStateChangeCallback.md`、`js-apis-app-ability-abilityLifecycleCallback.md` | `application`, callback 类型 | 通常无 | 需要全局监听时在 ETS helper 里集中注册/注销，避免重复注册 |
| 错误类型、公共基础类型 | `apis-basic-services-kit` | 多数示例使用 `BusinessError` | `BusinessError` from `@kit.BasicServicesKit` | 无 | 捕获后统一转 `{ errCode, errMsg, data? }`；不要把原始 error 对象直接返回页面 |
| 设备信息、电池、电源、剪贴板、公共事件、上传下载 | `apis-basic-services-kit` | `js-apis-device-info.md`、`js-apis-battery-info.md`、`js-apis-power.md`、`js-apis-pasteboard.md`、`js-apis-commonEventManager.md`、`js-apis-request.md` | `deviceInfo`, `batteryInfo`, `pasteboard`, `commonEventManager`, `request` from `@kit.BasicServicesKit` | `INTERNET`、打印/账号/USB 等按场景 | `uni.*` 已覆盖时优先 uni；剪贴板/设备标识注意隐私，不返回不可恢复标识 |
| 日志、性能、调试 | `apis-performance-analysis-kit` | `js-apis-hilog.md`、`js-apis-hidebug.md`、`js-apis-hitracemeter.md`、`js-apis-hitracechain.md` | `hilog`, `hidebug`, `hiTraceMeter` from `@kit.PerformanceAnalysisKit` | DFX 读取类权限多为受限 | 插件内部日志可用 `hilog`；日志中不要打印 token、定位、手机号等隐私 |
| 文件沙箱、文件 URI、文件选择、哈希、分享 | `apis-core-file-kit` | `js-apis-file-fs.md`、`js-apis-file-fileuri.md`、`js-apis-file-picker.md`、`js-apis-file-hash.md`、`js-apis-fileShare.md` | `fs`, `fileUri`, `picker`, `hash`, `fileShare` from `@kit.CoreFileKit` | `FILE_ACCESS_MANAGER`、媒体读写等按场景 | 返回 `{ path, uri, name, size, mimeType }`；不要泄露 fd；picker 优先替代直接媒体权限 |
| 相册、图片/视频资产、PhotoPicker | `apis-media-library-kit` | `arkts-apis-photoAccessHelper.md`、`PhotoViewPicker`、`PhotoAccessHelper`、`PhotoAsset` | `photoAccessHelper` from `@kit.MediaLibraryKit` | `READ_IMAGEVIDEO`、`WRITE_IMAGEVIDEO`、`MEDIA_LOCATION`、短期写权限等 | 先评估 `uni.chooseImage/chooseVideo/saveImageToPhotosAlbum`；复杂相册管理再封装 |
| 图片编解码、PixelMap、EXIF、动图 | `apis-image-kit` | `arkts-apis-image.md`、`ImageSource`、`ImagePacker`、`PixelMap`、`ExifMetadata` | `image` from `@kit.ImageKit` | 通常取决于文件来源 | 不把 `PixelMap` 直接返回页面；输出路径/base64/尺寸/元数据 DTO |
| 相机预览、拍照、录像、闪光灯、对焦、变焦 | `apis-camera-kit` | `arkts-apis-camera.md`、`CameraManager`、`CameraInput`、`PreviewOutput`、`PhotoOutput`、`VideoOutput`、`PhotoSession`、`VideoSession` | `camera` from `@kit.CameraKit` | `CAMERA`、录像/收音需 `MICROPHONE` | 生命周期复杂，推荐 `.ets` helper 管 session；必须释放 input/output/session |
| 定位、地理围栏、位置错误码 | `apis-location-kit` | `js-apis-geoLocationManager.md`、`errorcode-geoLocationManager.md`、FenceExtensionAbility | `geoLocationManager` from `@kit.LocationKit` | `LOCATION`、`APPROXIMATELY_LOCATION`、`LOCATION_IN_BACKGROUND` | 明确精确/模糊/后台定位；后台定位强敏感，先确认业务和审核 |
| 蓝牙 Classic、BLE、连接、socket | `apis-connectivity-kit` | `js-apis-bluetooth-access.md`、`js-apis-bluetooth-ble.md`、`js-apis-bluetooth-connection.md`、`js-apis-bluetooth-socket.md`、`errorcode-bluetoothManager.md` | `bluetooth` 子模块 from `@kit.ConnectivityKit` | `ACCESS_BLUETOOTH`、`USE_BLUETOOTH`、`DISCOVER_BLUETOOTH` 等 | 扫描/连接/监听类 API 必须提供 stop/off/close；处理蓝牙关闭和设备不支持 |
| NFC Tag、卡模拟、安全单元 | `apis-connectivity-kit` | `js-apis-nfcController.md`、`js-apis-nfcTag.md`、`js-apis-nfctech.md`、`js-apis-tagSession.md`、`errorcode-nfc.md` | `nfc` 子模块 from `@kit.ConnectivityKit` | `NFC_TAG`、卡模拟相关权限 | 必须真机验证；对外抽象 tag id、tech list、读写结果 |
| WLAN / Wi-Fi 信息 | `apis-connectivity-kit` | `js-apis-wifiManager.md`、`js-apis-wifiManagerExt.md`、`errorcode-wifi.md` | `wifiManager` from `@kit.ConnectivityKit` | `GET_WIFI_INFO`、`SET_WIFI_INFO`、位置相关权限 | 很多能力受限或依赖位置权限；普通网络类型优先 `uni.getNetworkType` |
| HTTP、WebSocket、Socket、网络连接状态 | `apis-network-kit` | `js-apis-http.md`、`js-apis-webSocket.md`、`js-apis-socket.md`、`js-apis-net-connection.md`、`errorcode-net-*` | `http`, `webSocket`, `connection`, `socket` from `@kit.NetworkKit` | `INTERNET`、`GET_NETWORK_INFO` | 普通请求优先 `uni.request`；自定义证书、socket、网络监听再封装 |
| 通知发布/管理 | `apis-notification-kit` | `js-apis-notificationManager.md`、`js-apis-inner-notification-notificationRequest.md`、`errorcode-notification.md` | `notificationManager` from `@kit.NotificationKit` | 普通通知授权按系统版本；控制类权限多受限 | 先查授权/申请，再 publish/cancel；点击回调和后台行为需真机验证 |
| 传感器、振动 | `apis-sensor-service-kit` | `js-apis-sensor.md`、`js-apis-vibrator.md`、`errorcode-sensor.md`、`errorcode-vibrator.md` | `sensor`, `vibrator` from `@kit.SensorServiceKit` | `ACCELEROMETER`、`GYROSCOPE`、`ACTIVITY_MOTION`、`VIBRATE` 等 | 高频事件节流；必须 `off`/unsubscribe；页面卸载释放 |
| 音频播放、录音、音量路由 | `apis-audio-kit` | `arkts-apis-audio.md`、`AudioCapturer`、`AudioRenderer`、`AudioManager`、`AudioRoutingManager` | `audio` from `@kit.AudioKit` | `MICROPHONE`、蓝牙/音频配置等 | 简单录音/播放优先 uni；底层 PCM、路由、音频焦点再封装 |
| 原生 UI、窗口、弹窗、组件截图、路由 | `apis-arkui` | `arkts-apis-uicontext.md`、`PromptAction`、`Router`、`componentSnapshot`、window 相关文件 | `UIContext`, `promptAction`, `window` from `@kit.ArkUI` | 截屏/悬浮窗等多为受限 | 页面能力优先 uni；复杂 UI/组件用 ETS，实现层与 UTS API 分离 |
| ArkWeb WebView、cookie、下载、scheme、JS bridge | `apis-arkweb` | `arkts-apis-webview.md`、`WebviewController`、`WebCookieManager`、`WebDownloadManager`、`WebSchemeHandler` | `webview` from `@kit.ArkWeb` | `INTERNET`、相机/麦克风/定位等按 Web 内容 | 与 uni WebView 比较；自定义 scheme/cookie/download 才封装 |
| Preferences、RDB、分布式 KV、UDMF | `apis-arkdata` | `js-apis-data-preferences.md`、`arkts-apis-data-relationalStore.md`、`js-apis-distributedKVStore.md`、`js-apis-data-unifiedDataChannel.md` | `preferences`, `relationalStore` from `@kit.ArkData` | 分布式/云数据权限按场景 | 简单存储优先 `uni.setStorage`；数据库封装需迁移和关闭连接策略 |
| 日历 | `apis-calendar-kit` | `js-apis-calendarManager.md`、`errorcode-calendarManager.md` | `calendarManager` from `@kit.CalendarKit` | `READ_CALENDAR`、`WRITE_CALENDAR` | 涉隐私；只返回必要字段，写入前让页面明确确认 |
| 联系人 | `apis-contacts-kit` | `js-apis-contact.md`、`errorcode-contacts.md` | `contact` from `@kit.ContactsKit` | `READ_CONTACTS`、`WRITE_CONTACTS` | 高敏感；尽量只打开系统选择器，不批量读取 |
| 电话、短信、SIM、蜂窝网络 | `apis-telephony-kit` | `js-apis-call.md`、`js-apis-sms.md`、`js-apis-sim.md`、`js-apis-radio.md` | telephony 子模块 from `@kit.TelephonyKit` | `PLACE_CALL`、`SEND_MESSAGES`、`GET_TELEPHONY_STATE` 等 | 很多能力受限/审核敏感；优先用系统拨号/短信意图，不静默操作 |
| 生物认证/用户认证 | `apis-user-authentication-kit` | `js-apis-useriam-userauth.md`、`errorcode-useriam.md` | `userAuth` from `@kit.UserAuthenticationKit` | `ACCESS_BIOMETRIC` 等 | 不处理/保存生物信息；只返回认证结果和错误码 |
| 加解密、哈希、签名、随机数 | `apis-crypto-architecture-kit` | `js-apis-cryptoFramework.md` | `cryptoFramework` from `@kit.CryptoArchitectureKit` | 通常无 | 不在代码里硬编码密钥；密钥来源和存储另行设计 |
| 后台任务、提醒、WorkScheduler | `apis-backgroundtasks-kit` | `js-apis-reminderAgentManager.md`、`js-apis-resourceschedule-backgroundTaskManager.md`、`js-apis-resourceschedule-workScheduler.md` | `backgroundTaskManager`, `reminderAgentManager` from `@kit.BackgroundTasksKit` | `KEEP_BACKGROUND_RUNNING`、`PUBLISH_AGENT_REMINDER` 等 | 后台能力审核敏感；明确任务类型、时长、功耗和失败路径 |
| 卡片 Form | `apis-form-kit` | `js-apis-app-form-formProvider.md`、`js-apis-app-form-formBindingData.md`、`errorcode-form.md` | `formProvider`, `formBindingData` from `@kit.FormKit` | `REQUIRE_FORM` 等 | 通常不是普通 UTS 插件场景；需要单独设计 ExtensionAbility |

## 官方 docs 里的“系统接口”识别

- 文件名常带 `-sys.md`，标题常含“系统接口”。普通三方应用不要默认使用。
- 权限里出现 `*_PRIVILEGED`、`MANAGE_*`、`*_INTERNAL`、`SYSTEM_*`、`DUMP`、`UPDATE_SYSTEM` 等，通常意味着受限或系统能力。
- 如果用户业务看起来需要系统接口，先确认：应用类型、签名、ACL/权限申请、上架渠道、目标设备是否企业/行业设备。

## 文档检索模板

```bash
# 在官方 docs clone 根目录下执行
cd /tmp/openharmony-docs-scan

# 查 Kit Readme
sed -n '1,180p' zh-cn/application-dev/reference/apis-camera-kit/Readme-CN.md

# 查权限出现在哪些 API
rg "ohos.permission.CAMERA" zh-cn/application-dev/reference/apis-camera-kit

# 查导入路径
rg "@kit.CameraKit" zh-cn/application-dev/reference/apis-camera-kit

# 查错误码
find zh-cn/application-dev/reference -name 'errorcode-*camera*' -o -name 'errorcode-*geo*'

# 查是否系统接口
rg "系统接口|-sys\.md|systemapi" zh-cn/application-dev/reference/apis-ability-kit/js-apis-bundleManager*.md
```
