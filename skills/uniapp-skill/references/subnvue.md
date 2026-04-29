# subNVue 原生子窗体

subNVue 是 App 端的原生子窗体，基于 Weex 渲染引擎，拥有高于 webview 的原生层级，可用于覆盖 web-view 组件、制作复杂动画等场景。

## 核心概念

- 每个 Vue 页面是一个 WebView
- subNVue 是独立于页面的原生子窗体（nvue 渲染），层级高于 WebView
- 解决 web-view 层级过高无法覆盖的问题
- 高性能动画、原生控件

> **uni-app x** 不支持 subNVue，改用原生组件方案。

## 创建方式

### 方式一：页面级 subNVue（pages.json 配置）

```json
{
  "pages": [{
    "path": "pages/index/index",
    "style": {
      "app-plus": {
        "subNVues": [{
          "id": "drawer",
          "path": "pages/index/subnvue/drawer",
          "style": {
            "position": "popup",
            "width": "70%",
            "height": "100%",
            "left": "0",
            "top": "0",
            "background": "transparent"
          }
        }]
      }
    }
  }]
}
```

### 方式二：动态创建

```js
// 创建原生子窗体
var subNVue = uni.getSubNVueById('drawer')

// 打开
subNVue.show('slide-in-left', 300, function() {
  console.log('subNVue 打开成功')
})

// 关闭
subNVue.hide('slide-out-left', 300)
```

## nvue 页面编写

```html
<!-- pages/index/subnvue/drawer.nvue -->
<template>
  <view class="drawer">
    <view class="mask" @click="close"></view>
    <view class="content">
      <text class="title">侧边栏</text>
      <text>这里是原生子窗体内容</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    close() {
      const subNVue = uni.getSubNVueById('drawer')
      subNVue.hide('slide-out-right', 200)
    }
  }
}
</script>

<style scoped>
.drawer {
  flex-direction: row;
}
.mask {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
}
.content {
  width: 70%;
  background-color: #ffffff;
  padding: 20px;
}
</style>
```

## 通信

### 父页面 → subNVue

```js
const subNVue = uni.getSubNVueById('drawer')

// 方式一：show 时传递数据
subNVue.show('slide-in-left', 300, () => {
  uni.$emit('drawer-data', { name: 'test' })
})

// 方式二：通过 evalJS
subNVue.evalJS("handleData('hello from parent')")
```

### subNVue → 父页面

```js
// subNVue 页面中
uni.$emit('subnvue-event', { message: '来自子窗体' })

// 父页面中
uni.$on('subnvue-event', (data) => {
  console.log(data.message)
})

// 页面卸载时移除监听
uni.$off('subnvue-event')
```

## 样式配置

### position 类型

| 值 | 说明 |
|---|------|
| popup | 弹出层，默认显示在页面上方 |
| dock | 停靠层，停靠在页面边缘 |
| absolute | 绝对定位，通过 left/top/right/bottom 定位 |

### 动画类型

| 动画名 | 效果 |
|--------|------|
| slide-in-left | 从左侧滑入 |
| slide-in-right | 从右侧滑入 |
| slide-in-top | 从顶部滑入 |
| slide-in-bottom | 从底部滑入 |
| zoom-in | 缩放进入 |
| fade-in | 淡入 |
| none | 无动画 |

## 使用场景

1. **侧边栏/抽屉菜单**：替代 webview 中的模拟抽屉，体验更好
2. **覆盖 web-view**：web-view 层级高时，用 subNVue 覆盖
3. **复杂动画**：需要高性能动画时
4. **原生控件**：需要原生 map、video 等控件覆盖层

## 注意事项

1. **仅 App-vue 支持**，H5 和小程序不支持
2. **nvue 页面**：subNVue 内容必须用 nvue 编写
3. **uni-app x 不支持** subNVue
4. subNVue 有自己的生命周期，与父页面独立
5. 数据通信使用 `uni.$emit/$on/$off` 或 `evalJS`
6. 不要在 subNVue 中使用 `uni.navigateTo` 等路由 API
7. subNVue 中可使用原生组件如 `<map>`、`<video>`
