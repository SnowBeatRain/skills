# uni-app 进阶网络能力

官方文档：<https://uniapp.dcloud.net.cn/api/request/websocket.html>

本文覆盖 `uni-app` 中除 `uni.request` 之外的进阶网络能力：WebSocket、UDP、mDNS。普通 HTTP 请求见 `api.md`。

---

## WebSocket

WebSocket 用于客户端与服务端建立长连接，适合即时通讯、实时通知、在线协作等场景。

### 平台差异速览

| 平台 | 关键限制 |
|------|----------|
| 微信小程序 | 必须使用 `wss://`，最多 5 个并发连接；需配置服务器域名白名单 |
| App | 2.2.6+ 支持 `ArrayBuffer` 收发与多连接；老版本需 `plus-websocket` 插件 |
| H5 | 遵循浏览器 WebSocket 规范 |
| 支付宝/抖音/QQ/百度 | 并发数与协议细节参阅各平台文档 |

> 全局 socket（`uni.onSocketOpen` 等）已废弃，**推荐使用 `SocketTask`**，可多实例管理，生命周期更清晰。

### 创建连接

```js
const socketTask = uni.connectSocket({
  url: 'wss://www.example.com/socket',
  header: {
    'content-type': 'application/json',
    'Authorization': 'Bearer token'
  },
  protocols: ['chat-protocol'],
  complete: () => {}
})
```

> 不传 `success / fail / complete` 时返回 Promise；需要拿到 `SocketTask` 实例时必须传其中一个空回调。

### 事件监听

```js
socketTask.onOpen((res) => {
  console.log('WebSocket 已连接', res.header)
})

socketTask.onMessage((res) => {
  // res.data 为 String 或 ArrayBuffer
  console.log('收到消息:', res.data)
})

socketTask.onError((res) => {
  console.error('连接错误:', res.errMsg)
})

socketTask.onClose((res) => {
  console.log('连接关闭 code=', res.code, 'reason=', res.reason)
})
```

### 发送与关闭

```js
// 发送文本
socketTask.send({ data: JSON.stringify({ type: 'ping' }) })

// 发送二进制（App 2.2.6+）
const buffer = new ArrayBuffer(8)
socketTask.send({ data: buffer })

// 正常关闭
socketTask.close({ code: 1000, reason: '用户退出' })
```

### 完整封装示例

```js
// composables/useWebSocket.js
import { ref, onUnmounted } from 'vue'

export function useWebSocket(url, options = {}) {
  const status = ref('closed') // closed / connecting / open / error
  const task = ref(null)
  const messageQueue = []

  const connect = () => {
    if (task.value) return
    status.value = 'connecting'

    task.value = uni.connectSocket({
      url,
      header: options.header || {},
      protocols: options.protocols || [],
      complete: () => {}
    })

    task.value.onOpen(() => {
      status.value = 'open'
      while (messageQueue.length) {
        const msg = messageQueue.shift()
        task.value.send({ data: msg })
      }
      options.onOpen?.()
    })

    task.value.onMessage((res) => {
      options.onMessage?.(res.data)
    })

    task.value.onError((res) => {
      status.value = 'error'
      options.onError?.(res)
    })

    task.value.onClose(() => {
      status.value = 'closed'
      task.value = null
      options.onClose?.()
    })
  }

  const send = (data) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    if (status.value === 'open') {
      task.value.send({ data: payload })
    } else {
      messageQueue.push(payload)
    }
  }

  const close = (code = 1000, reason = '') => {
    task.value?.close({ code, reason })
  }

  onUnmounted(() => close())

  return { status, connect, send, close }
}
```

### 注意事项

1. **域名白名单**：小程序平台需在管理后台配置 socket 合法域名；H5/App 无此限制。
2. **心跳与重连**：长连接需要自行实现心跳保活和断线重连，框架不自动处理。
3. **并发限制**：微信小程序最多 5 个并发 `SocketTask`；开发阶段关闭"运行日志回显"可释放一个通道。
4. **内存限制**：Android 端发送队列内存上限约 16M，超出会导致连接被关闭。
5. **时序问题**：必须在 `onOpen` 回调之后再调用 `send` 或 `close`。

---

## UDP 通信

UDP 适用于低延迟、可容忍丢包的场景，如局域网发现、实时音视频传输、游戏同步等。

### 平台支持

| 平台 | 支持情况 |
|------|----------|
| 微信小程序 | 原生支持 `wx.createUDPSocket`，可通过 `uni` 条件编译调用 |
| App | 插件市场搜索 [UDP 插件](https://ext.dcloud.net.cn/search?q=udp) |
| H5 / 其他小程序 | 一般不支持原生 UDP |

### 微信小程序示例

```js
// #ifdef MP-WEIXIN
const udp = wx.createUDPSocket()
udp.bind() // 绑定随机端口

udp.onMessage((res) => {
  const { remoteInfo, message } = res
  console.log('来自', remoteInfo.address, remoteInfo.port, ':', message)
})

udp.send({
  address: '192.168.1.100',
  port: 8080,
  message: 'hello udp'
})

// 页面卸载时关闭
onUnload(() => {
  udp.close()
})
// #endif
```

### 注意事项

- UDP 不保证可靠到达，业务层需要自行处理丢包、重传、顺序问题。
- 小程序端只能在局域网或已备案的服务器 IP 上使用，受平台安全策略限制。

---

## mDNS 局域网服务发现

mDNS（多播 DNS）用于在局域网内发现服务，如打印机、智能家居设备、本地服务器等。

### 平台支持

| 平台 | 支持情况 |
|------|----------|
| 微信小程序 | 原生支持局域网服务发现 |
| App | 插件市场搜索 [mDNS 插件](https://ext.dcloud.net.cn/search?q=mdns) |

### 微信小程序示例

```js
// #ifdef MP-WEIXIN
// 开始搜索指定类型的局域网服务
wx.startLocalServiceDiscovery({
  serviceType: '_http._tcp.',
  success: (res) => {
    console.log('开始发现服务', res)
  },
  fail: (err) => {
    console.error('发现服务失败', err)
  }
})

// 监听服务发现
wx.onLocalServiceFound((res) => {
  console.log('发现服务:', res.serviceName, res.serviceType, res.ip, res.port)
})

// 监听服务解析失败
wx.onLocalServiceResolveFail((res) => {
  console.warn('服务解析失败:', res.serviceName)
})

// 监听服务消失
wx.onLocalServiceLost((res) => {
  console.log('服务消失:', res.serviceName)
})

// 停止搜索
wx.stopLocalServiceDiscovery({
  success: () => console.log('已停止发现')
})
// #endif
```

### 注意事项

- mDNS 依赖局域网环境，且部分 Android 机型对多播支持不完整。
- 小程序端仅支持发现，不支持发布服务；如需发布服务请使用原生 App 插件或 Native.js。
- 搜索完成后务必调用 `stopLocalServiceDiscovery` 释放资源。

---

## 选型建议

| 场景 | 推荐方案 |
|------|----------|
| 即时通讯、实时通知、协作编辑 | WebSocket（`SocketTask`） |
| 低延迟音视频、游戏状态同步、局域网广播 | UDP（小程序原生 / App 插件） |
| 发现局域网设备/服务 | mDNS（小程序原生 / App 插件） |
| 普通 HTTP REST | `uni.request`（见 `api.md`） |

---

## 相关参考

- `api.md`：HTTP 请求、上传下载、路由导航
- `system-device-api.md`：网络状态、设备信息
- `cloud-services.md`：UniPush 2.0（其非离线模式底层也使用 socket）
