# uni-app Canvas 绘图参考

官方文档：<https://uniapp.dcloud.net.cn/api/canvas/createCanvasContext.html>

Canvas 用于在页面中绘制 2D 图形、图表、签名板、海报、游戏画面等。

---

## 平台差异速览

| 平台 | 说明 |
|------|------|
| App / H5 / 小程序 | 均支持 `uni.createCanvasContext` |
| App-nvue | 未封装为 uni API，需参考 [NvueCanvasDemo](https://github.com/dcloudio/NvueCanvasDemo) |
| 支付宝小程序 | 使用 `id` 而非 `canvas-id` |
| 鸿蒙 | HBuilderX 4.23+ 支持；`measureText` 为异步，需传回调 |
| 微信小程序 | 支持离屏 canvas `createOffscreenCanvas` |
| 支付宝小程序 | 支持离屏 canvas |

---

## 模板中使用 Canvas

```vue
<template>
  <canvas canvas-id="myCanvas" id="myCanvas" style="width: 300px; height: 300px; border: 1px solid #eee;"></canvas>
</template>
```

> 支付宝小程序使用 `id="myCanvas"`；其他平台使用 `canvas-id="myCanvas"`。

---

## 创建绘图上下文

```js
// 普通页面
const ctx = uni.createCanvasContext('myCanvas')

// 自定义组件内，需传入组件实例 this
const ctx = uni.createCanvasContext('myCanvas', this)
```

---

## 基础绘图示例

```js
const ctx = uni.createCanvasContext('myCanvas')

// 设置样式
ctx.setFillStyle('#ff6b6b')
ctx.setStrokeStyle('#333')
ctx.setLineWidth(2)

// 绘制矩形
ctx.fillRect(10, 10, 100, 60)
ctx.strokeRect(120, 10, 100, 60)

// 绘制圆形
ctx.beginPath()
ctx.arc(80, 120, 40, 0, 2 * Math.PI)
ctx.setFillStyle('#4ecdc4')
ctx.fill()

// 绘制文本
ctx.setFontSize(16)
ctx.setFillStyle('#333')
ctx.fillText('Hello Canvas', 10, 200)

// 渲染到画布
ctx.draw()
```

---

## 路径与形状

```js
const ctx = uni.createCanvasContext('myCanvas')

ctx.beginPath()
ctx.moveTo(10, 10)
ctx.lineTo(100, 50)
ctx.lineTo(50, 100)
ctx.closePath()
ctx.setStrokeStyle('#333')
ctx.stroke()

ctx.beginPath()
ctx.arc(150, 75, 50, 0, 1.5 * Math.PI)
ctx.setStrokeStyle('#e74c3c')
ctx.stroke()

ctx.draw()
```

### 常用路径方法

| 方法 | 说明 |
|------|------|
| `beginPath()` | 开始新路径 |
| `moveTo(x, y)` | 移动到指定点 |
| `lineTo(x, y)` | 画直线到指定点 |
| `arc(x, y, r, sAngle, eAngle)` | 画圆弧 |
| `rect(x, y, w, h)` | 创建矩形路径 |
| `closePath()` | 闭合路径 |
| `fill()` | 填充当前路径 |
| `stroke()` | 描边当前路径 |
| `clearRect(x, y, w, h)` | 清除矩形区域 |

---

## 样式与效果

### 颜色与渐变

```js
// 纯色
ctx.setFillStyle('#3498db')

// 线性渐变
const grd = ctx.createLinearGradient(0, 0, 200, 0)
grd.addColorStop(0, 'red')
grd.addColorStop(1, 'white')
ctx.setFillStyle(grd)
ctx.fillRect(10, 10, 180, 80)

// 圆形渐变
const radial = ctx.createCircularGradient(100, 75, 50)
radial.addColorStop(0, 'red')
radial.addColorStop(1, 'white')
ctx.setFillStyle(radial)
ctx.fillRect(10, 100, 180, 80)
```

### 阴影

```js
ctx.setShadow(10, 10, 20, 'rgba(0,0,0,0.3)')
ctx.fillRect(20, 20, 100, 100)
```

### 线条样式

```js
ctx.setLineWidth(5)
ctx.setLineCap('round')    // butt | round | square
ctx.setLineJoin('round')   // bevel | round | miter
ctx.setLineDash([10, 10], 0)
```

### 透明度与合成

```js
ctx.setGlobalAlpha(0.5)
ctx.setGlobalCompositeOperation('destination-over')
```

---

## 绘制图片

```js
const ctx = uni.createCanvasContext('myCanvas')

uni.chooseImage({
  count: 1,
  success: (res) => {
    ctx.drawImage(res.tempFilePaths[0], 0, 0, 150, 100)
    ctx.draw()
  }
})
```

> H5 端绘制的图片需要支持跨域，否则 `canvasToTempFilePath` 可能失败。

### 绘制圆角图片

```js
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 先创建裁剪区域，再 drawImage
ctx.save()
drawRoundRect(ctx, 10, 10, 100, 100, 10)
ctx.clip()
ctx.drawImage(tempFilePath, 10, 10, 100, 100)
ctx.restore()
ctx.draw()
```

---

## 导出为图片

```js
uni.canvasToTempFilePath({
  canvasId: 'myCanvas',
  x: 0,
  y: 0,
  width: 300,
  height: 300,
  destWidth: 600,      // 输出图片宽度（默认 width * dpr）
  destHeight: 600,
  fileType: 'png',     // jpg | png
  quality: 1,          // (0, 1]，jpg 有效
  success: (res) => {
    console.log('图片路径:', res.tempFilePath)
    // 可调用 uni.saveImageToPhotosAlbum 保存相册
  },
  fail: (err) => {
    console.error('导出失败:', err)
  }
})
```

> 在 H5 平台，`tempFilePath` 为 base64 字符串。

---

## 离屏 Canvas

离屏 canvas 可在后台绘制，不占用页面布局，适合生成海报、缩略图等。

```js
// #ifdef MP-WEIXIN
const offscreen = wx.createOffscreenCanvas({ type: '2d', width: 300, height: 300 })
const ctx = offscreen.getContext('2d')

ctx.fillStyle = '#3498db'
ctx.fillRect(0, 0, 300, 300)
ctx.fillStyle = '#fff'
ctx.font = '20px sans-serif'
ctx.fillText('Offscreen Canvas', 20, 150)

// 将离屏内容绘制到页面 canvas
const pageCanvas = wx.createCanvasContext('myCanvas')
pageCanvas.drawImage(offscreen, 0, 0)
pageCanvas.draw()
// #endif
```

### 支付宝小程序

```js
// #ifdef MP-ALIPAY
const offscreen = my.createOffscreenCanvas()
// ...
// #endif
```

---

## 实战：生成分享海报

```js
async function createPoster() {
  const ctx = uni.createCanvasContext('poster')

  // 背景
  ctx.setFillStyle('#ffffff')
  ctx.fillRect(0, 0, 375, 667)

  // 标题
  ctx.setFontSize(20)
  ctx.setFillStyle('#333')
  ctx.fillText('uni-app 海报', 20, 50)

  // 网络图片需先下载到本地
  const [err, res] = await uni.downloadFile({ url: 'https://example.com/cover.png' })
  if (!err && res.statusCode === 200) {
    ctx.drawImage(res.tempFilePath, 20, 80, 335, 200)
  }

  // 二维码
  const [err2, qr] = await uni.downloadFile({ url: 'https://example.com/qrcode.png' })
  if (!err2 && qr.statusCode === 200) {
    ctx.drawImage(qr.tempFilePath, 140, 520, 95, 95)
  }

  ctx.draw(false, () => {
    uni.canvasToTempFilePath({
      canvasId: 'poster',
      destWidth: 750,
      destHeight: 1334,
      success: (r) => {
        console.log('海报生成:', r.tempFilePath)
      }
    })
  })
}
```

---

## 坐标变换

```js
const ctx = uni.createCanvasContext('myCanvas')

ctx.save()                 // 保存当前状态
ctx.translate(50, 50)      // 平移
ctx.rotate(30 * Math.PI / 180) // 旋转（弧度）
ctx.scale(1.5, 1.5)        // 缩放
ctx.fillRect(0, 0, 50, 50)
ctx.restore()              // 恢复状态

ctx.draw()
```

---

## 文本测量

```js
// App / H5 / 小程序（同步）
const ctx = uni.createCanvasContext('myCanvas')
ctx.font = '16px sans-serif'
const metrics = ctx.measureText('Hello World')
console.log(metrics.width)

// 鸿蒙（异步）
// #ifdef APP-HARMONY
ctx.measureText('Hello World', ({ width }) => {
  console.log('文本宽度:', width)
})
// #endif
```

---

## 注意事项

1. **canvas-id 唯一性**：同一页面内 canvas-id 必须唯一。
2. **draw 异步**：`ctx.draw(false, callback)` 第二个回调在绘制完成后触发，导出图片应在此回调内执行。
3. **H5 跨域**：使用网络图片时，图片需设置 `crossOrigin`，否则导出可能空白或报错。
4. **支付宝差异**：支付宝小程序使用 `id` 属性，而不是 `canvas-id`。
5. **高分屏**：`canvasToTempFilePath` 默认按设备像素比输出，如需固定尺寸可设置 `destWidth/destHeight`。
6. **nvue 限制**：App-nvue 页面不支持 `uni.createCanvasContext`，需使用原生方案。

---

## 相关参考

- `api.md`：普通网络请求、媒体文件处理
- `components.md`：`canvas` 组件用法
- `media-file-api.md`：图片选择、下载、保存相册
