# Web 实现指南

## 1. 起步与文件

`../assets/liquid-glass.css` 是完整且唯一的样式实现，避免在文档复制另一套易失配 CSS。`../assets/tokens.json` 是材质令牌源；修改后运行 `node scripts/validate.mjs --sync-tokens` 同步 CSS 令牌区，再校验。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Liquid Glass</title>
  <link rel="stylesheet" href="../assets/liquid-glass.css">
</head>
<body class="lg-demo lg-demo--center">
  <article class="lg-surface lg-surface--medium lg-radius--lg lg-card">
    <div class="lg-surface__content">
      <h1>液态玻璃卡片</h1>
      <p>在柔和背景上保留清晰内容。</p>
    </div>
  </article>
  <script src="../assets/liquid-glass.js" data-lg-auto="true" defer></script>
</body>
</html>
```

此结构按 examples 目录的位置引用资源。复制进项目时一并复制 assets 并调整路径。五份 HTML 示例无外部图片或包依赖，支持直接 file:// 打开；更完整的本地调试可在 Skill 根运行 `python -m http.server 8765 --bind 127.0.0.1`，访问 `/examples/liquid-glass-demo.html`。TSX 必须经 React 构建，见 React 指南。

## 2. 分层与组件形态

`.lg-surface` 承载 blur + saturate、渐变、边框、inset 与外阴影，`::before` 径向高光，`::after` 一次扫光，`.lg-surface__content` 的 z-index 最高。使用 isolation；伪元素 inset 为 0、自带 radius，组件不依赖 overflow:hidden 裁切后代焦点或下拉菜单。

| 组件 | 组合与语义 |
|---|---|
| card | article / section + lg-card + medium |
| button | 原生 button + lg-button + strong；内容用 span.lg-surface__content |
| navbar | nav + lg-navbar + medium；默认浮动圆角、sticky；lg-navbar--edge 才允许 0px |
| tabbar | nav + lg-tabbar + strong，保留底部安全区；导航链接不要伪装成 ARIA tabs |
| modal | dialog + lg-modal + medium，通过 showModal 打开，见 modal.html |
| sheet | dialog/语义容器 + lg-sheet，定位和开合按实际任务实现 |
| sidebar | aside + lg-sidebar + subtle，列表项用普通内容 |
| tooltip | lg-tooltip + subtle；由触发器 aria-describedby 关联，焦点与 Escape 可关闭 |
| segmented | lg-segmented；表单用 radio，开关用 aria-pressed，真正分页再用 tabs 键盘模式 |

不要让 `.lg-button { border:none }` 覆盖亮边。所有交互内容都在内容层内。不要在每个滚动列表项上加 backdrop-filter。

## 3. Tokens 与背景

默认 medium 为 24px、180%、背景 α .14、边框 α .35；半径 md 24px / lg 32px；外阴影 md `0 20px 50px rgba(0,0,0,.22)`。颜色、间距、高光与时长通过 `--lg-*` 读取。

`.lg-demo` 默认采用中性灰阶：浅色纸白/浅灰，深色炭灰/石墨灰，通过低对比度明暗渐变提供可透内容。无彩色光球、多色渐变或循环背景动画。“必须有背景内容”不要求彩色；不要因为生成玻璃 UI 就主动换成大红大紫大蓝底色。图片/视频只在用户或业务需要时使用获准素材，并测试其明暗极值；视频应有 poster 与停止播放策略。保留用户的纯色或品牌选择，必要时说明材质可见度取舍。

readable 遮罩保护文字：浅色白 α .56、深色中性炭灰 α .80，不能把最终合成背景误称为纯 .14 的透明层。若调整它，应重新估算整个高光周期的最坏对比度。

[强度切换演示](../examples/liquid-glass-demo.html) 使用原生 radio 控制预览卡片的强度类，保留键盘方向键和 checked 状态；桌面可比三档，移动端仍遵守性能降级。减少透明度开关使用 `.lg-opaque`。导航保持链接语义；可操作按钮有真实反馈，说明卡片不伪装成按钮。[材质对比](../examples/liquid-glass-comparison.html) 展示实底与玻璃各自适用的情境，实底卡片不是错误实现。

## 4. JS 接口与生命周期

资源是经典脚本，同时可由 ESM 副作用导入。**没有命名 ESM exports**，不要写 `import { initLiquidGlass } ...`。

```js
import './assets/liquid-glass.js';

const stop = globalThis.LiquidGlass.initLiquidGlass(document.querySelector('main'));
// DOM 替换或页面卸载时：
stop();
```

| API | 行为 |
|---|---|
| attachLiquidGlass(element) | 绑定单节点，返回幂等 cleanup；多持有者计数，避免互相拆监听 |
| initLiquidGlass(root) | 包含 root 自身及其已有后代，返回 cleanup |
| observeLiquidGlass(root) | 监听子树增删；移除节点及时清理；stop 包括后加节点 |

框架优先单节点绑定，避免全局观察器重复扫描。经典脚本只有 `data-lg-auto="true"` 才自动初始化；副作用 import 没有自动 DOM 扫描。

- 细指针桌面：enter/move 激活；事件只记录坐标，rAF 合并写入绘制变量。
- 触摸/粗指针：仅 pointerdown 定位，600ms 后清除；pointermove 不持续追踪，不 preventDefault 滚动。
- 矩形在首次刷新读取，滚动/窗口与元素尺寸变化时失效；若宿主动画主动改变位置，在交互开始前重新绑定或关闭该场景跟踪。
- leave、cancel、窗口失焦、偏好 change：取消 rAF/计时器并移除 active 与变量。
- 禁用：框架 interactive=false，或 `data-lg-interactive="false"`；低端模式在根设 `.lg-reduced`；不透明开关 `.lg-opaque`。不要把 hardwareConcurrency 当精确设备分级。

更改 CSS 渐变变量仍可能触发 paint，rAF 并不意味着只用 GPU；它避免事件内反复读写和布局属性变更，不保证零渲染成本。

## 5. 降级代码

下列规则已在资源中。深浅 Token 由主题级联配置，所以改变底色时文字仍正确。

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .lg-surface { background: var(--lg-fallback); border-color: var(--lg-fallback-border); }
}
@media (prefers-reduced-transparency: reduce) {
  .lg-surface { background: var(--lg-solid); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .lg-surface::before, .lg-surface::after { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .lg-surface, .lg-surface::before, .lg-surface::after { transition: none !important; animation: none !important; }
  .lg-surface::before, .lg-surface::after { display: none; }
  .lg-button:active:not(:disabled) { transform: none; }
}
```

`rgba(255,255,255,.92)` 仍有透明度；要满足真正不透明的要求，使用 solid Token。减少透明度媒体查询支持存在差异，应用内开关作为补充。强制颜色、深色、移动端、低性能规则见完整 CSS 与 [无障碍](accessibility.md)。

## 6. 验证与差异

```sh
node scripts/validate.mjs examples/card.html examples/navbar.html examples/modal.html examples/react-glass-card.tsx
node scripts/validate.mjs examples/liquid-glass-demo.html examples/liquid-glass-comparison.html
```

校验器递归读取相对 CSS/JS/import，支持 CSS 变量，并检查引用、常见配方和经典脚本语法；非完整 CSS/HTML/TSX 解析器，存在候选样式而未应用时可能通过。TSX 另外执行 tsc/构建；实际对比度、层数、主题级联、触摸、键盘和帧率需运行检查。不要把静态结果当成完整无障碍认证。

| 特性 | Apple 系统材质 | 本 Web 配方 |
|---|---|---|
| 模糊/饱和 | 系统处理 | CSS 近似 |
| 边缘位移折射 | 系统渲染 | 不提供 |
| 内容自适应色调 | 系统处理 | 仅手动主题/遮罩 |
| 玻璃融合与流体形变 | 原生容器与动画 | 不提供 |
| 光源响应 | 系统交互 | 径向高光与一次淡入淡出模拟 |

本 Web 端无法复刻 Apple 官方折射效果。Canvas/WebGL 等仅在用户确需自绘渲染管线且接受成本时讨论，不能承诺能通用折射任意 DOM。
