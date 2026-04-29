# 鸿蒙权限与配置

## 配置位置

uni-app 鸿蒙 App 常见配置目录：

```text
harmony-configs/
├── AppScope/app.json5
└── entry/src/main/module.json5
```

权限声明通常位于：

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

UTS 插件自身可能还需要：

```text
uni_modules/<plugin>/utssdk/app-harmony/config.json
```

具体字段随 HBuilderX / DCloud 版本变化，修改前先查看项目已有插件的写法。

## 权限分类

| 类型 | 说明 | 处理方式 |
|---|---|---|
| system_grant | 安装后系统自动授权 | 只需声明 |
| user_grant | 运行时弹窗授权 | 声明 + 运行时请求 |
| restricted / ACL | 受限权限，可能需要应用市场/华为后台审批 | 不要默认使用；先确认审核要求 |

## 常用权限

| 能力 | 常见权限 | 备注 |
|---|---|---|
| 网络请求 | `ohos.permission.INTERNET` | system_grant |
| 网络状态 | `ohos.permission.GET_NETWORK_INFO` | system_grant |
| 相机 | `ohos.permission.CAMERA` | user_grant |
| 麦克风/录音 | `ohos.permission.MICROPHONE` | user_grant |
| 位置 | `ohos.permission.LOCATION`、模糊/精确定位相关权限 | user_grant；注意前后台定位 |
| 蓝牙 | `ohos.permission.ACCESS_BLUETOOTH` 等 | user_grant；以当前 SDK 为准 |
| 通知 | `ohos.permission.NOTIFICATION` | user_grant |
| 媒体读写 | 图片/视频读写相关权限 | 可能涉及受限权限或 picker 替代方案 |
| 剪贴板 | 读取剪贴板相关权限/限制 | 可能受系统隐私策略影响 |

> 权限名称和授权等级以 OpenHarmony / HarmonyOS 当前 API 文档为准。不要凭旧版本经验硬写。

## 运行时申请模板

```ts
import { abilityAccessCtrl, Permissions } from '@kit.AbilityKit'

type PermissionResult = {
  errMsg: string
  granted: boolean
  grantedList: Array<string>
  doNotAskAgain?: boolean | null
}

export function requestCameraPermission(options: RequestPermissionOptions) {
  const permissions: Permissions[] = ['ohos.permission.CAMERA']
  const context = UTSHarmony.getUIAbilityContext()
  const atManager = abilityAccessCtrl.createAtManager()

  UTSHarmony.requestSystemPermission(
    permissions,
    (allRight: boolean, grantedList: Array<string>) => {
      const res = {
        errMsg: allRight ? 'requestPermission:ok' : 'requestPermission:fail denied',
        granted: allRight,
        grantedList
      }
      if (allRight) options.success?.(res)
      else options.fail?.(res)
      options.complete?.(res)
    },
    async (doNotAskAgain: boolean, grantedList: Array<string>) => {
      const res = {
        errMsg: 'requestPermission:fail do not ask again',
        granted: false,
        grantedList,
        doNotAskAgain
      }
      if (doNotAskAgain) {
        try {
          await atManager.requestPermissionOnSetting(context, permissions)
        } catch (_) {}
      }
      options.fail?.(res)
      options.complete?.(res)
    }
  )
}
```

## 设计建议

- 每个需要权限的原生 API 都要有“权限不足”的明确错误。
- 不要在插件初始化时一次性申请大量权限；按功能触发申请。
- 对敏感能力（定位、相机、麦克风、相册写入），在页面层先解释用途，再触发插件申请。
- 用户拒绝且不再询问时，给出“去设置开启”的引导，不要循环弹窗。
- 受限权限不要默认加入模板；先确认业务必要性和上架审核。

## 排查清单

- [ ] `module.json5` 已声明权限。
- [ ] 运行时请求的权限名与声明一致。
- [ ] 真机系统版本/API level 支持该权限。
- [ ] 用户拒绝/不再询问路径已处理。
- [ ] 应用后台/前台定位、通知等特殊场景满足平台政策。
- [ ] 重新运行/重新安装后验证授权弹窗是否符合预期。

## 官方 docs 常见权限索引（按 Kit）

> 这些权限名来自官方 docs 检索结果，只作为定位线索；实际使用前必须打开对应 API 文件确认权限等级、授权方式、API Level 和是否系统接口。

| Kit / 能力 | 常见权限 | 注意事项 |
|---|---|---|
| NetworkKit 网络 | `ohos.permission.INTERNET`、`ohos.permission.GET_NETWORK_INFO` | `INTERNET` 多为基础网络权限；网络状态监听需要 `GET_NETWORK_INFO`。 |
| CameraKit 相机 | `ohos.permission.CAMERA`、`ohos.permission.MICROPHONE` | 录像通常还需要麦克风；相机预览/拍照必须处理拒权和释放资源。 |
| LocationKit 定位 | `ohos.permission.LOCATION`、`ohos.permission.APPROXIMATELY_LOCATION`、`ohos.permission.LOCATION_IN_BACKGROUND` | 精确/模糊/后台定位分开设计；后台定位属于强敏感场景。 |
| ConnectivityKit 蓝牙/WLAN/NFC | `ohos.permission.ACCESS_BLUETOOTH`、`ohos.permission.USE_BLUETOOTH`、`ohos.permission.DISCOVER_BLUETOOTH`、`ohos.permission.GET_WIFI_INFO`、`ohos.permission.NFC_TAG` | BLE/WLAN 常与位置权限、设备能力、系统版本相关；NFC 必须真机验证。 |
| CoreFileKit 文件 | `ohos.permission.FILE_ACCESS_MANAGER`、`ohos.permission.READ_IMAGEVIDEO`、`ohos.permission.WRITE_IMAGEVIDEO`、`ohos.permission.FILE_ACCESS_PERSIST` | 尽量优先 picker / URI 授权，避免直接申请宽泛文件权限。 |
| MediaLibraryKit 相册 | `ohos.permission.READ_IMAGEVIDEO`、`ohos.permission.WRITE_IMAGEVIDEO`、`ohos.permission.MEDIA_LOCATION`、`ohos.permission.SHORT_TERM_WRITE_IMAGEVIDEO` | 读取媒体位置、私密相册、短期写入等政策差异较大，逐项查官方文档。 |
| NotificationKit 通知 | 通知发布授权、`NOTIFICATION_*` 控制类权限 | 普通通知发布与通知控制/订阅是不同权限层级，控制类多为受限。 |
| SensorServiceKit 传感器/振动 | `ohos.permission.ACCELEROMETER`、`ohos.permission.GYROSCOPE`、`ohos.permission.ACTIVITY_MOTION`、`ohos.permission.VIBRATE`、健康类权限 | 传感器事件需节流并取消订阅；健康类权限更敏感。 |
| AudioKit 音频 | `ohos.permission.MICROPHONE`、`ohos.permission.ACCESS_BLUETOOTH`、`ohos.permission.MODIFY_AUDIO_SETTINGS` | 录音和蓝牙音频路由分开申请；系统音频配置多为受限。 |
| ArkWeb WebView | `ohos.permission.INTERNET`、Web 内容触发的 `CAMERA`/`MICROPHONE`/`LOCATION` 等 | WebView 内网页能力请求和 App 权限要同时处理。 |
| CalendarKit 日历 | `ohos.permission.READ_CALENDAR`、`ohos.permission.WRITE_CALENDAR` | 写入前让用户明确确认，避免静默改日程。 |
| ContactsKit 联系人 | `ohos.permission.READ_CONTACTS`、`ohos.permission.WRITE_CONTACTS` | 尽量使用系统选择器，避免批量读取。 |
| TelephonyKit 电话/短信 | `ohos.permission.PLACE_CALL`、`ohos.permission.SEND_MESSAGES`、`ohos.permission.GET_TELEPHONY_STATE` | 很多接口审核敏感或受限；优先拉起系统拨号/短信界面。 |
| UserAuthenticationKit 生物认证 | `ohos.permission.ACCESS_BIOMETRIC` | 插件只处理认证结果，不接触生物特征数据。 |
| BackgroundTasksKit 后台任务 | `ohos.permission.KEEP_BACKGROUND_RUNNING`、`ohos.permission.PUBLISH_AGENT_REMINDER` | 后台保活/提醒受审核和功耗政策影响，不能当通用保活方案。 |

## 受限权限快速判断

看到以下模式时，不要直接写进模板：

- 名称包含 `PRIVILEGED`、`MANAGE_`、`INTERNAL`、`SYSTEM`、`DUMP`、`UPDATE_SYSTEM`。
- 官方文件名或标题包含 `系统接口` / `-sys.md`。
- 文档说明需要 ACL、企业应用、系统应用、特定签名或特定设备类型。

处理方式：先问清应用类型和上架渠道，再决定是否能做；普通三方 App 默认绕开或改用 picker/系统设置页/公开 API。
