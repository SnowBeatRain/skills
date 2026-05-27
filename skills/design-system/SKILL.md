---
name: design-system
description: 用于设计系统、UI/UX 设计决策、视觉风格定义、配色方案、字体选型、布局模式、间距系统、组件设计规范；当用户提到设计系统、design system、配色、色彩方案、color palette、字体、typography、布局、layout、间距、spacing、圆角、border-radius、阴影、shadow、设计规范、设计令牌、design token、品牌风格、brand style、视觉语言时使用。不用于纯后端逻辑、数据库设计或与 UI 无关的架构决策。
---

# Design System Skill

## 意图

帮助 Agent 为 Web / 移动端项目建立或使用设计系统：配色方案、字体选型、间距/圆角/阴影系统、布局模式、组件设计规范、品牌视觉语言。

本 skill **负责设计系统层面的决策与规范**。具体框架实现（React/Vue/SwiftUI）、CSS 方案（Tailwind/CSS Modules）由用户另行指定。

## 触发场景

- 项目需要建立或更新设计系统。
- 需要选择或定义配色方案、字体组合、间距、圆角、阴影。
- 需要定义组件设计规范（按钮、卡片、表单、导航等）。
- 需要参考品牌视觉风格（Apple、Linear、Stripe 等）。
- 需要制定设计令牌（Design Tokens）。
- 需要在多个页面/组件间保持视觉一致性。

## 非目标

- 不负责具体框架的组件实现代码。
- 不负责纯后端逻辑或数据库设计。
- 不负责动画/交互的详细实现（只定义原则和方向）。

## 工作流

### 1. 确认项目类型与约束

1. 目标平台：Web / iOS / Android / 跨端。
2. 技术栈：React / Vue / Nuxt / Next.js / SwiftUI / Flutter。
3. 样式方案：Tailwind / CSS Modules / styled-components / 原生。
4. 品牌调性：专业 / 友好 / 科技 / 温暖 / 极简。

### 2. 配色方案

读取 `references/color-system.md`。

1. 确定主色（Primary）、辅助色（Secondary）、强调色（Accent）。
2. 定义语义色：成功、警告、错误、信息。
3. 定义中性色阶：文字、背景、边框、分割线。
4. 适配深色模式（Dark Mode）。
5. 检查对比度（WCAG AA / AAA）。

### 3. 字体选型

读取 `references/typography.md`。

1. 选择正文字体和标题字体（最多 2 个字体族）。
2. 定义字号阶梯（Type Scale）。
3. 定义行高、字间距、段落间距。
4. 考虑加载性能（自托管 vs CDN）。

### 4. 间距与布局系统

读取 `references/spacing-and-layout.md`。

1. 选择间距基数（4px / 8px grid）。
2. 定义间距阶梯：xs / sm / md / lg / xl / 2xl。
3. 定义容器宽度和断点。
4. 定义圆角、阴影层级。

### 5. 组件设计规范

读取 `references/component-patterns.md`。

1. 按钮样式（Primary / Secondary / Ghost / Danger）。
2. 卡片样式（默认 / 紧凑 / 宽松）。
3. 表单元素（输入框、选择器、开关）。
4. 导航模式（顶部 / 侧边 / 底部）。
5. 反馈模式（Toast / Modal / 内联提示）。

### 6. 品牌参考

读取 `references/brand-references.md`。

当用户提到"参考某品牌风格"时，查阅对应品牌的视觉特征摘要。

## References

| 场景 | 读取 |
|---|---|
| 配色系统与深色模式 | `references/color-system.md` |
| 字体选型与排版 | `references/typography.md` |
| 间距与布局 | `references/spacing-and-layout.md` |
| 组件设计规范 | `references/component-patterns.md` |
| 品牌视觉参考 | `references/brand-references.md` |
| 设计令牌定义 | `references/design-tokens.md` |
