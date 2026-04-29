# uni-app 常用 API 参考

官方文档：https://uniapp.dcloud.net.cn/api/

## 网络

### uni.request

```js
// Promise 风格（推荐，不传 success/fail 回调自动返回 Promise）
const [err, res] = await uni.request({
  url: 'https://api.example.com/users',
  method: 'GET',           // GET | POST | PUT | DELETE | PATCH
  data: { page: 1 },
  header: {
    'content-type': 'application/json',
    'Authorization': 'Bearer token'
  },
  timeout: 60000,
  dataType: 'json',        // json | text（默认 json，自动 JSON.parse）
  responseType: 'text'     // text | arraybuffer
})
if (!err) {
  console.log(res.statusCode, res.data)
}

// 拦截器（全局设置）
uni.addInterceptor('request', {
  invoke(args) {
    args.header = { ...args.header, token: uni.getStorageSync('token') }
  },
  success(res) {
    if (res.data.code === 401) uni.navigateTo({ url: '/pages/login/login' })
  }
})
```

### uni.uploadFile / downloadFile

```js
// 上传文件
const [err, res] = await uni.uploadFile({
  url: 'https://api.example.com/upload',
  filePath: tempFilePath,     // 本地临时路径
  name: 'file',
  formData: { user: 'john' }
})

// 下载文件
const [err, res] = await uni.downloadFile({
  url: 'https://example.com/file.pdf'
})
if (!err) console.log(res.tempFilePath)
```

## 路由导航

```js
// 保留当前页，跳转新页（可返回，最多10层栈）
uni.navigateTo({ url: '/pages/detail/detail?id=1&type=news' })

// 关闭当前页，跳转新页（不可返回）
uni.redirectTo({ url: '/pages/login/login' })

// 关闭所有页，打开新页（重置路由栈）
uni.reLaunch({ url: '/pages/index/index' })

// 切换 tabBar 页（tabBar 页面必须用此方法）
uni.switchTab({ url: '/pages/home/home' })

// 返回上一页
uni.navigateBack({ delta: 1 })

// 页面间通信（navigateTo 回调）
uni.navigateTo({
  url: '/pages/child/child',
  events: {
    acceptDataFromChild: (data) => { console.log(data) }
  },
  success: (res) => {
    res.eventChannel.emit('sendToChild', { msg: 'hello' })
  }
})
```

## UI 交互

```js
// Toast 提示
uni.showToast({ title: '操作成功', icon: 'success', duration: 2000 })
uni.showToast({ title: '错误信息', icon: 'error' })
uni.showToast({ title: '纯文本提示', icon: 'none', duration: 3000 })
uni.hideToast()

// Loading
uni.showLoading({ title: '加载中...', mask: true })  // mask 防止穿透点击
uni.hideLoading()

// 模态弹窗
const { confirm, cancel } = await uni.showModal({
  title: '确认操作',
  content: '此操作不可撤销，是否继续？',
  confirmText: '确认',
  cancelText: '取消',
  confirmColor: '#FF4D4F'
})
if (confirm) doAction()

// 操作菜单
const { tapIndex } = await uni.showActionSheet({
  title: '请选择',
  itemList: ['拍照', '从相册选择', '取消']
})

// 导航栏标题
uni.setNavigationBarTitle({ title: '动态标题' })
uni.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#007AFF' })

// tabBar 角标
uni.setTabBarBadge({ index: 0, text: '99+' })
uni.removeTabBarBadge({ index: 0 })
uni.showTabBarRedDot({ index: 1 })
```

## 数据存储

```js
// 同步（推荐，适合小数据）
uni.setStorageSync('userInfo', { name: 'John', age: 30 })
const userInfo = uni.getStorageSync('userInfo')     // 自动 JSON 解析
uni.removeStorageSync('userInfo')
uni.clearStorageSync()

// 异步（适合大数据或不阻塞渲染时）
uni.setStorage({ key: 'key', data: value })
uni.getStorage({ key: 'key', success: ({ data }) => {} })

// 获取存储信息
const { keys, currentSize, limitSize } = uni.getStorageInfoSync()
```

## 媒体

```js
// 选择图片（支持相机/相册）
const { tempFilePaths } = await uni.chooseImage({
  count: 9,
  sizeType: ['original', 'compressed'],
  sourceType: ['album', 'camera']
})

// 预览图片
uni.previewImage({
  urls: imageList,
  current: clickedUrl
})

// 选择视频
const { tempFilePath } = await uni.chooseVideo({
  sourceType: ['album', 'camera'],
  maxDuration: 60
})

// 保存图片到相册
await uni.saveImageToPhotosAlbum({ filePath: localPath })
```

## 位置

```js
// 获取当前位置
const { latitude, longitude } = await uni.getLocation({
  type: 'wgs84',    // wgs84 | gcj02（gcj02 用于腾讯/高德地图）
  altitude: false
})

// 打开地图选择位置
const { latitude, longitude, name } = await uni.chooseLocation()

// 在地图上查看位置
uni.openLocation({
  latitude: 39.909,
  longitude: 116.397,
  name: '天安门',
  address: '北京市东城区'
})
```

## 设备信息

```js
// 系统信息（同步）
const {
  platform,          // 'ios' | 'android' | 'devtools'
  system,            // 'iOS 16.0' | 'Android 12'
  brand,             // 手机品牌
  model,             // 手机型号
  windowWidth,
  windowHeight,
  screenWidth,
  screenHeight,
  statusBarHeight,   // 状态栏高度（px）
  safeArea,          // { top, right, bottom, left, width, height }
  safeAreaInsets,    // { top, right, bottom, left }
  pixelRatio,
  language,
  version            // 宿主版本（微信版本号 / App 版本号）
} = uni.getSystemInfoSync()

// 获取胶囊按钮位置（微信小程序）
// #ifdef MP-WEIXIN
const { top, right, bottom, left, width, height } = wx.getMenuButtonBoundingClientRect()
// #endif

// 网络状态
const { networkType } = await uni.getNetworkType()  // wifi | 4g | 3g | 2g | none | unknown

// 剪贴板
uni.setClipboardData({ data: '复制内容' })
const { data } = await uni.getClipboardData()

// 振动
uni.vibrateShort()  // 短振动（15ms）
uni.vibrateLong()   // 长振动（400ms）
```

## 扫码

```js
// #ifndef H5
const { result } = await uni.scanCode({
  scanType: ['qrCode', 'barCode'],
  onlyFromCamera: false
})
console.log('扫码结果:', result)
// #endif
```

## 权限（App 端）

```js
// #ifdef APP-PLUS
// 检查权限
plus.android.requestPermissions(
  ['android.permission.CAMERA'],
  (e) => { console.log('授权成功') },
  (e) => { console.log('用户拒绝') }
)
// #endif
```

## 小程序专属

```js
// 获取用户信息（需用户点击授权按钮）
// #ifdef MP-WEIXIN
wx.login({ success: ({ code }) => { /* 发送 code 到后端换 token */ } })
// #endif

// 订阅消息（微信小程序）
// #ifdef MP-WEIXIN
wx.requestSubscribeMessage({
  tmplIds: ['模板ID'],
  success: (res) => {}
})
// #endif
```

## 工具方法

```js
// 单位转换：rpx 转 px
const px = uni.upx2px(750)  // 在当前设备上 750rpx 对应的 px 值

// 创建选择器查询
const query = uni.createSelectorQuery()
query.select('#myElement').boundingClientRect((rect) => {
  console.log(rect.top, rect.left, rect.width, rect.height)
}).exec()

// 页面滚动
uni.pageScrollTo({ scrollTop: 0, duration: 300 })
