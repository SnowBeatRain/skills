---
name: design-ui-gallery
description: 用于 UI 视觉风格选型、风格方向探索、美学参考；当用户提到 UI 风格、视觉风格、glassmorphism、毛玻璃、brutalism、粗野主义、claymorphism、粘土风、neumorphism、新拟态、bento、便当盒布局、minimalism、极简、skeuomorphism、拟物、dark mode、暗色模式、flat design、扁平化、landing page 风格、dashboard 风格时使用。不用于配色/字体/间距等设计系统基础（用 design-system）。
---

# Design UI Gallery Skill

## 意图

帮助 Agent 快速定位视觉风格方向。当用户说"参考 XX 风格"或"给我几个风格方向"时，提供风格特征描述、适用场景和关键实现要素。

本 skill **负责视觉风格选型**。设计系统基础（配色、字体、间距）用 `design-system`；具体组件实现用目标框架 skill。

## 触发场景

- 用户要求某种视觉风格（毛玻璃、粗野主义、极简等）。
- 需要探索多个风格方向做选择。
- 需要了解某种风格的关键实现要素。
- 落地页、后台、移动端 App 的整体视觉方向选择。

## 工作流

### 1. 确认需求

1. 项目类型：落地页 / 后台 / 移动端 / 展示站。
2. 品牌调性：专业 / 友好 / 科技 / 文艺 / 大胆。
3. 目标用户群体。
4. 参考风格关键词。

### 2. 风格探索

读取 `references/style-catalog.md`，找到匹配的风格方向。

每种风格包含：
- 特征描述
- 关键要素（色彩、形状、动效）
- 适用场景
- 代表案例
- Tailwind / CSS 关键属性

### 3. 应用场景参考

按项目类型读取对应参考：

| 场景 | 读取 |
|---|---|
| 落地页 | `references/landing-page.md` |
| 后台 / Dashboard | `references/dashboard.md` |
| 移动端 | `references/mobile-app.md` |

### 4. 实现方向

风格确定后，给出关键 CSS/Tailwind 属性方向。具体组件实现交给目标框架 skill。

## References

| 场景 | 读取 |
|---|---|
| 风格目录（全部风格） | `references/style-catalog.md` |
| 落地页风格 | `references/landing-page.md` |
| Dashboard 风格 | `references/dashboard.md` |
| 移动端风格 | `references/mobile-app.md` |
