# App 原生能力参考

## OAuth 登录

### 统一登录 API

```js
// uni.login() —— 跨平台统一入口
// provider: weixin | qq | sinaweibo | apple | univerify | google | facebook
uni.login({
  provider: 'weixin',
  success: (res) => {
    console.log('授权码:', res.code)
    // 将 code 发送到后端，换取 token
  }
})

// 获取用户信息（登录后调用）
uni.getUserInfo({
  provider: 'weixin',
  success: (res) => {
    console.log(res.userInfo)  // { nickName, avatarUrl, gender, ... }
  }
})
```

### 各平台接入流程

1. 前往第三方平台注册应用，获取 appid
2. 在 HBuilderX manifest.json → App模块配置 → OAuth 中填入参数
3. 制作自定义调试基座（标准基座不含第三方 SDK）
4. 调用 `uni.login()` 获取授权码
5. 后端验证授权码，返回业务 token

### 一键登录（univerify）

```js
// 预登录（提前调用，加快弹窗速度）
uni.preLogin({ provider: 'univerify' })

// 发起一键登录
uni.login({
  provider: 'univerify',
  univerifyStyle: {
    fullScreen: true,
    backgroundColor: '#ffffff',
    buttons: { color: '#007AFF' }
  },
  success: (res) => {
    // res.authResult 包含 token，发送到后端换取手机号
  }
})

// 关闭登录界面
uni.closeAuthView()
```

> 推荐：使用 uniCloud 的 `uni-id` 服务统一处理后端认证逻辑。

---

## 支付

### 统一支付 API

```js
uni.requestPayment({
  provider: 'wxpay',            // wxpay | alipay | appleiap | stripe | paypal | google-pay
  orderInfo: orderData,          // 后端生成的支付参数
  success: (res) => {
    uni.showToast({ title: '支付成功' })
  },
  fail: (err) => {
    if (err.errMsg.includes('cancel')) {
      uni.showToast({ title: '已取消支付', icon: 'none' })
    }
  }
})
```

### 支付流程

1. 向第三方支付平台申请商户号
2. 后端创建订单，生成支付参数（签名等）
3. 前端调用 `uni.requestPayment()` 拉起支付
4. 支付完成后前端收到回调，同时后端收到异步通知

### Apple 内购（IAP）

```js
// #ifdef APP-PLUS
uni.requestPayment({
  provider: 'appleiap',
  orderInfo: {
    productid: 'com.example.product01'   // App Store Connect 中配置的产品 ID
  }
})
// #endif
```

> 推荐：使用 uniCloud 的 `uniPay` 服务统一处理服务端支付逻辑。

### uni-pay 2.x（uniCloud 云端一体支付）

基于 uniCloud 的统一支付方案，前后端一体化，无需自建支付服务器。

```js
// 1. 安装 uni-pay 插件（从插件市场导入到 uni_modules）
// 2. 配置 uni-pay 云端密钥（uniCloud 云函数 uni-pay-co/config.js）
// {
//   wxpay: { appId, mchId, v3Key, certPath... },
//   alipay: { appId, privateKey, alipayPublicKey... }
// }

// 3. 前端创建订单并支付
import uniPay from '@/uni_modules/uni-pay/js_sdk/uni-pay.js'

const pay = uniPay.createPay({ provider: 'wxpay' })

// 创建订单
const orderRes = await pay.createOrder({
  totalFee: 100,           // 单位：分
  orderNo: 'ORDER_' + Date.now(),
  subject: '商品名称',
  body: '商品描述',
  notifyUrl: 'https://your-server.com/pay/notify'  // 可选，默认用云函数回调
})

// 发起支付
await pay.requestPayment({
  provider: 'wxpay',       // wxpay | alipay
  orderInfo: orderRes.orderInfo
})

// 4. 支付结果查询（主动轮询，作为回调补充）
const queryRes = await pay.queryOrder({ orderNo: 'ORDER_xxx' })
if (queryRes.status === 'SUCCESS') {
  // 支付成功
}
```

**uni-pay 支持的支付方式：**

| 支付方式 | App | 微信小程序 | H5 |
|---------|-----|-----------|-----|
| 微信支付 | App支付 | JSAPI支付 | H5支付 |
| 支付宝 | App支付 | - | 手机网站支付 |
| Apple IAP | 内购 | - | - |

**最佳实践：**
- 支付密钥只存放在云函数端，前端不接触
- 做好支付结果主动查询（轮询），不完全依赖异步回调
- 订单超时未支付需做关单处理
- 使用 `uni-pay` 的 `paySuccess` 回调云函数处理业务逻辑

---

## 推送通知

### UniPush（推荐，免费集成）

```json
// manifest.json
{
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "push": { "unipush": {} }
      }
    }
  }
}
```

```js
// 获取设备推送 ID（用于服务端发送）
// #ifdef APP-PLUS
const clientInfo = plus.push.getClientInfo()
console.log('推送 clientId:', clientInfo.clientid)

// 监听通知栏点击
plus.push.addEventListener('click', (msg) => {
  console.log('用户点击了通知:', msg.payload)
  // 根据 payload 跳转到指定页面
  if (msg.payload?.page) {
    uni.navigateTo({ url: msg.payload.page })
  }
})

// 监听透传消息（静默消息）
plus.push.addEventListener('receive', (msg) => {
  console.log('收到透传:', msg.payload)
})
// #endif
```

### 注意事项

- Android ROM 可能会杀掉后台进程，推送不一定能到达
- 推送不适合作为实时通信的唯一通道
- 透传消息需要 JSON 格式才会在通知栏显示
- 必须使用云打包（含 SDK）才能测试推送

---

## 分享

### 系统分享

```js
// 调用系统分享面板（全平台通用）
uni.shareWithSystem({
  type: 'text',
  summary: '分享内容',
  href: 'https://example.com'
})
```

### 平台分享

```js
// 微信好友
uni.share({
  provider: 'weixin',
  scene: 'WXSceneSession',      // WXSceneSession(好友) | WXSceneTimeline(朋友圈) | WXSceneFavorite(收藏)
  type: 0,                       // 0图文 | 1纯文字 | 2纯图片 | 3音乐 | 4视频 | 5小程序
  title: '分享标题',
  summary: '分享描述',
  imageUrl: 'https://example.com/share.png',
  href: 'https://example.com'
})
```

### 小程序端分享

```vue
<script setup>
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

// 分享给朋友
onShareAppMessage(() => ({
  title: '分享标题',
  path: '/pages/index/index?from=share',
  imageUrl: '/static/share.png'
}))

// 分享到朋友圈（仅微信）
onShareTimeline(() => ({
  title: '分享标题',
  query: 'from=timeline'
}))
</script>
```

---

## 安全加固（Android）

- **uni 安全加固**：代码加密 + 防篡改 + 防重打包
- 使用方式：DCloud 开发者中心 → uni 安全加固 → 上传 APK
- 加固后需用**相同证书**重新签名
- 测试版免费（15 天有效），正式版 600 元/次

---

## Android 隐私合规

### 配置隐私弹窗

在项目根目录创建 `androidPrivacy.json`：

```json
{
  "version": "1",
  "prompt": "template",
  "title": "用户协议和隐私政策",
  "message": "请仔细阅读<a href=\"https://example.com/agreement\">用户协议</a>和<a href=\"https://example.com/privacy\">隐私政策</a>",
  "buttonAccept": "同意并继续",
  "buttonRefuse": "不同意",
  "second": {
    "title": "温馨提示",
    "message": "拒绝后将无法使用完整功能",
    "buttonAccept": "同意",
    "buttonRefuse": "退出应用"
  }
}
```

### 注意事项

- 用户同意前不得采集设备信息
- 需在隐私政策中披露 DCloud uni-app SDK 的数据采集行为
- HBuilderX 3.2.1+ 支持可视化配置

---

## App 渠道包

```json
// manifest.json 根节点
{
  "channel_list": [
    { "id": "google", "name": "Google Play" },
    { "id": "huawei", "name": "华为应用市场" },
    { "id": "xiaomi", "name": "小米应用商店" }
  ]
}
```

```js
// 运行时获取渠道标识
// #ifdef APP-PLUS
const channel = plus.runtime.channel  // 当前渠道 ID
console.log('当前渠道:', channel)
// #endif
```

默认渠道包括：GooglePlay、360、小米、华为、QQ、vivo、oppo。
