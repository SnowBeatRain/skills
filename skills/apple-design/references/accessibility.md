# Liquid Glass 无障碍与可读性

光学材质不能破坏操作语义。原生系统材质会参与辅助功能适配，但自定义布局与动效仍由应用负责。

## 1. 可读性与透明度

正文对比度 ≥4.5:1；大字（≥24px 常规，或 ≥18.66px 粗体）≥3:1。必须针对最终合成背景与实际文字色计算，不能只计算不透明 CSS Token。

优先前景颜色、布局与受控背景；必要时只在文字/图标附近加局部衬底，不在整个透镜区域铺厚白/厚黑遮罩。长篇或复杂内容用标准材质，本来就不应为透光牺牲阅读。

本基准 label 使用局部白 α .56 衬底与 #1d1d1f 文字；极端黑底的简化 sRGB 合成下约 5.19:1。这只约束该 label 的配方，不能推广到任意主题、图片、抗锯齿或其他文字。截图采样与目标场景复验仍需要进行。

计算：先把 sRGB 通道转线性亮度，L=.2126R+.7152G+.0722B；比值=(较亮L+.05)/(较暗L+.05)。背景采样覆盖边缘、中央、高光、移动/展开状态；透明 Canvas、CSS 叠加与截图色彩空间可能影响估算。

## 2. 输入与语义

- 材质画布 aria-hidden=true，真实 button/input/nav 保持在 DOM 中；不要用 Canvas 文字承担唯一语义。
- 点击用 button，导航用 a，选择使用完整单选/pressed 状态；不要在没有面板和键盘逻辑时套 tablist。
- 触控目标通常至少 44 CSS px；拖动提供方向键或等效按钮替代。
- 拖动绑定 pointer capture；up/cancel/lostcapture/布局变化时终止旧输入状态。
- Disclosure 用 aria-expanded/aria-controls；关闭内容 inert/hidden，不能只 opacity:0。Escape 关闭并回焦触发器；模态场景使用 dialog 与相应焦点约束。
- 焦点环不能被材质裁切或被背景吞掉，选中不只靠颜色。

## 3. 减少动态

CSS 的 `prefers-reduced-motion` 不能停止 JS/WebGL 动画。JS 监听 query.change 后取消/收敛 rAF，并直接设置目标几何。保留静态光学可以继续表达层级，不保留弹性拖尾或循环亮斑。

应用内“减少动态效果”可作为用户主动控制和测试入口，但其结果不能替代实际 OS 设置测试。两者应调用同一决策路径。

## 4. 降低透明度与强制颜色

Web 示例在 `prefers-reduced-transparency: reduce`、应用内实底模式和 forced-colors 下隐藏光学输出，显示控件的实底 backplate；来源内容与 DOM 操作继续存在。原生降低透明度可能表现为更磨砂，这与 Web 的实底兼容策略不同。

强制颜色使用 Canvas / CanvasText / Highlight 等系统色，关闭玻璃阴影与装饰。不要 forced-color-adjust:none。基础滤镜不可用时仍必须显示可读底色。

## 5. 验收

- [ ] 真实背景的对比度有采样或范围清楚的估算。
- [ ] 键盘完成选择、移动、展开与关闭，焦点返回正确。
- [ ] pointercancel/lostcapture 不残留拖动或光反馈。
- [ ] 运行时减少动态立即生效；实底与能力降级状态准确。
- [ ] 200% 缩放、窄屏、强制颜色、VoiceOver/NVDA 在需要的平台验证。
- [ ] 未执行项目如实标未测，不能以静态检查或应用开关替代系统/真机测试。

将证据按 [visual-validation.md](visual-validation.md) 记录并绑定当前代码。
