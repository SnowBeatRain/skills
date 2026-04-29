# 扩展组件参考

## 原生覆盖组件

### cover-view — 原生组件覆盖层

```vue
<!-- 用于在 map/video/canvas 等原生组件上叠加内容 -->
<map>
  <cover-view class="overlay">
    <cover-view class="title">地图上的文字</cover-view>
  </cover-view>
</map>
```

- 文本必须在 `<cover-view>` 内（不支持直接文本节点）
- 不支持：单边 border、background-image、阴影、overflow:visible
- 微信已支持同层渲染，推荐直接用 `<view>` 替代

### movable-view — 可拖动视图

```vue
<movable-area style="width:300rpx;height:300rpx;background:#eee">
  <movable-view
    direction="all"
    :x="posX" :y="posY"
    :inertia="true"
    :out-of-bounds="false"
    :damping="20"
    :scale="true" :scale-min="0.5" :scale-max="3"
    @change="onMove"
    @scale="onScale"
  >
    <image src="/static/icon.png" style="width:50rpx;height:50rpx" />
  </movable-view>
</movable-area>

<script setup>
const onMove = (e) => { console.log(e.detail.x, e.detail.y, e.detail.source) }
const onScale = (e) => { console.log('缩放:', e.detail.scale) }
</script>
```

- `direction`: all | vertical | horizontal | none
- `source`: touch（手指）| out-of-bounds | friction | setData

---

## 页面配置组件

### page-meta — 页面元数据

```vue
<!-- 必须是模板第一个元素 -->
<template>
  <page-meta
    :root-font-size="fontSize"
    page-style="overflow: hidden"
    :enable-pull-down-refresh="true"
    background-color="#f5f5f5"
    @resize="onResize"
    @scroll="onScroll"
  >
    <navigation-bar
      title="自定义导航"
      front-color="#ffffff"
      background-color="#007AFF"
      :loading="isLoading"
    />
  </page-meta>
  <view>页面内容</view>
</template>
```

- 会覆盖 pages.json 中的同名配置
- Vue3 SSR 模式下可包含 `<head>` 标签用于 SEO

### navigation-bar — 自定义导航栏

```vue
<navigation-bar
  title="标题"
  title-icon="/static/icon.png"
  subtitle-text="副标题"
  title-align="center"
  front-color="#ffffff"
  background-color="#007AFF"
  background-image="linear-gradient(to right, #007AFF, #00BFFF)"
  :loading="false"
  blur-effect="light"
/>
```

- `front-color` 只支持 `#ffffff` 或 `#000000`
- `blur-effect`: dark | extralight | light | none（iOS 毛玻璃）

### custom-tab-bar — 自定义 TabBar（仅 H5）

```vue
<custom-tab-bar
  direction="horizontal"
  :show-icon="true"
  :selected="currentTab"
  @onTabItemTap="onTabTap"
/>
```

---

## 媒体组件

### camera — 页内相机

```vue
<camera
  device-position="back"
  flash="auto"
  mode="normal"
  resolution="high"
  @initdone="onCameraInit"
  @error="onCameraError"
  style="width:100%;height:400rpx"
/>
```

- `mode`: normal（拍照/录像） | scanCode（扫码）
- 原生组件，每页只能一个，不能嵌入 scroll-view/swiper
- App/H5 推荐用 `uni.chooseImage()` / `uni.chooseVideo()` 替代

### barcode — 条码扫描（App nvue 专属）

```vue
<!-- nvue 页面 -->
<barcode
  :autostart="true"
  :filters="[0, 1, 2]"
  frameColor="#007AFF"
  scanbarColor="#007AFF"
  @marked="onScan"
  @error="onScanError"
  style="width:750rpx;height:500rpx"
/>
```

- 条码类型：0=QR, 1=EAN13, 2=EAN8, 3=Aztec, 4=DataMatrix, 5=UPC-A, 6=UPC-E, 7-15=更多
- 方法：`start()`, `cancel()`, `setFlash(true/false)`

### live-pusher — 直播推流（App/微信）

```vue
<live-pusher
  url="rtmp://push.example.com/live/stream"
  mode="HD"
  :beauty="5"
  :whiteness="3"
  :enable-camera="true"
  :muted="false"
  aspect="9:16"
  @statechange="onState"
  @netstatus="onNet"
  style="width:750rpx;height:1000rpx"
/>
```

- `mode`: SD(标清) | HD(高清) | FHD(超清)
- 支持：美颜/美白、前后摄像头切换、闪光灯、降噪、回声消除

### live-player — 直播拉流（微信/百度/抖音）

```vue
<live-player
  src="https://pull.example.com/live/stream.flv"
  mode="live"
  :autoplay="true"
  object-fit="contain"
  :min-cache="1"
  :max-cache="3"
  @statechange="onState"
  style="width:750rpx;height:500rpx"
/>
```

- App 端使用 `<video>` 组件替代

---

## 交互组件

### progress — 进度条

```vue
<progress
  :percent="60"
  :show-info="true"
  stroke-width="6"
  activeColor="#007AFF"
  :active="true"
  active-mode="forwards"
  @activeend="onComplete"
/>
```

### icon — 内置图标

```vue
<icon type="success" size="30" color="#4CD964" />
<icon type="warn" size="30" />
<icon type="waiting" size="30" />
<icon type="cancel" size="30" />
<icon type="search" size="20" />
```

类型：success, success_no_circle, info, warn, waiting, cancel, download, search, clear

### match-media — 响应式媒体查询

```vue
<!-- 宽屏显示侧边栏 -->
<match-media :min-width="768">
  <view class="sidebar">侧边栏内容</view>
</match-media>

<!-- 窄屏显示底部导航 -->
<match-media :max-width="767">
  <view class="bottom-nav">底部导航</view>
</match-media>
```

### animation-view — Lottie 动画（App nvue/uvue）

```vue
<animation-view
  path="/static/lottie/loading.json"
  :loop="true"
  :autoplay="true"
  action="play"
  style="width:200rpx;height:200rpx"
/>
```

---

## uni-ui 扩展组件（补充）

### uni-data-checkbox — 数据驱动选择

```vue
<uni-data-checkbox
  v-model="selected"
  :localdata="[
    { text: '选项A', value: 'a' },
    { text: '选项B', value: 'b' },
    { text: '选项C', value: 'c', disable: true }
  ]"
  :multiple="true"
  mode="tag"
  selectedColor="#007AFF"
/>
```

模式：default | list | button | tag

### uni-data-select — 下拉选择

```vue
<uni-data-select
  v-model="value"
  :localdata="options"
  placeholder="请选择"
  :clear="true"
  @change="onChange"
/>
```

### uni-file-picker — 文件选择上传

```vue
<uni-file-picker
  v-model="files"
  file-mediatype="image"
  mode="grid"
  :limit="9"
  :auto-upload="true"
  @select="onSelect"
  @success="onUploadSuccess"
  @delete="onDelete"
/>
```

> 需配置 uniCloud 空间才能使用自动上传

### uni-calendar — 日历

```vue
<uni-calendar
  :insert="true"
  :lunar="true"
  :range="false"
  :selected="markDates"
  start-date="2024-01-01"
  end-date="2025-12-31"
  @change="onDateChange"
/>
```

### uni-table — 数据表格

```vue
<uni-table border stripe :loading="loading" type="selection" @selection-change="onSelect">
  <uni-tr>
    <uni-th width="200" align="center" sortable @sort-change="onSort">名称</uni-th>
    <uni-th width="100">价格</uni-th>
    <uni-th>操作</uni-th>
  </uni-tr>
  <uni-tr v-for="item in list" :key="item.id">
    <uni-td>{{ item.name }}</uni-td>
    <uni-td>{{ item.price }}</uni-td>
    <uni-td><button size="mini" @click="edit(item)">编辑</button></uni-td>
  </uni-tr>
</uni-table>
```

### uni-fab — 悬浮操作按钮

```vue
<uni-fab
  :pattern="{ color: '#fff', backgroundColor: '#007AFF' }"
  horizontal="right"
  vertical="bottom"
  :content="[
    { iconPath: '/static/add.png', text: '新增' },
    { iconPath: '/static/scan.png', text: '扫码' }
  ]"
  @trigger="onFabItem"
  @fabClick="onFabClick"
/>
```

### uni-indexed-list — 索引列表

```vue
<uni-indexed-list
  :options="cityList"
  :show-select="false"
  @click="onCityClick"
/>
<!-- cityList: [{ letter: 'A', data: ['安庆', '安阳'] }, ...] -->
```

### 其他常用 uni-ui 组件速查

| 组件 | 用途 |
|------|------|
| `uni-countdown` | 倒计时（天/时/分/秒） |
| `uni-number-box` | 数字步进器（+/-） |
| `uni-segmented-control` | 分段选择器 |
| `uni-drawer` | 侧边抽屉菜单 |
| `uni-pagination` | 分页器 |
| `uni-breadcrumb` | 面包屑导航 |
| `uni-section` | 分区标题栏 |
| `uni-group` | 内容分组 |
| `uni-title` | 章节标题（支持统计上报） |
| `uni-tooltip` | 悬停提示框 |

---

## nvue 高性能组件

### list — 自动回收长列表

```vue
<!-- nvue 专属，自动回收离屏内存 -->
<list @loadmore="loadMore" loadmoreoffset="50">
  <cell v-for="item in list" :key="item.id">
    <text>{{ item.name }}</text>
  </cell>
  <header>
    <text>列表头部</text>
  </header>
</list>
```

### waterfall — 瀑布流

```vue
<waterfall column-count="2" column-width="auto">
  <cell v-for="item in list" :key="item.id">
    <image :src="item.image" mode="widthFix" />
    <text>{{ item.title }}</text>
  </cell>
</waterfall>
```

### recycle-list — 虚拟滚动

```vue
<recycle-list :list-data="longList" template-key="type">
  <cell-slot template-type="default">
    <text>{{item.name}}</text>
  </cell-slot>
</recycle-list>
```

- 适合上千条数据的极限性能场景
- 限制较多：不支持 v-model、$refs、slot 等
