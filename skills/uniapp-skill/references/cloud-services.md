# 云服务参考

## UniPush 2.0（推送通知）

### 特点

- 全平台推送：App（原生 SDK）+ 小程序/H5（Socket 在线推送）
- 聚合厂商离线推送：华为、小米、OPPO、vivo、魅族 + Apple APNs
- 免费使用，费用极低（uniCloud 云函数调用费 0.0133元/万次）
- 云端一体：云函数处理推送逻辑，无需复杂后端

### 客户端配置

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
// 获取推送客户端 ID（注册到服务端用于定向推送）
const { cid } = await uni.getPushClientId()
console.log('推送 ID:', cid)

// 监听推送消息
uni.onPushMessage((res) => {
  if (res.type === 'click') {
    // 用户点击通知栏
    console.log('通知被点击:', res.data)
    if (res.data?.page) {
      uni.navigateTo({ url: res.data.page })
    }
  }
  if (res.type === 'receive') {
    // 在线收到透传消息
    console.log('收到透传:', res.data)
  }
})
uni.offPushMessage(callback)

// Android 8+ 通知渠道管理
const channelManager = uni.getChannelManager()
channelManager.setPushChannel({
  channelId: 'order',
  channelDesc: '订单通知',
  soundName: 'order_sound'  // raw 目录下的音频文件名
})
```

### 服务端发送（uniCloud 云函数）

```js
// 云函数中使用 uni-cloud-push 扩展库
const uniPush = uniCloud.getPushManager({ appId: '__UNI__XXXXXX' })

// 推送给指定用户
await uniPush.sendMessage({
  push_clientid: ['客户端ID'],     // 或 user_id / user_tag
  title: '新订单通知',
  content: '您有一笔新订单',
  payload: { page: '/pages/order/detail?id=123' },
  force_notification: true,        // 在线时也强制显示通知栏
  request_id: 'unique-id-001',
  options: {
    HW: { '/message/android/notification/image': 'https://...' },  // 华为大图
    XM: {},  // 小米
    OP: {},  // OPPO
    VO: {}   // vivo
  }
})
```

### WebSocket 域名白名单

小程序需配置：`wshzn.gepush.com`、`wshzn.getui.net`（端口 5223）

---

## 一键登录（univerify）

### 特点

- 运营商网关认证，无需短信验证码
- 支持移动/联通/电信三大运营商
- 费用：约 0.2 分/次（通过 uniCloud 使用）
- 比短信验证更安全（无短信劫持风险）

### 客户端

```js
// 预登录（提前调用，加快弹窗弹出速度）
uni.preLogin({ provider: 'univerify' })

// 发起一键登录
uni.login({
  provider: 'univerify',
  univerifyStyle: {
    fullScreen: true,
    backgroundColor: '#ffffff',
    icon: { path: '/static/logo.png', width: '60px', height: '60px' },
    phoneNum: { color: '#333', fontSize: '18px' },
    slogan: { color: '#999' },
    authButton: { normalColor: '#007AFF', highlightColor: '#0062CC', textColor: '#fff' },
    privacyTerms: {
      defaultCheckBoxState: true,
      textColor: '#999',
      termsColor: '#007AFF',
      links: [
        { url: 'https://example.com/privacy', name: '隐私政策' },
        { url: 'https://example.com/agreement', name: '用户协议' }
      ]
    }
  },
  success: (res) => {
    // res.authResult 包含 access_token 和 openid
    // 发送到服务端换取手机号
    uniCloud.callFunction({
      name: 'get-phone',
      data: { access_token: res.authResult.access_token, openid: res.authResult.openid }
    })
  }
})

// 关闭登录界面
uni.closeAuthView()
```

### 服务端换取手机号（uniCloud 云函数）

```js
// 云函数 get-phone
exports.main = async (event) => {
  const res = await uniCloud.getPhoneNumber({
    appid: '__UNI__XXXXXX',
    provider: 'univerify',
    apiKey: 'xxx',              // 开发者中心获取
    apiSecret: 'xxx',
    access_token: event.access_token,
    openid: event.openid
  })
  return { phoneNumber: res.phoneNumber }
}
```

### 前提条件

- 手机已装 SIM 卡且开启数据流量
- 需开通 uniCloud 服务（不要求全部业务迁移到 uniCloud）

---

## uni 统计 2.0

### 特点

- 开源、全平台、云端一体的统计服务
- 数据存储在开发者自己的 uniCloud 空间（数据自主可控）
- 免费使用

### 功能模块

| 模块 | 功能 |
|------|------|
| 设备统计 | 新增/活跃/留存/流失用户 |
| 注册用户 | 注册量/活跃/留存分析 |
| 页面统计 | PV/UV、页面访问路径 |
| 内容统计 | 文章/商品热度分析 |
| 渠道分析 | 各分发渠道效果对比 |
| JS 错误 | 前端错误捕获（支持 sourcemap） |
| 崩溃统计 | 原生 App 崩溃按版本分析 |
| 自定义事件 | `uni.report('event_name', { data })` |

### 接入方式

```json
// manifest.json
{
  "uniStatistics": {
    "enable": true
  }
}
```

```js
// 自定义事件上报
uni.report('purchase', {
  item_id: '12345',
  price: 99.9,
  category: '数码'
})

// 内容统计标题（uni-title 组件自动上报）
uni.report('title', '文章标题')
```

### 管理后台

使用 `uni-admin` 后台管理系统查看统计数据，支持自定义扩展仪表盘。

---

## uniCloud 简介

### 核心服务

| 服务 | 说明 |
|------|------|
| 云函数/云对象 | Node.js 后端逻辑 |
| 云数据库 | JSON 文档数据库（MongoDB 兼容） |
| 云存储 | 文件上传/下载/CDN |
| 前端网页托管 | 静态网站部署（H5/SSR） |
| uni-id | 统一身份认证（用户系统） |
| uniPay | 统一支付（微信/支付宝/Apple IAP） |
| uni-push | 统一推送 |
| JQL | 数据库前端直查语法 |

### 前端直接调用

```js
// 调用云函数
const res = await uniCloud.callFunction({
  name: 'get-list',
  data: { page: 1, size: 20 }
})

// 调用云对象
const todoObj = uniCloud.importObject('todo')
const list = await todoObj.getList({ page: 1 })
await todoObj.add({ title: '新任务', done: false })

// 前端直接查询数据库（JQL）
const db = uniCloud.database()
const { data } = await db.collection('articles')
  .where('status == 1')
  .orderBy('createTime', 'desc')
  .limit(20)
  .get()

// 云存储上传
const { fileID } = await uniCloud.uploadFile({
  filePath: tempFilePath,
  cloudPath: 'images/' + Date.now() + '.jpg'
})
```

### 云服务商选择

- **阿里云**：国内访问快，免费额度大
- **腾讯云**：支持 IP 白名单等高级功能
- 两个服务商 API 完全一致，可随时迁移

---

## 广告变现（uni-AD）

```vue
<!-- 信息流/Banner 广告 -->
<ad adpid="广告位ID" @load="onAdLoad" @error="onAdError" @close="onAdClose" />

<!-- 激励视频广告 -->
<script setup>
const showRewardedAd = () => {
  const ad = uni.createRewardedVideoAd({ adpid: '广告位ID' })
  ad.onLoad(() => { ad.show() })
  ad.onClose((res) => {
    if (res.isEnded) {
      // 用户看完广告，发放奖励
    }
  })
  ad.onError((err) => { console.error(err) })
  ad.load()
}
</script>
```

### 支持的广告类型

| 类型 | 说明 | 平台 |
|------|------|------|
| Banner | 页面内横幅 | App/小程序/H5 |
| 信息流 | 原生嵌入内容 | App/小程序 |
| 激励视频 | 看完视频获奖励 | App/小程序 |
| 全屏视频 | 全屏播放 | App |
| 插屏广告 | 弹窗广告 | App/小程序 |
| 互动广告 | 互动游戏 | App |
| 开屏广告 | App 启动页 | App |

注册地址：https://uniad.dcloud.net.cn/

---

## 扩展数据库（MongoDB 版）

HBuilderX 4.84+ 新增，解决传统 serverless 云数据库在稳定性、语法兼容度、独立工具管理等方面的瓶颈。

### 核心优势

| 维度 | 传统云数据库 | 扩展数据库 MongoDB 版 |
|------|-------------|---------------------|
| 底层 | DCloud 托管 JSON 文档库 | 标准 MongoDB 实例 |
| 语法 | JQL（简化语法） | JQL + 原生 MongoDB 聚合管道 |
| 工具 | 仅 HBuilderX / uniCloud 控制台 | 可用 Compass / mongosh 等独立工具 |
| 稳定性 | 共享资源，偶有波动 | 独立实例，SLA 更高 |
| 适用场景 | 轻量应用 | 中大型项目、复杂查询、高并发 |

### 使用方式

```js
// 前端 JQL 用法不变
const db = uniCloud.database()
const { data } = await db.collection('orders')
  .aggregate()
  .match({ status: 'paid' })
  .group({ _id: '$userId', total: { $sum: '$amount' } })
  .end()

// 云函数中可使用更多原生 MongoDB 操作
const db = uniCloud.database()
const collection = db.collection('logs')
await collection.aggregate([
  { $match: { level: 'error', createdAt: { $gt: lastWeek } } },
  { $group: { _id: '$module', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).end()
```

### 迁移

从传统云数据库迁移到扩展数据库 MongoDB 版，JQL 代码无需修改，仅需在 uniCloud 控制台切换数据库类型并导入数据。

---

## uni-ai

uni-ai 支持客户端通过临时 token 直连 LLM，避免云函数中转产生持续费用。

### 支持的模型服务商

- 阿里云百炼（通义千问系列）
- 七牛云模型服务
- 更多服务商持续接入中

### 客户端直连模式

```js
// 获取临时 token（通过云函数，避免暴露密钥）
const { token } = await uniCloud.callFunction({
  name: 'get-ai-token',
  data: { model: 'qwen-turbo' }
})

// 客户端直连 LLM（流式输出）
const sseChannel = new uniCloud.SSEChannel()
sseChannel.on('message', (msg) => {
  // 逐字输出
  answer.value += msg.data
})
await sseChannel.open({
  url: 'https://ai-gateway.dcloud.net.cn/v1/chat/completions',
  header: { Authorization: `Bearer ${token}` },
  data: {
    model: 'qwen-turbo',
    messages: [{ role: 'user', content: '你好' }],
    stream: true
  }
})
```

### 云函数中转模式

```js
// 云函数 get-ai-response
const uniAI = require('@dcloudio/uni-ai')
exports.main = async (event) => {
  const llm = uniAI.createLLM({ provider: 'aliyun-bailian' })
  const res = await llm.chatCompletion({
    messages: event.messages,
    model: 'qwen-turbo'
  })
  return { reply: res.choices[0].message.content }
}
```

### uni-ai-chat 模板

DCloud 提供开箱即用的 AI 对话模板（`uni-ai-chat`），包含：
- 多轮对话 UI
- 流式输出
- Markdown 渲染
- 历史记录存储

---

## 扩展存储

HBuilderX 4.84+ 增强的云存储能力。

### 新增能力

| 功能 | 说明 |
|------|------|
| 视频转码 API | 上传视频后自动转码为多种分辨率/格式 |
| getUploadFileOptions | 获取直传参数，支持客户端直传 CDN（绕过云函数） |
| listFiles marker | 分页列举文件，支持 marker 游标翻页 |
| uni 直播回放生成 | 直播结束后自动生成回放视频文件 |

### 视频转码示例

```js
// 云函数中发起转码
const result = await uniCloud.getTempFileURL({
  fileList: [fileID]
})

// 转码任务（通过扩展存储 API）
await uniCloud.invokeExtension('video-transcode', {
  fileID: 'cloud://xxx/video.mp4',
  outputs: [
    { format: 'mp4', resolution: '720p' },
    { format: 'mp4', resolution: '1080p' }
  ]
})
```

### 客户端直传

```js
// 获取直传参数（减少云函数调用）
const uploadOptions = await uniCloud.callFunction({
  name: 'get-upload-options',
  data: { filename: 'photo.jpg' }
})

// 使用返回的签名参数直传到 CDN
uni.uploadFile({
  url: uploadOptions.uploadUrl,
  filePath: tempFilePath,
  name: 'file',
  formData: uploadOptions.formData
})
```
