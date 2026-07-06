# uni-app 硬件与开放能力参考

官方文档：<https://uniapp.dcloud.net.cn/api/>

本文覆盖 `uni-app` 中与硬件设备交互及平台开放能力相关的 API，包括低功耗蓝牙 BLE、Wi-Fi、NFC、iBeacon、生物认证、截屏监听、内存告警、系统设置查询、通讯录等。基础蓝牙、传感器、扫码等内容见 `system-device-api.md`。

---

## 能力矩阵

| 能力 | 主要支持平台 | 备注 |
|------|-------------|------|
| 低功耗蓝牙 BLE | App、微信小程序、支付宝、抖音、京东、元服务 | 需先初始化蓝牙适配器 |
| Wi-Fi | 微信小程序、百度、抖音；App 需插件 | App 端 iOS 需开启 Access WiFi Information |
| NFC | 微信小程序、App | App 端需 Native.js 或原生插件 |
| iBeacon | App、微信小程序、支付宝、抖音、元服务 | 需开启定位 |
| 生物认证 | App、微信小程序 | 含指纹 / FaceID（SOTER） |
| 截屏监听/防截屏 | App（插件）、小程序 | App 端需 `uni-usercapturescreen` 插件 |
| 内存告警 | App、小程序 | App 端需 `uni-memorywarning` 插件 |
| 系统设置查询 | App、微信小程序、元服务 | `uni.getSystemSetting` |
| 授权设置查询 | App、微信小程序 | `uni.getAppAuthorizeSetting` |
| 添加通讯录 | App、微信小程序、支付宝、百度、元服务 | `uni.addPhoneContact` |

---

## 低功耗蓝牙 BLE

BLE 适用于智能手环、体脂秤、智能家居、共享单车锁等低功耗设备通信。

### 流程概览

1. 初始化蓝牙适配器：`uni.openBluetoothAdapter`
2. 开始扫描：`uni.startBluetoothDevicesDiscovery`
3. 发现设备：`uni.onBluetoothDeviceFound`
4. 连接设备：`uni.createBLEConnection`
5. 获取服务：`uni.getBLEDeviceServices`
6. 获取特征值：`uni.getBLEDeviceCharacteristics`
7. 读写数据 / 订阅通知：`uni.readBLECharacteristicValue` / `writeBLECharacteristicValue` / `notifyBLECharacteristicValueChange`
8. 断开连接：`uni.closeBLEConnection`
9. 关闭适配器：`uni.closeBluetoothAdapter`

### 完整示例

```js
export default {
  data() {
    return {
      deviceId: '',
      serviceId: '',
      characteristicId: ''
    }
  },

  onLoad() {
    this.initBluetooth()
  },

  onUnload() {
    uni.closeBluetoothAdapter()
  },

  methods: {
    initBluetooth() {
      uni.openBluetoothAdapter({
        success: () => {
          console.log('蓝牙初始化成功')
          this.startDiscovery()
        },
        fail: (err) => {
          console.error('蓝牙初始化失败', err)
          if (err.errCode === 10001) {
            uni.showModal({ title: '提示', content: '请开启手机蓝牙' })
          }
        }
      })
    },

    startDiscovery() {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          uni.onBluetoothDeviceFound((res) => {
            const device = res.devices.find(d => d.name === 'MyBLEDevice')
            if (device) {
              this.deviceId = device.deviceId
              uni.stopBluetoothDevicesDiscovery()
              this.connectDevice()
            }
          })
        }
      })
    },

    connectDevice() {
      uni.createBLEConnection({
        deviceId: this.deviceId,
        success: () => {
          console.log('连接成功')
          setTimeout(() => this.getServices(), 500)
        }
      })
    },

    getServices() {
      uni.getBLEDeviceServices({
        deviceId: this.deviceId,
        success: (res) => {
          this.serviceId = res.services[0].uuid
          this.getCharacteristics()
        }
      })
    },

    getCharacteristics() {
      uni.getBLEDeviceCharacteristics({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        success: (res) => {
          const char = res.characteristics.find(c => c.properties.read || c.properties.notify)
          if (char) {
            this.characteristicId = char.uuid
            this.startNotify()
          }
        }
      })
    },

    startNotify() {
      uni.notifyBLECharacteristicValueChange({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        state: true,
        success: () => {
          uni.onBLECharacteristicValueChange((res) => {
            const value = ab2hex(res.value)
            console.log('收到数据:', value)
          })
        }
      })
    },

    writeData(hexStr) {
      const buffer = hex2ab(hexStr)
      uni.writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: buffer,
        success: () => console.log('写入成功')
      })
    }
  }
}

// ArrayBuffer 转 16 进制字符串
function ab2hex(buffer) {
  const hexArr = Array.prototype.map.call(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2))
  return hexArr.join('')
}

// 16 进制字符串转 ArrayBuffer
function hex2ab(hex) {
  const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
  return typedArray.buffer
}
```

### 注意事项

- Android 6.0+ 扫描/连接 BLE 通常需要定位权限，iOS 需配置蓝牙模块。
- 单次写入建议不超过 20 字节；超过需分包写入。
- 发现设备后务必调用 `uni.stopBluetoothDevicesDiscovery` 停止扫描，节省电量。

---

## Wi-Fi

Wi-Fi 能力主要用于局域网设备配网、获取当前连接信息等场景。

### 微信小程序示例

```js
// #ifdef MP-WEIXIN
uni.startWifi({
  success: () => {
    uni.getConnectedWifi({
      success: (res) => {
        console.log('当前 Wi-Fi:', res.wifi.SSID, res.wifi.BSSID)
      }
    })
  }
})

uni.onGetWifiList((res) => {
  console.log('Wi-Fi 列表:', res.wifiList)
})

uni.getWifiList()
// #endif
```

### App 端

App 端 Wi-Fi 能力由 [uni-WiFi](https://ext.dcloud.net.cn/plugin?id=10337) 插件实现，需 HBuilderX 3.6.8+。

- iOS 需开启 **Access WiFi Information** 能力。
- iOS 13+ 获取 Wi-Fi 信息需要先获取定位权限。

---

## NFC

NFC 适用于公交卡、门禁卡、支付标签等近场通信场景。

### 平台支持

- **微信小程序**：原生支持 HCE（主机卡模拟）、NFCAdapter 等。
- **App 端**：需通过 [Native.js](https://uniapp.dcloud.net.cn/tutorial/native-js.html) 或 [NFC 原生插件](https://ext.dcloud.net.cn/search?q=nfc) 实现。

### 微信小程序示例

```js
// #ifdef MP-WEIXIN
const nfc = wx.getNFCAdapter()
nfc.startDiscovery({
  success: () => {
    console.log('开始发现 NFC 标签')
  }
})

nfc.onDiscovered((res) => {
  console.log('发现标签:', res)
})
// #endif
```

---

## iBeacon

iBeacon 用于室内定位、商场导航、到店签到等基于蓝牙信标的场景。

```js
// #ifdef MP-WEIXIN || APP-PLUS
uni.startBeaconDiscovery({
  uuids: ['FDA50693-A4E2-4FB1-AFCF-C6EB07647825'],
  success: () => {
    console.log('开始搜索 iBeacon')
  }
})

uni.onBeaconUpdate((res) => {
  res.beacons.forEach(beacon => {
    console.log('uuid:', beacon.uuid, 'major:', beacon.major, 'minor:', beacon.minor, 'rssi:', beacon.rssi)
  })
})

uni.onBeaconServiceChange((res) => {
  console.log('iBeacon 服务状态变化:', res.available, res.discovering)
})

// 页面卸载时停止搜索
onUnload(() => {
  uni.stopBeaconDiscovery()
})
// #endif
```

> 注意：未开启定位将影响 iBeacon 正常使用。

---

## 生物认证

生物认证包括指纹识别和 FaceID，适用于本地快捷解锁、支付确认等场景。

```js
// 1. 检查支持的认证方式
uni.checkIsSupportSoterAuthentication({
  success: (res) => {
    console.log('支持:', res.supportMode) // ['fingerPrint'] 或 ['facial']
  }
})

// 2. 检查是否已录入
uni.checkIsSoterEnrolledInDevice({
  checkAuthMode: 'fingerPrint',
  success: (res) => {
    console.log('是否已录入指纹:', res.isEnrolled)
  }
})

// 3. 开始认证
uni.startSoterAuthentication({
  requestAuthModes: ['fingerPrint'],
  challenge: 'order_123456',
  authContent: '请验证指纹以确认支付',
  success: (res) => {
    console.log('认证成功:', res.authMode)
    // 将 res.resultJSON 和 res.resultJSONSignature 发送到服务端校验
  },
  fail: (err) => {
    console.error('认证失败:', err.errCode, err.errMsg)
  }
})
```

### 平台差异

- App 端：Android 6.0+ 支持指纹；iOS 支持 FaceID/TouchID。
- 微信小程序：支持 SOTER 指纹和面部识别。
- 支付宝/百度小程序：仅支持人脸识别，需调用各自平台 API。

### 实人认证

如需金融级活体检测/人脸识别，使用 [uni 实人认证](https://doc.dcloud.net.cn/uniCloud/frv/intro.html)，而不是 SOTER。

---

## 截屏监听与防截屏

### 监听用户截屏

```js
// #ifdef APP-PLUS || MP
uni.onUserCaptureScreen((res) => {
  console.log('用户截屏了', res.path)
  uni.showToast({ title: '检测到截屏', icon: 'none' })
})

// 取消监听
uni.offUserCaptureScreen(callback)
// #endif
```

### 防截屏（仅 App）

```js
// #ifdef APP-PLUS
uni.setUserCaptureScreen({
  enable: false,
  success: () => console.log('已禁止截屏')
})
// #endif
```

> App 端需安装 [uni-usercapturescreen](https://ext.dcloud.net.cn/plugin?name=uni-usercapturescreen) 插件；Android 需本地文件读取权限。

---

## 内存告警

监听系统内存不足告警，及时释放图片、缓存、隐藏页面等资源。

```js
// #ifdef APP-PLUS || MP
const onMemoryWarning = (res) => {
  console.warn('内存告警 level:', res.level)
  // 释放非必要资源
  this.releaseCache()
}

uni.onMemoryWarning(onMemoryWarning)

// 页面卸载时取消监听
onUnload(() => {
  uni.offMemoryWarning(onMemoryWarning)
})
// #endif
```

> App 端需安装 [uni-memorywarning](https://ext.dcloud.net.cn/plugin?id=10071) 插件。

---

## 系统设置与授权状态查询

### 查询系统开关

```js
const setting = uni.getSystemSetting()
console.log('蓝牙开关:', setting.bluetoothEnabled)
console.log('定位开关:', setting.locationEnabled)
console.log('Wi-Fi 开关:', setting.wifiEnabled)
console.log('设备方向:', setting.deviceOrientation)
```

### 查询 App 授权状态

```js
const auth = uni.getAppAuthorizeSetting()
console.log('相册:', auth.albumAuthorized)
console.log('相机:', auth.cameraAuthorized)
console.log('定位:', auth.locationAuthorized)
console.log('麦克风:', auth.microphoneAuthorized)
console.log('通知:', auth.notificationAuthorized)
```

### 权限状态说明

| 值 | 含义 | 处理建议 |
|----|------|----------|
| `authorized` | 已授权 | 可直接使用 |
| `denied` | 已拒绝 | 需引导用户到系统设置开启 |
| `not determined` | 尚未请求（iOS 常见） | 下次调用时系统会自动弹窗 |
| `config error` | App 端 manifest 模块/权限未配置 | 检查 `manifest.json` 模块配置 |

---

## 添加通讯录联系人

```js
uni.addPhoneContact({
  firstName: '张三',
  mobilePhoneNumber: '13800138000',
  organization: 'DCloud',
  title: '开发工程师',
  success: () => {
    uni.showToast({ title: '已添加到通讯录' })
  },
  fail: (err) => {
    console.error('添加失败', err)
  }
})
```

> App 端读取联系人需使用 5+ App 的 contacts API 或原生插件；写入联系人需在 manifest 中配置权限和模块。

---

## 注意事项

1. **权限申请**：多数硬件能力需要先在 `manifest.json` 中配置模块和权限，并在运行时申请。
2. **平台隔离**：Wi-Fi、NFC、生物认证等平台差异大，务必使用 `#ifdef` 条件编译。
3. **资源释放**：BLE 扫描、iBeacon 搜索、截屏/内存监听等需要在页面卸载时停止或取消监听。
4. **真机测试**：硬件能力（蓝牙、NFC、Wi-Fi、生物认证）必须在真机上测试，模拟器通常不支持。
5. **鸿蒙限制**：HarmonyOS Next 对部分硬件能力支持不完整，需参阅最新文档。

---

## 相关参考

- `system-device-api.md`：蓝牙基础、传感器、扫码、网络状态、设备信息
- `api.md`：网络请求、路由、UI 弹窗
- `native-js.md`：直接调用 Android/iOS 原生 API
- `app-permissions.md`：权限申请与引导策略
