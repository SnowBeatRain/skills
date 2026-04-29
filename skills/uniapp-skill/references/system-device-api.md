# 系统、设备与 UI 控制 API 参考

## 设备信息

```js
// 完整系统信息（推荐分开获取）
const sysInfo = uni.getSystemInfoSync()

// 设备信息
const {
  deviceBrand,          // 品牌：apple | huawei | xiaomi
  deviceId,             // 唯一设备标识
  deviceModel,          // 型号：iPhone 14 Pro | Pixel 7
  deviceType,           // phone | pad | pc
  deviceOrientation,    // portrait | landscape
  platform,             // ios | android | devtools | harmonyos
  osName, osVersion,    // iOS 16.0 | Android 13
  osLanguage, osTheme,  // zh-Hans | dark
  romName, romVersion   // MIUI 14 | EMUI 13
} = uni.getDeviceInfo()

// 窗口信息
const {
  pixelRatio,           // 设备像素比
  screenWidth, screenHeight,
  windowWidth, windowHeight,
  windowTop, windowBottom,
  statusBarHeight,      // 状态栏高度（px）
  safeArea,             // { top, right, bottom, left, width, height }
  safeAreaInsets         // { top, right, bottom, left }
} = uni.getWindowInfo()

// 应用基本信息
const {
  appId, appName, appVersion, appVersionCode,
  appLanguage, language, theme, enableDebug
} = uni.getAppBaseInfo()

// 系统设置状态
const { bluetoothEnabled, locationEnabled, wifiEnabled, deviceOrientation } = uni.getSystemSetting()

// 应用授权状态
const {
  albumAuthorized,      // authorized | denied | not determined
  cameraAuthorized,
  locationAuthorized,   // authorized | authorized when in use
  microphoneAuthorized,
  notificationAuthorized,
  pushAuthorized
} = uni.getAppAuthorizeSetting()
```

## 网络状态

```js
// 获取当前网络类型
const { networkType } = await uni.getNetworkType()
// wifi | 4g | 3g | 2g | 5g | ethernet | none | unknown

// 监听网络变化
uni.onNetworkStatusChange((res) => {
  console.log('是否联网:', res.isConnected)
  console.log('网络类型:', res.networkType)
})
uni.offNetworkStatusChange(callback)
```

## 传感器

### 加速度计

```js
// 开始监听
uni.startAccelerometer({
  interval: 'normal'       // game(20ms) | ui(60ms) | normal(200ms)
})

uni.onAccelerometerChange((res) => {
  console.log('X:', res.x, 'Y:', res.y, 'Z:', res.z)
  // x/y/z: -1.0 ~ 1.0，表示各轴加速度（g 为单位）
})

// 停止监听
uni.stopAccelerometer()
uni.offAccelerometerChange(callback)
```

### 罗盘（方向）

```js
uni.startCompass()
uni.onCompassChange((res) => {
  console.log('方向角度:', res.direction)  // 0-360，0 为北
  console.log('精确度:', res.accuracy)
})
uni.stopCompass()
```

### 陀螺仪

```js
uni.startGyroscope({ interval: 'normal' })
uni.onGyroscopeChange((res) => {
  console.log('角速度:', res.x, res.y, res.z)
})
uni.stopGyroscope()
```

## 电池

```js
const { level, isCharging } = await uni.getBatteryInfo()
// level: 1-100  isCharging: boolean
```

## 蓝牙

```js
// 初始化蓝牙适配器
await uni.openBluetoothAdapter()

// 搜索设备
uni.startBluetoothDevicesDiscovery({
  services: [],             // 过滤指定 UUID 的设备
  allowDuplicatesKey: false,
  interval: 0,
  powerLevel: 'medium'      // low | medium | high
})

// 监听发现设备
uni.onBluetoothDeviceFound((res) => {
  res.devices.forEach(device => {
    console.log(device.name, device.deviceId, device.RSSI)
    // RSSI: 信号强度（负数，越接近 0 越强）
  })
})

// 获取已发现设备
const { devices } = await uni.getBluetoothDevices()

// 获取已连接设备
const { devices } = await uni.getConnectedBluetoothDevices({
  services: ['目标服务 UUID']
})

// 监听适配器状态
uni.onBluetoothAdapterStateChange((res) => {
  console.log('蓝牙可用:', res.available, '搜索中:', res.discovering)
})

// 停止搜索 & 关闭
uni.stopBluetoothDevicesDiscovery()
uni.closeBluetoothAdapter()

// 错误码：10000(未初始化) 10001(不可用) 10002(未找到) 10003(连接失败) 10009(系统不支持)
```

## 剪贴板

```js
uni.setClipboardData({ data: '复制内容', showToast: false })  // showToast: 禁止默认提示
const { data } = await uni.getClipboardData()
```

## 振动

```js
uni.vibrateShort({ type: 'heavy' })  // light | medium | heavy（15ms）
uni.vibrateLong()                     // 长振动（400ms）
```

## 屏幕亮度

```js
uni.setScreenBrightness({ value: 0.8 })   // 0-1
const { value } = await uni.getScreenBrightness()
uni.setKeepScreenOn({ keepScreenOn: true }) // 保持常亮
```

## 拨打电话

```js
uni.makePhoneCall({ phoneNumber: '10086' })
```

---

## UI 控制 API

### 导航栏

```js
uni.setNavigationBarTitle({ title: '动态标题' })
uni.setNavigationBarColor({
  frontColor: '#ffffff',      // 只支持 #ffffff 或 #000000
  backgroundColor: '#007AFF',
  animation: { duration: 300, timingFunc: 'easeIn' }
})
uni.showNavigationBarLoading()   // 导航栏加载动画
uni.hideNavigationBarLoading()
uni.hideHomeButton()             // 隐藏返回首页按钮
```

### TabBar 控制

```js
// 更新 tab 项
uni.setTabBarItem({
  index: 0,
  text: '新标题',
  iconPath: '/static/new-icon.png',
  selectedIconPath: '/static/new-icon-active.png',
  pagePath: 'pages/new/new',  // 页面路径（App/H5）
  visible: true                // 是否显示（App 3.2.10+）
})

// 更新整体样式
uni.setTabBarStyle({
  color: '#7A7E83',
  selectedColor: '#007AFF',
  backgroundColor: '#ffffff',
  borderStyle: 'black',       // black | white
  midButton: {}               // App/H5 中间按钮
})

// 显示/隐藏
uni.hideTabBar({ animation: true })
uni.showTabBar({ animation: true })

// 角标与红点
uni.setTabBarBadge({ index: 0, text: '99+' })
uni.removeTabBarBadge({ index: 0 })
uni.showTabBarRedDot({ index: 1 })
uni.hideTabBarRedDot({ index: 1 })

// 中间按钮点击
uni.onTabBarMidButtonTap(() => { /* 发布按钮被点击 */ })
```

### 动画

```js
// 创建动画对象
const animation = uni.createAnimation({
  duration: 500,
  timingFunction: 'ease-in-out',   // linear | ease | ease-in | ease-out | ease-in-out
  delay: 0,
  transformOrigin: '50% 50% 0'
})

// 链式调用
animation.opacity(0.5).translateX(100).rotateZ(45).step()
animation.opacity(1).translateX(0).rotateZ(0).step({ duration: 300 })

// 导出动画数据绑定到 view
const animData = animation.export()
// <view :animation="animData">动画元素</view>

// 支持的变换
// 位移：translate(x,y) translateX/Y/Z translate3d(x,y,z)
// 旋转：rotate(deg) rotateX/Y/Z rotate3d(x,y,z,deg)
// 缩放：scale(x,y) scaleX/Y/Z scale3d(x,y,z)
// 倾斜：skew(x,y) skewX/Y
// 矩阵：matrix(a,b,c,d,e,f) matrix3d(16值)
// 样式：opacity backgroundColor width height top left right bottom
```

### 滚动与下拉刷新

```js
// 滚动到指定位置
uni.pageScrollTo({
  scrollTop: 0,              // 目标滚动距离
  selector: '#targetId',     // 或滚动到指定元素
  duration: 300              // 动画时长 ms
})

// 编程式下拉刷新
uni.startPullDownRefresh()
uni.stopPullDownRefresh()    // 页面内 onPullDownRefresh 中必须调用
```

### 自定义字体

```js
uni.loadFontFace({
  global: true,              // 全局生效
  family: 'MyFont',
  source: 'url("https://example.com/font.woff2")',
  desc: {
    style: 'normal',
    weight: 'bold',
    variant: 'normal'
  },
  scopes: ['webview', 'native']  // Canvas 2D 需要 native
})
```

### 键盘

```js
uni.hideKeyboard()
uni.onKeyboardHeightChange((res) => {
  console.log('键盘高度:', res.height)  // 0 表示收起
})
uni.offKeyboardHeightChange(callback)

// 获取光标位置
uni.getSelectedTextRange({
  success: (res) => {
    console.log('起始位置:', res.start, '结束位置:', res.end)
  }
})
```

### DOM 查询

```js
// 查询元素位置/尺寸
const query = uni.createSelectorQuery()
query.select('#myEl').boundingClientRect((rect) => {
  console.log(rect.top, rect.left, rect.width, rect.height)
}).exec()

// 查询滚动位置
query.selectViewport().scrollOffset((res) => {
  console.log(res.scrollTop, res.scrollLeft)
}).exec()

// 交叉观察（懒加载/曝光统计）
const observer = uni.createIntersectionObserver(this)
observer.relativeTo('.scroll-container').observe('.item', (res) => {
  console.log('可见比例:', res.intersectionRatio)
  if (res.intersectionRatio > 0) {
    // 元素进入可视区
  }
})
observer.disconnect()  // 停止观察

// 媒体查询
const mediaObserver = uni.createMediaQueryObserver(this)
mediaObserver.observe({ minWidth: 768 }, (matches) => {
  console.log('宽屏:', matches)
})

// 下一帧
uni.nextTick(() => { /* DOM 更新后执行 */ })
```

### 单位转换

```js
const px = uni.rpx2px(750)   // rpx 转 px（推荐）
const px2 = uni.upx2px(750)  // 同上（旧 API）
```

## 物理按键

```js
// App 端监听按键（onBackPress 用于页面级）
// pages.json 中配置页面的 onBackPress 行为：
// 返回 true 阻止默认返回行为

// 页面中
import { onBackPress } from '@dcloudio/uni-app'
onBackPress(({ from }) => {
  // from: 'backbutton' | 'navigateBack'
  if (needConfirm) {
    uni.showModal({ title: '确认退出？' })
    return true   // 阻止默认返回
  }
  return false    // 允许默认返回
})
```
