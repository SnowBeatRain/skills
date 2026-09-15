# Liquid Glass 材质语义

用于材质选型或核对官方行为；Web 实现的接口和几何规则不在本页重复。

## 定义与层级

Liquid Glass 通过透镜感、光反馈、连续运动和环境适应区分浮在内容上的功能层。普通 blur、白边与软阴影不能单独证明复现了它。

用于导航、工具和交互控件；正文、表格、普通内容卡片使用实底或标准材质。内容中的滑块/开关等瞬态交互元素可在激活时呈现玻璃。子控件用普通填充或 vibrancy 分组，避免一层玻璃上再叠完整玻璃。

原生 Regular、大侧栏和降低透明度外观可以更磨砂/不透明；不能以 Web 透明透镜基准强迫所有原生材质像 Clear。

## Regular / Clear

| 变体 | 选型 |
|---|---|
| Regular | 默认，模糊并调整背景亮度；文字较多或背景干扰阅读时优先 |
| Clear | 照片/视频等富媒体背景，前景简洁粗亮，优先保留内容可见性 |

Clear 在亮背景下可考虑约 35% 暗层；背景够暗或 AVKit 已有暗层时不重复叠加。暗层在玻璃后方，不是降低文字和按钮整体 opacity。35% 不是对比度保证：纯白底加 35% 黑层后与白字仅约 2.44:1，仍需检查最终合成结果。

Regular 的滚动边缘处理可进一步模糊、减淡背景内容，不等于再叠完整玻璃。

## 颜色与系统适应

- 默认从后方内容取色；小导航/工具控件可随局部背景调整明暗，大侧栏更不透明以保护文字。
- 主要操作可给背景着强调色；选中标签、文本或状态符号也可用色。显著按钮通常每视图一到两个，不是所有彩色元素的硬配额；破坏性操作不设为默认 primary。
- 原生使用语义 label/primary/secondary 与框架的 vibrancy。Vibrancy 不是模糊文字或 CSS saturate；systemGray3 不适合作为材质正文的通用固定色。
- 提供明暗模式的平台，自定义色应有浅/深及各自增强对比度变体；即使只呈现一种模式，也需支持玻璃适应所需的颜色资源，不等于必须新增主题切换按钮。
- 系统首选玻璃外观、减少动态、降低透明度和增强对比度分别处理；Web prefers-color-scheme 不会检测控件后的局部亮度。
- 标准 Material.regular 与 Glass.regular 不同；subtle/medium/strong、固定 blur、圆角及遮罩值只是本包配方，不是 Apple 标准。visionOS 窗口 glass 的例外见 [平台差异](platform-matrix.md#1-apple-平台差异)。

## 来源

2026-09-15 核对：[Materials](https://developer.apple.com/design/human-interface-guidelines/materials)、[Color](https://developer.apple.com/design/human-interface-guidelines/color#Liquid-Glass-color)、[Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)、[Glass.clear](https://developer.apple.com/documentation/swiftui/glass/clear)、[Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)。Materials 日志记载 2025-06-09 新增、2025-09-09 更新，Buttons 另有 2025-12-16 更新；不据此推断整个 HIG 的版本。API 与系统设置以目标 SDK/OS 为准。
