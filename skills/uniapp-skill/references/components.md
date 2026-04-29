# uni-app 内置组件详解

官方文档：https://uniapp.dcloud.net.cn/component/

## 视图容器

### view — 基础容器

```vue
<view
  class="box"
  :style="{ color: '#333' }"
  hover-class="hover"           <!-- 按下时的样式类 -->
  hover-stay-time="400"         <!-- 按压后保留 hover 状态时长(ms) -->
  hover-stop-propagation        <!-- 阻止祖先节点出现 hover 效果 -->
  @click="handleClick"
>
  内容
</view>
```

### scroll-view — 可滚动视图

```vue
<scroll-view
  scroll-y                       <!-- 允许纵向滚动 -->
  scroll-x                       <!-- 允许横向滚动 -->
  :scroll-top="scrollTop"        <!-- 程序控制滚动位置(px) -->
  scroll-into-view="anchor-id"   <!-- 滚动到指定 id 的元素 -->
  :scroll-with-animation="true"
  @scroll="onScroll"             <!-- e.detail.scrollTop -->
  @scrolltoupper="onScrollTop"   <!-- 滚动到顶部 -->
  @scrolltolower="onScrollBottom"<!-- 滚动到底部，用于加载更多 -->
  refresher-enabled              <!-- 启用自定义下拉刷新 -->
  :refresher-triggered="isRefreshing"
  @refresherrefresh="onRefresh"
  style="height: 600rpx"
>
  <view v-for="item in list" :key="item.id">{{ item.name }}</view>
</scroll-view>
```

> 注意：scroll-view 内不要用 `position: fixed`，App 端高度必须显式设置。

### swiper — 轮播图

```vue
<swiper
  :autoplay="true"
  :interval="3000"
  :duration="500"
  circular                        <!-- 循环滚动 -->
  indicator-dots                  <!-- 显示面板指示点 -->
  indicator-color="rgba(255,255,255,.5)"
  indicator-active-color="#007AFF"
  :current="currentIndex"
  @change="(e) => currentIndex = e.detail.current"
>
  <swiper-item v-for="(item, index) in banners" :key="index">
    <image :src="item.imageUrl" mode="aspectFill" style="width:100%;height:100%" />
  </swiper-item>
</swiper>
```

## 基础内容

### text — 文本

```vue
<text
  selectable                      <!-- 允许选中复制 -->
  space="emsp"                    <!-- 显示连续空格：ensp|emsp|nbsp -->
  decode                          <!-- 解码 HTML 实体（如 &lt;） -->
  :number-of-lines="2"           <!-- 超出行数截断 -->
>
  文本内容
</text>
```

### image — 图片

```vue
<image
  src="/static/logo.png"         <!-- 支持相对路径、网络路径、base64 -->
  mode="aspectFill"              <!-- 裁剪/缩放模式（见下表） -->
  lazy-load                      <!-- 图片懒加载 -->
  :fade-show="true"             <!-- 图片加载时淡入效果 -->
  webp                           <!-- 支持 webp（App 2.9.0+） -->
  @load="onImageLoad"            <!-- 图片加载完成 -->
  @error="onImageError"          <!-- 图片加载失败 -->
  style="width:200rpx;height:200rpx"
/>
```

| mode 值 | 说明 |
|---------|------|
| `scaleToFill` | 拉伸填满，不保持比例（默认） |
| `aspectFit` | 保持比例，完整显示，可能有空白 |
| `aspectFill` | 保持比例，填满容器，可能裁剪 |
| `widthFix` | 宽度不变，高度自动变化 |
| `heightFix` | 高度不变，宽度自动变化 |
| `top` / `bottom` / `center` | 不缩放，仅显示指定位置 |

### rich-text — 富文本

```vue
<rich-text :nodes="htmlContent" />
<!-- htmlContent 可以是 HTML 字符串或节点数组 -->
```

## 表单组件

### input — 输入框

```vue
<input
  v-model="inputValue"
  type="text"                    <!-- text|number|idcard|digit|tel|safe-password -->
  placeholder="请输入内容"
  placeholder-style="color:#999"
  :maxlength="50"               <!-- -1 不限制 -->
  :focus="isFocused"
  :disabled="false"
  :password="false"
  confirm-type="done"           <!-- send|search|next|go|done（回车键类型） -->
  :adjust-position="true"       <!-- 键盘弹起时是否上移页面 -->
  @input="onInput"              <!-- e.detail.value -->
  @confirm="onConfirm"          <!-- 点击完成按钮 -->
  @focus="onFocus"
  @blur="onBlur"
/>
```

### textarea — 多行输入

```vue
<textarea
  v-model="content"
  placeholder="请输入..."
  :maxlength="500"
  :auto-height="true"           <!-- 自动增高 -->
  :show-confirm-bar="false"     <!-- 隐藏键盘上方工具栏（iOS） -->
  style="width:100%;min-height:200rpx"
/>
```

### button — 按钮

```vue
<button
  type="primary"               <!-- default | primary | warn -->
  size="default"               <!-- default | mini -->
  :disabled="loading"
  :loading="loading"
  form-type="submit"           <!-- submit | reset（配合 form 使用） -->
  open-type="getUserInfo"      <!-- 小程序开放能力 -->
  @click="handleClick"
  @getphonenumber="getPhone"  <!-- open-type="getPhoneNumber" 回调 -->
>
  按钮文字
</button>

<!-- 小程序开放能力 open-type 值 -->
<!-- getUserInfo: 获取用户信息 -->
<!-- getPhoneNumber: 获取手机号（需企业认证） -->
<!-- launchApp: 打开 App -->
<!-- openSetting: 打开授权设置页 -->
<!-- contact: 打开客服对话 -->
<!-- share: 触发分享 -->
```

### picker — 弹出选择器

```vue
<!-- 普通选择器 -->
<picker mode="selector" :range="options" @change="onChange">
  <view>{{ selected }}</view>
</picker>

<!-- 日期选择器 -->
<picker mode="date" :value="date" start="2020-01-01" end="2099-12-31" @change="onDateChange">
  <view>{{ date }}</view>
</picker>

<!-- 时间选择器 -->
<picker mode="time" :value="time" start="06:00" end="23:00" @change="onTimeChange">
  <view>{{ time }}</view>
</picker>

<!-- 省市区选择器 -->
<picker mode="region" :value="region" @change="onRegionChange">
  <view>{{ region.join(' ') }}</view>
</picker>

<!-- 多列选择器 -->
<picker mode="multiSelector" :range="multiArray" @change="onChange" @columnchange="onColumnChange">
  <view>{{ selectedMulti }}</view>
</picker>
```

### checkbox / radio

```vue
<checkbox-group @change="onCheckChange">
  <label v-for="item in items" :key="item.value">
    <checkbox :value="item.value" :checked="item.checked" :disabled="item.disabled" />
    {{ item.label }}
  </label>
</checkbox-group>

<radio-group @change="onRadioChange">
  <label v-for="item in items" :key="item.value">
    <radio :value="item.value" :checked="item.checked" />
    {{ item.label }}
  </label>
</radio-group>
```

### switch — 开关

```vue
<switch :checked="isEnabled" color="#007AFF" type="switch" @change="onSwitchChange" />
```

### slider — 滑动条

```vue
<slider :value="sliderValue" min="0" max="100" step="1"
  active-color="#007AFF" block-size="20"
  @change="(e) => sliderValue = e.detail.value"
  @changing="onChanging"
/>
```

### form — 表单容器

```vue
<form @submit="onSubmit" @reset="onReset">
  <input name="username" placeholder="用户名" />
  <input name="password" type="password" placeholder="密码" />
  <button form-type="submit">提交</button>
</form>

<script setup>
const onSubmit = (e) => {
  const { username, password } = e.detail.value
}
</script>
```

## 导航

### navigator — 页面跳转

```vue
<navigator
  url="/pages/detail/detail?id=1"
  open-type="navigate"         <!-- navigate|redirect|switchTab|reLaunch|navigateBack|exit -->
  :delta="1"                  <!-- open-type="navigateBack" 时有效 -->
  hover-class="navigator-hover"
>
  跳转链接
</navigator>
```

## 媒体

### video — 视频

```vue
<video
  :src="videoUrl"
  :poster="coverUrl"
  controls autoplay loop muted
  :object-fit="'contain'"     <!-- contain | fill | cover -->
  :show-fullscreen-btn="true"
  style="width:100%;height:500rpx"
  @play="onPlay"
  @pause="onPause"
  @ended="onEnded"
  @error="onError"
/>
```

## map — 地图

```vue
<map
  :latitude="latitude"
  :longitude="longitude"
  :markers="markers"
  :polyline="polyline"
  scale="14"
  show-location
  style="width:100%;height:300px"
  @markertap="onMarkerTap"
  @tap="onMapTap"
/>
```

## 画布

### canvas

```vue
<canvas canvas-id="myCanvas" style="width:300px;height:300px" />

<script setup>
import { onReady } from '@dcloudio/uni-app'

onReady(() => {
  const ctx = uni.createCanvasContext('myCanvas')
  ctx.setFillStyle('#007AFF')
  ctx.fillRect(0, 0, 100, 100)
  ctx.draw()
})
</script>
```

## uni-ui 扩展组件（easycom 自动引入）

安装：`npm install @dcloudio/uni-ui`

配置 easycom：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
}
```

常用组件：

| 组件 | 说明 |
|------|------|
| `<uni-list>` / `<uni-list-item>` | 列表 |
| `<uni-card>` | 卡片 |
| `<uni-badge>` | 徽标 |
| `<uni-icons>` | 图标（内置200+图标） |
| `<uni-popup>` | 弹出层（底部/居中/顶部） |
| `<uni-datetime-picker>` | 日期时间选择器 |
| `<uni-search-bar>` | 搜索栏 |
| `<uni-swipe-action>` | 滑动操作 |
| `<uni-load-more>` | 加载更多 |
| `<uni-nav-bar>` | 自定义导航栏 |
| `<uni-forms>` / `<uni-forms-item>` | 带验证的表单 |
| `<uni-rate>` | 评分 |
| `<uni-tag>` | 标签 |
| `<uni-steps>` | 步骤条 |
| `<uni-collapse>` | 折叠面板 |
| `<uni-transition>` | 动画过渡 |
