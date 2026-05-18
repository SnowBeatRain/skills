# App-nvue 横竖屏兼容与布局排障

适用范围：`uni-app Vue3` 的 `App-nvue` 页面，尤其是视频监控、回放、云台、日历、时间选择器这类横竖屏共用组件。

## 核心结论

App-nvue 横竖屏兼容的核心不是"把所有样式改成 px"，而是 **把横屏当成一套独立布局系统**，让方向、尺寸、定位、隐藏态都明确分开。

横屏下直接复用 `rpx` 很容易出问题——Vue3 的 `App-nvue` 在横屏下会按更宽的可视宽度重新换算 `rpx`，导致字体和控件比例被放大，页面内容反而变小。

## 处理原则

### 1. 横屏和竖屏分开写

不要共用同一个类名：

```vue
<!-- ❌ 不推荐 -->
<view class="play_control">

<!-- ✅ 推荐：拆成独立类 -->
<view class="xxx_portrait_play_control" v-if="direction == 'portrait'">
<view class="xxx_landscape_play_control" v-else>

<!-- ✅ 也可以动态绑定 -->
<view :class="direction == 'portrait' ? 'xxx-portrait' : 'xxx-land'">
```

### 2. 横屏样式只用 px

横屏专用类直接写 `px`，不要用 `rpx`。

可接受的模式：

```js
const size = props.isLandscape ? Math.round(num / 2) + 'px' : num + 'rpx'
```

### 3. 用直接类选择器

nvue 下重要 overlay（浮层）样式尽量写成直接类选择器，不要过度依赖层级嵌套：

```css
/* ✅ 直接类 */
.some-overlay-land {
  position: fixed;
  z-index: 100;
  bottom: 60px;
}

/* ❌ 嵌套选择器 — nvue 覆盖力弱 */
.container .controls .overlay { ... }
```

关键属性必须出现在直接类中：

- `position: fixed`
- `z-index`
- `top` / `left` / `right` / `bottom`
- `width` / `height`
- `font-size`

### 4. 共享类只保留最小公共能力

泛名类（如 `play_control`、`choose-time`、`play-button`）横竖屏一起用很容易冲突。

经验规则：

- 公共类只留布局壳（flex 方向、基础间距）。
- 尺寸、位置、字体、边距放到 `*-portrait` / `*-land`。
- 同一个组件内部，尽量不要让横竖屏共用同一个高风险类名。

### 5. 依赖父页传入方向状态

父页统一决定方向，子组件接收 `isLandscape`：

```vue
<child-component :isLandscape="direction != 'portrait'" />
```

子组件根据 `isLandscape` 自己控制宽高、字号、边距、圆角、指示条位置等。

### 6. 旋转后不要复用旧的隐藏偏移

横竖屏切换时，旧的 `top: -10000px`、`width: 0`、`height: 0` 之类隐藏方式，不能被新方向继续沿用。

建议拆成：

- `xxx-portrait-hidden`（竖屏隐藏态）
- `xxx-land-hidden`（横屏隐藏态）

避免切回去后控件还被藏着。

## rpx 在 nvue 横屏中的行为

| 事项 | 说明 |
|---|---|
| `750rpx = 屏幕宽度` | 换算基准，但横屏下按更宽宽度重新换算 |
| `pages.json` 的 `rpxCalcMaxDeviceWidth` 等 | 主要影响 App(vue2非nvue)/H5，不是 nvue 横屏的核心开关 |
| 横屏下用 `rpx` | 字体、控件比例会跟着横向宽度一起放大 |
| 横屏下关键控件 | 优先 `px + flex`，不依赖大面积 `rpx` |

## 典型模式

### 控制条拆分

一个页面如果同时存在竖屏控制条和横屏控制条，应拆成独立层：

- 竖屏底部控制条（`xxx-portrait` 类）
- 横屏底部控制条（`xxx-land` 类）
- 横屏浮层/弹框（独立 overlay 类）
- 竖屏对应区域

每个层内的尺寸、时间行、操作按钮、文本都应使用带方向后缀的独立类名。

### 浮层组件

横竖屏共用的浮层组件（日历、时间选择器等），保留一个入口，但横屏和竖屏各有一套类：

- 容器：`xxx-wrapper-land` / `xxx-wrapper-portrait`
- 头部：`xxx-header-land` / `xxx-header-portrait`
- 内容区：`xxx-body-land` / `xxx-body-portrait`

横屏样式全部走 `px`。

### Prop 驱动的尺寸切换

"模板基本相同，只是尺寸不同"的组件适合用 prop 驱动：

- `isLandscape` 为真时，数值统一按 `px` 计算。
- `isLandscape` 为假时，继续按 `rpx` 计算。

### 列表组件

列表类组件在横屏下的经验：

- 列表项、图标、分隔线、文本行高都不要混着 `rpx`。
- 这类列表在横屏下更容易被放大，必须固定尺寸。
- 子组件样式必须命名空间化，避免父级通用 class 污染。

## 排障顺序

遇到 nvue 横屏样式问题时，按此顺序排查：

1. **先看父页面有没有全局样式命中子组件**
   - nvue 子组件会被父级选择器污染。
2. **再看是否有绝对定位、固定宽高、固定行高**
   - 横屏下这些硬编码值会失效或错位。
3. **最后再调局部 margin / padding**
   - 不要上来就改间距，先确认定位和尺寸没问题。
4. **检查图标和文字重叠**
   - 先查 `position: absolute`、固定 `line-height`、硬编码宽度、父级选择器污染，再调间距。

## Flex 布局要点

nvue 默认 `flex-direction: column`，横屏布局推荐：

- 文本区域优先 `flex: 1`（自适应宽度）。
- 图标优先 `flex-shrink: 0`（不被压缩）。
- 长文本配合单行约束（`lines: 1` + `text-overflow: ellipsis`）。
- 右侧关闭按钮独立成右侧动作区，不和标题共用居中容器。

## 命名规范

命名建议用组件私有前缀，避免通用类名串样式：

| 模式 | 示例 |
|---|---|
| 组件前缀 + 元素 | `camera-list__icon` |
| 方向后缀 | `close-button-land` |
| 横竖屏双版本 | `play-button-land` / `play-button-portrait` |

## 源码级验证

不要只靠肉眼看设备，建议加一层源码级校验：

1. 横屏类名是否真的出现。
2. 横屏类里是否还残留 `rpx`。
3. 父页是否把 `isLandscape` 传给子组件。
4. 关键 overlay 类是否是直接类选择器。
5. 横竖屏是否还共用同一个高风险类名。

可以读取 `.vue` / `.nvue` 源码做断言，比截图更容易抓到"切换后样式没真正分离"的问题。

## Checklist

- [ ] 页面方向状态是否只有一个来源
- [ ] 横屏和竖屏是否拆成独立类
- [ ] 横屏是否只用 `px`
- [ ] 关键 overlay 是否是 `position: fixed`
- [ ] 关键 overlay 是否有明确 `z-index`
- [ ] 是否避免共享泛名类
- [ ] 子组件是否接收 `isLandscape`
- [ ] 是否把隐藏态和显示态分开
- [ ] 是否加了源码级回归测试
- [ ] 父页全局样式是否影响子组件
- [ ] flex 布局是否正确（文本 flex:1、图标 flex-shrink:0）
- [ ] 类名是否有组件私有前缀
