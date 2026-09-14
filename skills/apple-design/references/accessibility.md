# Liquid Glass 无障碍

## 1. 对比度与估算

正文 ≥4.5:1；大号文字（≥24 CSS px 常规，或 ≥18.66px 粗体）≥3:1。对比度针对最终合成背景，不是 CSS 的半透明白色本身。正文不能通过 opacity:.85 来减淡后仍沿用原估算。

先采背景最亮/最暗区域，再考虑模糊后的饱和、高光、扫光与遮罩；图片/视频要覆盖多个帧。优先用语义文字色与 readable 遮罩，不够时提高适当颜色的遮罩不透明度；白字背景加白 α 会更难读，不能一律“提高 bgAlpha”。文字投影只能辅助。

计算方法：sRGB 通道 c/255；≤.04045 时除以 12.92，否则 `((c + .055)/1.055)^2.4`；相对亮度 L = .2126R + .7152G + .0722B；比值 `(L亮 + .05)/(L暗 + .05)`。

资源的估算边界：浅色 readable 白 α .56，在最黑背板上也至少接近 #8f8f8f，文字 #1d1d1f；深色 readable #121212 α .80，在最白背板上叠径向光 .20×.6 与扫光 .14×.6，得到保守上界，再与 #f5f5f7 比较。按当前 Tokens 计算约为浅色 **5.19:1**、深色 **5.26:1**。边缘顶部高光不应穿过正文。这是简化 sRGB 合成估算，不能替代截图采样。更改任何文字/遮罩 Token 后重新计算。

## 2. 降低透明度

```css
@media (prefers-reduced-transparency: reduce) {
  .lg-surface { background: var(--lg-solid); color: var(--lg-text); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .lg-surface::before, .lg-surface::after { display: none; }
}
```

solid-light=#f5f5f7，solid-dark=#1c1c1e，使用对应文字 Token。规格中的 rgba(...,.92) 不是不透明，因此本实现升级为实底。支持差异可通过应用内“减少透明效果”开关设置根 `.lg-opaque` 弥补，不能把该开关当系统偏好事实。

## 3. 减弱动态

```css
@media (prefers-reduced-motion: reduce) {
  .lg-surface, .lg-surface::before, .lg-surface::after { transition: none !important; animation: none !important; }
  .lg-surface::before, .lg-surface::after { display: none; }
  .lg-button:active:not(:disabled) { transform: none; }
}
```

JS 必须响应 matchMedia change，而不是仅初始化时检查一次；正在排队的 rAF、touch 计时器与 active 状态要取消。无自定义动态时保留静态 inset 即可。不要改写 TabBar 的定位 transform，针对按钮的按压缩放关闭即可。

扫光 ≥600ms，默认 900ms，单次无循环；视差上限 8px，本资源默认无视差。无频闪，不使用超过 3Hz 的闪烁亮度变化。

## 4. 键盘与语义

- 点击操作优先 button；链接用 a href。若不得不用 role=button + tabindex=0，必须另实现 Space/Enter 激活、禁用语义和焦点，属性本身不够。
- 装饰 DOM 层 aria-hidden=true、pointer-events:none；伪元素没有可设置的 aria-hidden，保持空 content，不承载朗读文本。
- 交互命中区域 ≥44px，逻辑 DOM 顺序与读屏顺序一致。
- :focus-visible 使用对比明显的实线与外圈；不可被 overflow 裁掉，不用颜色作为唯一选中标记。
- 导航用 aria-current，切换按钮用 aria-pressed；原生 radio 优先承担单选分段控件，不错误混用 tab 角色。

## 5. 弹窗

示例 [modal.html](../examples/modal.html) 使用 `<dialog>` + showModal + `<form method="dialog">`：浏览器负责模态背景隔离、Tab 范围与 Escape。aria-labelledby 指向可见标题，aria-describedby 指向说明，关闭时回焦开启按钮；首焦点放非破坏性操作。

自定义 div 模态框需 role=dialog、aria-modal=true、焦点陷阱、背景 inert、Escape、关闭按钮、焦点归还；仅加 ARIA 不产生模态行为。避免视觉演示按钮携带真实不可逆删除。示例采用可逆的专注开关语义。

## 6. 强制颜色与缩放

```css
@media (forced-colors: active) {
  .lg-surface { color: CanvasText; background: Canvas; border: 1px solid CanvasText; -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: none; }
  .lg-surface::before, .lg-surface::after { display: none; }
  .lg-surface:focus-visible, .lg-surface :focus-visible { outline-color: Highlight; }
}
```

不要 forced-color-adjust:none 阻止用户主题。200% 缩放下检查导航换行、弹窗高度与页面滚动；文本容器不固定高度。系统动态字号/平台读屏另在原生端验证。

## 7. 交付测试清单

- [ ] 深浅模式、最亮最暗背景、hover 与 sweep 中途正文达标，附采样/估算与比值
- [ ] 降低透明度实际无模糊、高光，文字与背景同步变化
- [ ] 页面运行时开启减弱动态，立即停止跟踪/扫光/视差/按压缩放
- [ ] Tab/Shift+Tab 遍历，焦点可见；按钮 Space/Enter 激活
- [ ] 弹窗首焦点、循环、Escape、取消/确认与焦点归还正确
- [ ] VoiceOver / NVDA 标签、内容、状态变化朗读正确
- [ ] Windows forced-colors 与 200% 缩放可用
- [ ] 触摸可滚动，高光不持续追踪，不阻止默认输入

未执行的项注明“待验证”。静态脚本只能检查代码候选，不能代替读屏或视觉测试。
