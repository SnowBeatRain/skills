# editor 富文本编辑器组件

`<editor>` 是 uni-app 提供的富文本编辑器组件，支持富文本编辑功能。

## 基本用法

```html
<template>
  <view class="editor-wrap">
    <editor
      id="editor"
      class="editor"
      placeholder="开始输入..."
      @ready="onEditorReady"
      @input="onInput"
      @statuschange="onStatusChange"
    ></editor>

    <!-- 工具栏 -->
    <view class="toolbar">
      <button @click="format('bold')" class="tool-btn">B</button>
      <button @click="format('italic')" class="tool-btn">I</button>
      <button @click="format('underline')" class="tool-btn">U</button>
      <button @click="format('strike')" class="tool-btn">S</button>
      <button @click="insertImage" class="tool-btn">图片</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onReady } from '@dcloudio/uni-app'

const editorCtx = ref(null)

onReady(() => {
  uni.createSelectorQuery().select('#editor').context((res) => {
    editorCtx.value = res.context
  }).exec()
})

const onEditorReady = () => {
  console.log('编辑器就绪')
}

const onInput = (e) => {
  console.log('内容变化:', e.detail)
}

// 格式化文本
const format = (name, value) => {
  editorCtx.value.format(name, value || true)
}

// 插入图片
const insertImage = async () => {
  const res = await uni.chooseImage({ count: 1 })
  editorCtx.value.insertImage({
    src: res.tempFilePaths[0],
    width: '100%',
    extClass: 'editor-image'
  })
}

// 获取内容
const getContent = () => {
  editorCtx.value.getContents({
    success: (res) => {
      console.log('HTML:', res.html)
      console.log('文本:', res.text)
      console.log('Delta:', res.delta)
    }
  })
}

// 设置内容
const setContent = (html) => {
  editorCtx.value.setContents({
    html: html
  })
}
</script>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| read-only | Boolean | false | 是否只读 |
| placeholder | String | '' | 占位文本 |
| show-img-size | Boolean | true | 点击图片时显示大小工具栏 |
| show-img-toolbar | Boolean | true | 点击图片时显示工具栏 |
| show-img-resize | Boolean | true | 点击图片时显示调整大小工具 |
| @ready | Event | - | 编辑器初始化完成时触发 |
| @focus | Event | - | 编辑器聚焦时触发 |
| @blur | Event | - | 编辑器失去焦点时触发 |
| @input | Event | - | 编辑器内容发生变化时触发 |
| @statuschange | Event | - | 编辑器通过 @ 符号提及用户时触发 |

## EditorContext 方法

通过 `uni.createSelectorQuery().select('#editor').context()` 获取编辑器上下文。

### 格式化

```js
// 加粗
editorCtx.format('bold', true)    // 加粗
editorCtx.format('bold', false)   // 取消加粗

// 支持的格式：
// bold - 加粗
// italic - 斜体
// underline - 下划线
// strike - 删除线
// color - 字体颜色，如 '#ff0000'
// backgroundColor - 背景色
// fontSize - 字号，如 '18px'
// fontFamily - 字体
// textAlign - 对齐，'left'/'center'/'right'/'justify'
// lineHeight - 行高
// list - 列表，'checked'/'unchecked'/'ordered'/'bullet'
// header - 标题级别，1-4
// indent - 缩进级别，1-3
// direction - 文字方向
// script - 上标/下标，'sub'/'super'
// blockquote - 引用
// code - 行内代码
// code-block - 代码块
// clean - 清除格式
```

### 插入内容

```js
// 插入图片
editorCtx.insertImage({
  src: '/path/to/image.png',
  width: '100%',
  height: 'auto',
  extClass: 'my-image',
  data: { id: '123' },  // 自定义数据
  success() {}
})

// 插入文本
editorCtx.insertText({ text: 'Hello' })

// 插入分割线
editorCtx.insertDivider({ color: '#ccc' })
```

### 获取/设置内容

```js
// 获取内容
editorCtx.getContents({
  success: (res) => {
    res.html    // HTML 格式
    res.text    // 纯文本
    res.delta   // Delta 格式（Quill 风格）
  }
})

// 设置内容
editorCtx.setContents({
  html: '<p>初始内容</p>',
  success() {}
})

// 清空内容
editorCtx.clear({ success() {} })
```

### 撤销/重做

```js
editorCtx.undo()   // 撤销
editorCtx.redo()   // 重做
```

### 滚动

```js
editorCtx.scrollToView({ id: 'target-element-id' })
```

### 获取选择范围

```js
editorCtx.getSelectionRange({
  success: (res) => {
    console.log('起始位置:', res.startIndex)
    console.log('结束位置:', res.endIndex)
  }
})
```

### 设置选择范围

```js
editorCtx.setSelectionRange({
  startIndex: 0,
  endIndex: 5
})
```

## 事件详情

### @input

```js
const onInput = (e) => {
  e.detail.html     // HTML 内容
  e.detail.text     // 纯文本
  e.detail.delta    // Delta 内容
}
```

### @statuschange

```js
const onStatusChange = (e) => {
  // e.detail 包含当前光标位置的格式状态
  // 可用于更新工具栏按钮的激活状态
  if (e.detail.bold) {
    // 当前选中内容已加粗
  }
}
```

## 注意事项

1. 小程序端支持程度有限，部分格式可能不支持
2. 插入图片时 `src` 在小程序端需要是本地路径或已上传的网络地址
3. 内容变化通过 `@input` 事件监听，不是双向绑定
4. 编辑器必须在 `onReady` 后才能获取到 `editorCtx`
5. 小程序端的 `placeholder` 需要等编辑器就绪后才会显示
6. 不要对编辑器实例使用 `v-if`，会导致上下文丢失
