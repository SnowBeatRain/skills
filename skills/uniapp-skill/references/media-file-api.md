# 媒体与文件 API 参考

## 图片操作

```js
// 选择图片（支持相机/相册）
const { tempFilePaths, tempFiles } = await uni.chooseImage({
  count: 9,                          // 最多选择数量
  sizeType: ['original', 'compressed'],
  sourceType: ['album', 'camera'],
  crop: { width: 200, height: 200 }  // App 3.1.19+裁剪
})

// 获取图片信息
const { width, height, type, orientation } = await uni.getImageInfo({
  src: tempFilePaths[0]
  // orientation: up/down/left/right/up-mirrored/...
})

// 压缩图片
const { tempFilePath } = await uni.compressImage({
  src: originalPath,
  quality: 80,              // 压缩质量 0-100
  width: '50%',             // 缩放宽度（支持百分比）
  height: 'auto',
  rotate: 0                 // 旋转角度
})

// 预览图片（支持长按菜单）
uni.previewImage({
  urls: imageList,           // 图片 URL 数组
  current: clickedUrl,       // 当前显示图片
  indicator: 'default',     // 图片指示器样式
  loop: true,               // 循环预览
  longPressActions: {
    itemList: ['保存图片', '转发'],
    success: ({ tapIndex }) => {}
  }
})
uni.closePreviewImage()     // 关闭预览

// 保存图片到系统相册（需授权）
await uni.saveImageToPhotosAlbum({ filePath: localPath })
```

## 视频操作

```js
// 选择视频
const { tempFilePath, duration, size, width, height } = await uni.chooseVideo({
  sourceType: ['album', 'camera'],
  maxDuration: 60,           // 最大录制秒数
  camera: 'back',            // 默认后置
  compressed: true           // 是否压缩
})

// 选择混合媒体（图片+视频）
const { tempFiles } = await uni.chooseMedia({
  count: 9,
  mediaType: ['image', 'video'],
  sourceType: ['album', 'camera'],
  maxDuration: 30,
  sizeType: ['original', 'compressed']
})

// 获取视频信息
const { duration, size, width, height, fps, bitrate, orientation } = await uni.getVideoInfo({
  src: videoPath
})

// 压缩视频
const { tempFilePath, size } = await uni.compressVideo({
  src: videoPath,
  quality: 'medium',         // low | medium | high
  bitrate: 1600,             // 码率 kbps
  fps: 24,
  resolution: 0.5            // 缩放比例
})

// 编辑视频（App 3.1.10+）
const { duration, size, tempFilePath, tempThumbPath } = await uni.openVideoEditor({
  filePath: videoPath,
  minDuration: 3,            // 最短裁剪秒数
  maxDuration: 60
})

// 保存视频到相册
await uni.saveVideoToPhotosAlbum({ filePath: localPath })
```

## 音频播放

```js
// 创建音频实例
const audio = uni.createInnerAudioContext()
audio.src = 'https://example.com/music.mp3'
audio.autoplay = false
audio.loop = false
audio.volume = 1             // 0-1
audio.playbackRate = 1.0     // 0.5-2.0

// 控制
audio.play()
audio.pause()
audio.stop()
audio.seek(30)               // 跳转到 30 秒
audio.destroy()              // 销毁释放资源

// 事件监听
audio.onCanplay(() => {})
audio.onPlay(() => {})
audio.onPause(() => {})
audio.onEnded(() => {})
audio.onTimeUpdate(() => {
  console.log(audio.currentTime, audio.duration)
})
audio.onError((err) => { console.error(err.errMsg) })
audio.onWaiting(() => {})    // 缓冲中
// 支持格式：mp3, wav, aac, aiff, caf, m4a, flac, ogg, ape, amr, wma
```

### 背景音频（锁屏播放）

```js
const bgAudio = uni.getBackgroundAudioManager()
bgAudio.title = '歌曲名'          // 必填，通知栏显示
bgAudio.singer = '歌手名'
bgAudio.coverImgUrl = 'https://...'
bgAudio.src = 'https://example.com/music.mp3'  // 设置 src 自动播放

bgAudio.onPlay(() => {})
bgAudio.onPause(() => {})
bgAudio.onEnded(() => {})
bgAudio.onTimeUpdate(() => {
  console.log(bgAudio.currentTime, bgAudio.duration)
})
```

## 录音

```js
const recorder = uni.getRecorderManager()

// 开始录音
recorder.start({
  duration: 60000,           // 最长录音毫秒
  sampleRate: 16000,         // 采样率：8000-48000
  numberOfChannels: 1,       // 声道：1 单声道 | 2 立体声
  encodeBitRate: 48000,      // 编码码率
  format: 'mp3',             // aac | mp3 | wav | PCM
  audioSource: 'auto'        // auto | buildInMic | headsetMic | mic | camcorder
})

recorder.pause()
recorder.resume()
recorder.stop()

// 事件
recorder.onStart(() => {})
recorder.onPause(() => {})
recorder.onResume(() => {})
recorder.onStop((res) => {
  console.log('录音文件:', res.tempFilePath)
  console.log('时长:', res.duration, '文件大小:', res.fileSize)
})
recorder.onError((err) => { console.error(err) })
recorder.onFrameRecorded((res) => {
  // 实时获取帧数据（需设置 frameSize）
  console.log(res.frameBuffer, res.isLastFrame)
})
recorder.onInterruptionBegin(() => {})  // 被系统中断（来电等）
recorder.onInterruptionEnd(() => {})
```

## 相机控制

```js
// 需配合 <camera> 组件使用
const cameraCtx = uni.createCameraContext()

// 拍照
const { tempImagePath } = await cameraCtx.takePhoto({
  quality: 'high'            // high | normal | low
})

// 录像
cameraCtx.startRecord({
  timeout: 30,               // 超时自动停止（秒）
  success: () => {}
})
const { tempThumbPath, tempVideoPath } = await cameraCtx.stopRecord({
  compressed: true
})

// 缩放
cameraCtx.setZoom({ zoom: 2 })  // 1 到 maxZoom

// 实时帧数据
const listener = cameraCtx.onCameraFrame((frame) => {
  // frame.data: ArrayBuffer (RGBA)
  // frame.width, frame.height
})
listener.start()
listener.stop()
```

## 视频控制

```js
// 需配合 <video id="myVideo"> 组件使用
const videoCtx = uni.createVideoContext('myVideo')

videoCtx.play()
videoCtx.pause()
videoCtx.stop()
videoCtx.seek(60)                    // 跳转到 60 秒
videoCtx.playbackRate(1.5)           // 设置倍速
videoCtx.sendDanmu({ text: '弹幕', color: '#FF0000' })
videoCtx.requestFullScreen({ direction: 0 })  // 0自动 | 90横屏 | -90反向横屏
videoCtx.exitFullScreen()
```

## 文件操作

```js
// 上传文件
const [err, res] = await uni.uploadFile({
  url: 'https://api.example.com/upload',
  filePath: tempFilePath,
  name: 'file',                     // 后端接收的字段名
  formData: { user: 'john' },
  header: { 'Authorization': 'Bearer token' }
})
// res.data 为后端返回

// 下载文件
const [err, res] = await uni.downloadFile({
  url: 'https://example.com/file.pdf',
  header: {}
})
// res.tempFilePath 为本地临时路径

// 选择非媒体文件（H5/微信小程序）
const { tempFilePaths, tempFiles } = await uni.chooseFile({
  count: 5,
  type: 'all',                      // all | video | image
  extension: ['.zip', '.doc', '.xlsx', '.pdf']
})

// 文件系统管理器
const fs = uni.getFileSystemManager()
// 方法：readFile, writeFile, mkdir, readdir, rmdir, unlink, rename, stat, access
```

## 文件上传/下载进度监听

```js
// 上传进度
const uploadTask = uni.uploadFile({
  url: 'https://api.example.com/upload',
  filePath, name: 'file'
})
uploadTask.onProgressUpdate((res) => {
  console.log('上传进度:', res.progress + '%')
  console.log('已上传:', res.totalBytesSent)
  console.log('总大小:', res.totalBytesExpectedToSend)
})
// uploadTask.abort()  // 取消上传

// 下载进度
const downloadTask = uni.downloadFile({ url: '...' })
downloadTask.onProgressUpdate((res) => {
  console.log('下载进度:', res.progress + '%')
})
```
