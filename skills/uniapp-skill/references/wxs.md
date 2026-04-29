# WXS / SJS / Filter 视图层脚本

WXS（WeiXin Script）是一套运行**视图层**的脚本语言。当需要避免逻辑层和渲染层交互通信损耗时，应采用 WXS。

## 为什么需要 WXS

uni-app 的逻辑层（JS）和视图层（渲染层）是分离的，两层之间的通信有损耗。当需要高频交互（如 touchmove 实时跟手、实时过滤输入等），WXS 运行在视图层可以直接操作 DOM，避免通信折损。

| 平台 | WXS | SJS（阿里/抖音/快手/京东） | Filter（百度） | JDS（京东） |
|:---:|:---:|:---:|:---:|:---:|
| App-vue | ✅ | | | |
| H5 | ✅ | | | |
| 微信小程序 | ✅ | | | |
| 支付宝小程序 | | ✅ | | |
| 百度小程序 | | | ✅ | |
| 抖音小程序 | | ✅ | | |
| QQ 小程序 | ✅ | | | |
| 小红书小程序 | | ✅ | | |

> **App 端 nvue** 不使用 WXS，应使用 bindingx 技术。
> **App 和 H5 端** 提供了 WXS 的升级版 **renderjs**，更加强大。

## 使用方式

### 内联写法

```html
<template>
  <view>
    <view class="touch-box" @touchmove="touchmove" :style="style">
      拖拽我
    </view>
  </view>
</template>

<!-- WXS 脚本 -->
<script module="touch" lang="wxs">
var startX = 0, startY = 0, lastLeft = 0, lastTop = 0

function touchmove(event, instance) {
  var touch = event.touches[0]
  var x = touch.clientX
  var y = touch.clientY
  var dx = x - startX
  var dy = y - startY

  if (startX !== 0 || startY !== 0) {
    instance.setStyle({
      left: (lastLeft + dx) + 'px',
      top: (lastTop + dy) + 'px'
    })
  } else {
    startX = x
    startY = y
    startX = touch.clientX
    startY = touch.clientY
  }
}

function touchstart(event, instance) {
  var touch = event.touches[0]
  startX = touch.clientX
  startY = touch.clientY
}

function touchend(event, instance) {
  lastLeft = parseInt(instance.getState().style && instance.getState().style.left) || 0
  lastTop = parseInt(instance.getState().style && instance.getState().style.top) || 0
  startX = 0
  startY = 0
}

module.exports = {
  touchstart: touchstart,
  touchmove: touchmove,
  touchend: touchend
}
</script>

<style>
.touch-box {
  position: absolute;
  width: 100px;
  height: 100px;
  background-color: #007AFF;
  color: #fff;
  text-align: center;
  line-height: 100px;
  left: 0;
  top: 0;
}
</style>
```

### 外部引入

```html
<template>
  <view>
    <text>{{ filter.toUpper(text) }}</text>
  </view>
</template>

<script module="filter" lang="wxs" src="./filter.wxs"></script>
```

```js
// filter.wxs
function toUpper(val) {
  return val.toUpperCase()
}

module.exports = {
  toUpper: toUpper
}
```

### 各平台语法对照

```html
<!-- 微信 / QQ / App-vue / H5 -->
<script module="test" lang="wxs" src="./test.wxs"></script>

<!-- 支付宝 / 抖音 / 快手 / 京东 -->
<script module="test" lang="sjs" src="./test.sjs"></script>

<!-- 百度 -->
<script module="test" lang="filter" src="./test.filter.js"></script>

<!-- 京东（jds 扩展名） -->
<script module="test" lang="jds" src="./test.jds"></script>
```

## 各平台对应规则

```html
<!-- uni-app 会自动编译到目标平台，无需写条件编译 -->
<script module="handler" lang="wxs" src="./handler.wxs"></script>
<script module="handler" lang="sjs" src="./handler.sjs"></script>
<script module="handler" lang="filter" src="./handler.filter.js"></script>
```

各 `script` 标签会被分别打包至对应支持的平台，**无需额外写条件编译**。

## WXS 语言特性

### 数据类型

WXS 支持以下数据类型：
- **Number**：数值类型
- **String**：字符串类型
- **Boolean**：布尔类型
- **Object**：对象类型
- **Function**：函数类型
- **Array**：数组类型
- **Date**：日期类型
- **RegExp**：正则表达式
- **undefined**：未定义

### 内置模块

WXS 内置了以下模块：

```js
// math 模块
var math = require('./math.wxs') // 无内置 math 对象，需自行实现

// 常用内置对象
var date = getDate()        // 获取当前时间戳
var console = { log: ... }  // 部分平台支持
```

### 模块引入

```js
// wxs 中可以 require 其他 wxs 文件
var tools = require('./tools.wxs')

// 但注意：暂不支持在 wxs 中调用其他同类型文件（互调有限制）
```

### module 属性

- `module` 指定模块名称，在模板中通过 `module.method()` 调用
- **不能与 data、methods、computed 中的属性名重名**

### this.$ownerInstance

WXS 中可以获取当前组件的实例：

```js
function handler(event, instance) {
  // instance 即 $ownerInstance
  instance.callMethod('methodName', arg1, arg2)
}
```

## 常见使用场景

### 实时输入过滤

```html
<template>
  <input @input="filter.onInput" :value="inputValue" />
</template>

<script module="filter" lang="wxs">
function onInput(event, instance) {
  var value = event.detail.value
  // 仅保留数字
  value = value.replace(/[^0-9]/g, '')
  instance.callMethod('onFilteredInput', value)
  return value
}

module.exports = {
  onInput: onInput
}
</script>
```

### 图片懒加载占位

```html
<template>
  <scroll-view scroll-y @scroll="scrollObserver.onScroll">
    <image v-for="item in list" :key="item.id" :src="item.visible ? item.url : placeholder" />
  </scroll-view>
</template>

<script module="scrollObserver" lang="wxs">
function onScroll(event, ownerInstance) {
  // 在 WXS 中直接计算元素可见性
  // 减少与逻辑层的通信
  var scrollTop = event.detail.scrollTop
  // 通知逻辑层更新数据
  ownerInstance.callMethod('updateVisibleItems', scrollTop)
}

module.exports = {
  onScroll: onScroll
}
</script>
```

### 列表滑动动画

```html
<template>
  <view>
    <view class="slider-track">
      <view class="slider-thumb" @touchstart="slider.onStart" @touchmove="slider.onMove" @touchend="slider.onEnd">
      </view>
    </view>
  </view>
</template>

<script module="slider" lang="wxs">
var startX = 0
var currentX = 0

function onStart(event, instance) {
  startX = event.touches[0].clientX
  currentX = parseInt(instance.getState().left) || 0
}

function onMove(event, instance) {
  var x = event.touches[0].clientX
  var dx = x - startX
  instance.setStyle({ left: (currentX + dx) + 'px' })
}

function onEnd(event, instance) {
  startX = 0
}

module.exports = {
  onStart: onStart,
  onMove: onMove,
  onEnd: onEnd
}
</script>
```

## 注意事项

1. **module 名不可与 data、methods、computed 属性重名**
2. **vue3 项目不支持 `<script setup>` 用法**（在 WXS 中）
3. **nvue 页面不支持 WXS**
4. **QQ 小程序对内联 WXS 支持不完善**，建议使用外部引入
5. **百度小程序 Filter 只能导出 function 函数**
6. **App 和 H5 端推荐使用 renderjs**（WXS 的升级版）
7. 编写 WXS/SJS/Filter 内容时必须遵循相应平台的语法规范
8. App 端视图层页面引用资源的路径相对于根目录计算，例如 `./static/test.js`
9. 暂不支持在 WXS、SJS、Filter.js 中调用其他同类型文件

## WXS vs RenderJS 选型

| 场景 | 推荐方案 |
|------|---------|
| 微信小程序跟手滑动 | WXS |
| App/H5 端复杂动画 | RenderJS（更强大） |
| App 端 nvue 高性能交互 | BindingX |
| 实时输入过滤 | WXS |
| 第三方 JS 库运行 | RenderJS（可操作 DOM） |
