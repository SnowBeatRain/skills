# uni-app 广告变现参考

官方文档：<https://uniapp.dcloud.net.cn/uni-ad/uni-ad.html>

`uni-ad` 是 DCloud 提供的广告联盟，支持一次开发、多端变现。本文覆盖常见广告形式的接入方式、平台差异与安全注意事项。

---

## 广告形式速览

| 广告形式 | 接入方式 | 典型场景 |
|----------|----------|----------|
| 信息流 / Banner | `<ad>` 组件 | 列表顶部/中部、详情页顶部 |
| 激励视频 | `uni.createRewardedVideoAd` | 看视频得奖励、复活、解锁内容 |
| 插屏广告 | `uni.createInterstitialAd` | 页面切换间隙全屏展示 |
| 全屏视频广告 | `uni.createFullScreenVideoAd` | 类似激励视频，但无需奖励 |
| 沉浸视频流 | `<ad-draw>` / `<ad-content-page>` | 短视频流、内容联盟 |
| 开屏广告 | 原生配置 | App 启动页 |
| 微信小程序广告 | `<ad>` / 微信原生广告组件 | 微信小程序内变现 |

---

## 开通配置

1. **注册广告平台**：
   - App / H5 / 微信小程序：[https://uniad.dcloud.net.cn/](https://uniad.dcloud.net.cn/)
   - 其他小程序：在各自小程序管理后台开通
2. **创建广告位**，获取 `adpid`（App/H5）或 `ad-unit-id`（微信小程序）
3. **配置 `manifest.json`**：App 端打包时需勾选对应的广告 SDK（穿山甲、优量汇、快手、百度等）
4. **编写代码**并打包发布

> 微信小程序广告也可直接使用微信原生 `<ad>` 组件，在小程序后台注册。

---

## 信息流广告（Banner）

### 组件用法

```vue
<template>
  <view>
    <!-- App/H5 使用 adpid -->
    <ad adpid="1234567890" @load="onAdLoad" @error="onAdError" @close="onAdClose"></ad>

    <!-- #ifdef MP-WEIXIN -->
    <ad unit-id="adunit-xxxxxxxx" ad-type="video" ad-theme="white"></ad>
    <!-- #endif -->
  </view>
</template>
```

### 常用属性

| 属性 | 说明 | 平台 |
|------|------|------|
| `adpid` | uni-ad 广告位 ID | App、H5 |
| `unit-id` | 微信/平台广告位 ID | 小程序 |
| `ad-type` | 广告类型：banner、video、grid 等 | 微信小程序 |
| `ad-theme` | 主题：white、black | 微信小程序 |

### 事件

| 事件 | 说明 |
|------|------|
| `@load` | 广告加载成功 |
| `@error` | 广告加载失败，`event.detail` 含错误码 |
| `@close` | 广告关闭 |

---

## 激励视频广告

激励视频是最常见的广告变现方式，用户完整观看视频后获得奖励。

### 平台支持

| 平台 | 支持版本 |
|------|----------|
| App | 2.5.11+ |
| 微信小程序 | 2.6.0+ |
| QQ 小程序 | 0.1.26+ |
| 抖音小程序 | 1.57.0+ |

### 基础用法

```js
let rewardedVideoAd = null

export default {
  onReady() {
    if (uni.createRewardedVideoAd) {
      rewardedVideoAd = uni.createRewardedVideoAd({
        adpid: '1507000689' // App/H5
        // #ifdef MP-WEIXIN
        , adUnitId: 'adunit-xxxxxx'
        // #endif
      })

      rewardedVideoAd.onLoad(() => {
        console.log('激励视频加载成功')
      })

      rewardedVideoAd.onError((err) => {
        console.error('激励视频加载失败', err)
      })

      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          console.log('用户完整观看，发放奖励')
          this.grantReward()
        } else {
          console.log('用户中途关闭，不发放奖励')
        }
      })
    }
  },

  methods: {
    showRewardedAd() {
      if (!rewardedVideoAd) {
        uni.showToast({ title: '当前平台不支持', icon: 'none' })
        return
      }

      rewardedVideoAd.show().catch(() => {
        // 加载失败时手动重新拉取
        rewardedVideoAd.load()
          .then(() => rewardedVideoAd.show())
          .catch((err) => {
            console.error('激励视频显示失败', err)
          })
      })
    },

    grantReward() {
      // 必须联网校验，防止客户端作弊
      uni.request({
        url: 'https://api.example.com/reward',
        method: 'POST',
        data: { userId: uni.getStorageSync('userId') }
      })
    }
  }
}
```

### 安全注意

- **奖励发放必须服务端校验**：客户端 `onClose` 回调可被篡改，不可仅凭 `isEnded` 直接发放重要奖励。
- **使用服务器回调**：uni-ad 支持服务器回调，在广告平台配置回调 URL，由广告平台直接通知服务端发放奖励。
- **防止快速连续点击**：展示广告期间禁用按钮，避免重复调用 `show()`。

---

## 插屏广告

插屏广告在页面切换或自然停顿点全屏展示。

### 平台支持

| 平台 | 支持版本 |
|------|----------|
| App | 3.1.10+ |
| 微信小程序 | 支持 |
| QQ 小程序 | 支持 |

### 基础用法

```js
let interstitialAd = null

export default {
  onReady() {
    if (uni.createInterstitialAd) {
      interstitialAd = uni.createInterstitialAd({
        adpid: '1234567890'
        // #ifdef MP-WEIXIN
        , adUnitId: 'adunit-xxxxxx'
        // #endif
      })

      interstitialAd.onLoad(() => console.log('插屏广告加载成功'))
      interstitialAd.onError((err) => console.error('插屏广告错误', err))
      interstitialAd.onClose(() => console.log('插屏广告关闭'))
    }
  },

  onShow() {
    // 在合适的页面生命周期显示，避免频繁打扰
    if (interstitialAd) {
      interstitialAd.show().catch((err) => {
        console.error('插屏广告显示失败', err)
      })
    }
  }
}
```

---

## 全屏视频广告

全屏视频广告与激励视频类似，但用户观看后**不强制发放奖励**，适合自然展示场景。

```js
const fullScreenAd = uni.createFullScreenVideoAd({ adpid: '1507000611' })

fullScreenAd.onLoad(() => console.log('全屏视频加载成功'))
fullScreenAd.onClose((res) => {
  console.log('全屏视频关闭', res)
})

fullScreenAd.show().catch(() => {
  fullScreenAd.load().then(() => fullScreenAd.show())
})
```

---

## 沉浸视频流 / 短视频内容联盟

适用于短视频类应用，以原生组件形式嵌入页面。

```vue
<template>
  <view>
    <!-- 沉浸视频流 -->
    <ad-draw adpid="1234567890" @load="onLoad" @error="onError"></ad-draw>

    <!-- 短视频内容联盟 -->
    <ad-content-page adpid="1234567890"></ad-content-page>
  </view>
</template>
```

---

## 微信小程序广告专题

微信小程序既可以使用 uni-ad 代理广告，也可以使用微信原生广告。

```vue
<template>
  <view>
    <!-- 微信 Banner -->
    <ad unit-id="adunit-xxxxxxxx"></ad>

    <!-- 微信激励视频 -->
    <!-- 通过 uni.createRewardedVideoAd({ adUnitId: '...' }) 调用 -->

    <!-- 微信视频广告 -->
    <ad-video unit-id="adunit-xxxxxxxx" @load="onLoad"></ad-video>

    <!-- 微信格子广告 -->
    <ad-grid unit-id="adunit-xxxxxxxx" ad-interactions="true"></ad-grid>
  </view>
</template>
```

---

## 错误码速查

常见错误及处理建议：

| 错误码 | 含义 | 处理 |
|--------|------|------|
| -5001 | 广告位 ID 无效 | 检查 `adpid` / `adUnitId` 是否正确 |
| -5002 | 无填充广告 | 更换广告位或切换网络/账号 |
| -5003 | 广告加载超时 | 检查网络，稍后重试 |
| -5004 | 广告展示过于频繁 | 控制展示频率 |
| -5005 | 当前用户不适合展示广告 | 平台策略限制，无法强制展示 |
| -5008 | 广告已过期 | 重新调用 `load()` |

完整错误码参考：[uni-ad 错误码](https://uniapp.dcloud.net.cn/uni-ad/ad-error-code.html)

---

## 通用封装：避免多页面重复预载

```js
// utils/ad.js
const EXPIRED_TIME = 1000 * 60 * 30
const RETRY_COUNT = 1

class AdBase {
  constructor(createFn, options) {
    this._ad = createFn(options)
    this._isLoaded = false
    this._isLoading = false
    this._lastLoadTime = 0
    this._retryCount = 0
    this._lastError = null

    this._ad.onLoad(() => {
      this._isLoading = false
      this._isLoaded = true
      this._lastLoadTime = Date.now()
    })

    this._ad.onClose((e) => {
      this._isLoaded = false
      this._onClose?.(e)
    })

    this._ad.onError(({ code, message }) => {
      this._isLoading = false
      if (this._retryCount < RETRY_COUNT) {
        this._retryCount += 1
        this._load()
        return
      }
      this._lastError = { code, message }
      this._onError?.({ code, message })
    })
  }

  _load() {
    this._isLoaded = false
    this._isLoading = true
    this._lastError = null
    this._ad.load()
  }

  show(onClose, onError) {
    this._onClose = onClose
    this._onError = onError

    if (this._lastError) {
      onError?.(this._lastError)
      return
    }

    if (!this._isLoaded) {
      this._load()
      return
    }

    // 部分渠道素材有 30 分钟有效期
    const expired = Date.now() - this._lastLoadTime > EXPIRED_TIME
    if (expired) {
      this._load()
      return
    }

    this._ad.show()
  }
}

const ads = {}

export function showRewardedVideo(options, onClose, onError) {
  const key = options.adpid || options.adUnitId
  if (!ads[key]) {
    ads[key] = new AdBase(uni.createRewardedVideoAd, options)
  }
  ads[key].show(onClose, onError)
}
```

---

## 注意事项

1. **平台差异**：
   - 鸿蒙 Next 目前不支持 uni-ad，可用 `#ifndef APP-HARMONY` 规避。
   - 支付宝小程序不支持 `uni.createRewardedVideoAd` 等 API，需使用平台原生广告组件。
2. **隐私合规**：
   - 在 `androidPrivacy.json` / iOS `PrivacyInfo.xcprivacy` 中声明广告 SDK 的个人信息收集。
   - 欧盟 GDPR、儿童应用需特别注意广告展示策略。
3. **用户体验**：
   - 激励视频应由用户主动触发，禁止自动播放。
   - 插屏广告不要连续频繁展示，避免用户反感。
4. **测试**：
   - App 端需使用自定义基座或正式打包测试，标准基座可能无法展示广告。
   - 微信小程序需使用真机调试或预览体验版测试。

---

## 相关参考

- `cloud-services.md`：uni-ad、uni-AD 概览
- `app-native.md`：App 原生能力、隐私合规
- `native-resources.md`：Android/iOS 原生配置、广告 SDK 集成
