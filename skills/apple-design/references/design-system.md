# 设计基础

仅在建立或调整视觉规范时读取。沿用项目 Tokens；下列数值是 Web 起点，不是跨平台 HIG 常量。

## 层级与配色

- 让主任务、当前位置和主要操作可辨认；以留白、字号和灰度建立层级，避免重复边框、卡片和胶囊。
- 主操作、状态和品牌色各有语义，不给所有控件同等强调；不只靠颜色传达状态。
- 原生使用动态系统颜色与语义文本样式，不以十六进制快照替代 UIColor/NSColor/SwiftUI API。
- Web 前景与背景成对定义，区分文字色、按钮填充和状态图标色；深色主题独立映射。
- 正文对比度至少 4.5:1；大字至少 3:1（Web ≥24 CSS px 常规或 ≥18.66px 粗体）。必要的非文本边界/图形通常至少 3:1，以实际合成背景检查。

| Web 色对示例 | 用途与限制 |
|---|---|
| #1D1D1F / #FFFFFF | 浅色主文字/背景 |
| #626267 / #FFFFFF | 浅色次要文字；“次要”也须可读 |
| #F5F5F7 / #1C1C1E | 深色主文字/背景 |
| 白字 / #0066CC；黑字 / #409CFF | 本包浅/深色按钮配方，品牌替换后重测 |

#86868B 对白底约 3.62:1，#007AFF 对白字约 4.02:1，不能无条件用于普通字号。完整 CSS 值以 [模板资产](../assets/apple-web-template.css) 为准，不在文档再维护一份令牌副本。

## 字体、间距与图标

- Web 用系统字体栈，中文覆盖 PingFang SC、Microsoft YaHei；不要求下载/分发 SF 字体。原生采用语义字号及 Dynamic Type。
- Web 正文可从 15–17px、说明 13–14px、区块标题 20–28px 起步；使用 rem/相对行高，保留缩放，长内容允许换行。
- 正文行高约 1.4–1.6；大标题服务内容，不因 Apple 风格强制增加 Hero。
- 无既有间距规范时以 4px 为基础、8px 为常用节奏；并非 HIG 强制 8pt 栅格。
- 原生遵循安全区 API；Web 贴边控件按需使用 env(safe-area-inset-*)，不硬编码底部 34px，也不重复叠加父容器已处理的 inset。
- 图标保持同一视觉体系。SF Symbols 核对目标 OS 可用性；Web 使用许可适合的 SVG/图标库。区分图标尺寸与命中区域。

控件宽度、动态选项和面板排布问题见 [组件指南](component-patterns.md#1-尺寸与排布)，不由材质决定尺寸。普通内容可用实底或标准材质；仅在需要 Liquid Glass 选型时读 [材质语义](official-liquid-glass.md)。

依据：[Apple Design](https://developer.apple.com/design/)、[HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)、[Layout](https://developer.apple.com/design/human-interface-guidelines/layout)、[Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)。来源于 2026-09-15 的核对；平台变化时重新查证。
