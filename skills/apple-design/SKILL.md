---
name: apple-design
description: 基于 Apple 设计原则与人机界面指南（HIG）设计、实现和评审 App、网页与设计系统。用户提到“Apple 风格”“苹果风”“HIG”“人机界面指南”“iOS 设计”“SF 字体”“液态玻璃”“Liquid Glass”“液态屏幕”“苹果毛玻璃”“iOS 26 风格”“玻璃拟态”“glassmorphism”“玻璃卡片”“玻璃导航栏”“高光玻璃按钮”“玻璃弹窗”时使用。覆盖 HTML/CSS、React、Vue、SwiftUI、UIKit、Flutter、React Native；不用于 Liquid Retina 硬件屏幕参数。
---

# Apple Design（Apple 设计风格与思想）

用 Apple 的设计语言做界面设计：**目标感、能动性、责任感、熟悉感、灵活、简洁、匠心、愉悦感** 八大原则为判断依据，HIG（人机界面指南）为基础与组件规范，产出干净、克制、层级清晰、内容至上的设计。

## 工作流（每次设计都按此推进）

1. **明确意图**：一句话说清产品用途与目标用户；确定主任务和最重要的功能（目标感）。
2. **定信息架构**：内容优先，建立清晰层级——用户随时知道"我在哪、能做什么"（简洁·层级）。
3. **视觉设计**：按 `references/design-system.md` 的设计令牌（色彩/字体/间距/材质/图标）落地；网页场景追加读 `references/web-adaptation.md`，可用 `assets/apple-web-template.css` 起步。
   明确要求 Liquid Glass 时走下文专用流程，按平台读取参考；普通 Apple 页面不必全部玻璃化。
4. **交互与反馈**：每个操作有明确反馈（加载/成功/失败/空状态）；允许撤销与返回（能动性）。
5. **无障碍与适配**：动态字号、对比度、旁白/语义化、多输入方式、深色模式（灵活·责任感）。
6. **自检**：用文末《设计自检清单》逐项核对后再交付。

## 设计原则（判断一切的价值观）

| 原则 | 含义 | 落地要点 |
|---|---|---|
| 目标感 | 创造有意义的产品 | 提供价值、保持专注、找到差异化新方法 |
| 能动性 | 让用户随心所欲 | 不妨碍工作、允许自由探索、误操作可恢复 |
| 责任感 | 以用户最佳利益为核心 | 意图透明、权限与数据最小化、保护隐私 |
| 熟悉感 | 基于用户既有认知 | 用已知概念、全站一致、清晰反馈 |
| 灵活 | 适应不同情境与需求 | 无障碍先行、保留情境、多输入方式、认真对待每个平台 |
| 简洁 | 清晰直接 | 只留必要内容、措辞精简、层级一目了然 |
| 匠心 | 重视每个细节 | 动画/措辞/空状态都打磨、原型迭代、持续维护 |
| 愉悦感 | 融入人文关怀 | 明确情绪基调、创造决定性时刻、不让愉悦妨碍任务 |

## 核心设计系统（速查）

- **色彩**：默认简约、素净，以黑白灰和同色系明暗变化为主；已有品牌色优先保留，仅在关键操作或状态中适量使用强调色。不得为“AI 设计感”主动生成大红、大紫、大蓝的底色、多色渐变或发光色团。语义色和深色模式见 `references/design-system.md`，对比度满足 WCAG AA。
- **字体**：SF Pro（西文）+ 苹方 PingFang SC（中文）；网页用 `-apple-system` 字体栈；正文 ≥ 常规重量，标题用加粗/大字重，不用纯颜色做唯一区分。
- **间距与布局**：8pt 栅格；内容边距 iOS ≈16pt、macOS ≈20pt；安全区适配圆角/刘海/灵动岛。
- **材质**：传达导航、控件、浮层的层级。Apple 原生优先系统 Liquid Glass；Web 用模糊 + 饱和 + 边缘高光近似。正文内容优先实底，避免整页玻璃化。
- **图标**：语义化、几何统一、线条简洁；iOS 优先 SF Symbols，网页用同风格线性图标（1.5–2px 描边）。
- **动效**：自然、克制、有原因（表达层级/状态变化）；时长 150–300ms，支持减弱动态效果。

## 交付形态指引

- **App/界面设计稿**：输出结构描述 + 视觉规范（色值/字体/间距）+ 关键页面说明；如需要可视稿，用 HTML/CSS 还原高保真界面。
- **网页设计**：直接产出可运行的 HTML（内联 CSS），遵循 `references/web-adaptation.md`，优先用 `assets/apple-web-template.css` 作为起点。
- **设计评审**：对照《设计自检清单》逐条给出问题与修改建议，标注优先级。

## 参考文件

- `references/design-system.md` — HIG 设计系统全量参考（色彩色值、字体字阶、间距、材质、组件、图标、无障碍）。**做任何视觉设计前先读。**
- `references/web-adaptation.md` — Apple 风格网页适配（字体栈、CSS 令牌、布局、组件、示例代码）。**网页设计任务必读。**
- `assets/apple-web-template.css` — 可直接复制的 Apple 风格 CSS 起点模板（令牌 + 基础组件）。

## Liquid Glass 专用流程

本分支把“液态玻璃 / 液态屏幕 / Liquid Glass”解释为 WWDC25 随 iOS 26、macOS 26 引入的材质语言，不是 Liquid Retina 屏幕。用于 card、button、navbar、tabbar、modal、sheet、sidebar、tooltip、segmented；普通模糊效果用简版，其他视觉风格遵循用户要求。

1. **平台**：沿用项目技术栈；未知时默认 HTML/CSS，说明默认，可在交付末尾询问其他平台需求，不阻塞实施。
2. **背景**：检查玻璃背后的实际内容。优先真实页面内容或低对比度灰阶渐变、细微纹理；“有背景可透”不等于“必须彩色”。只有用户或品牌明确需要时才使用彩色图片/渐变，不默认添加光球、彩虹渐变或循环背景动画。用户坚持纯色时说明玻璃感会减弱，保留其选择。
3. **强度与形态**：默认 medium；大容器 subtle，小控件 strong。同屏通常不超过两档。以下数值是本 Skill 的近似配方，**不是 Apple 官方参数**；不要求固定 60% 透明度、150% 饱和度。
4. **分层**：页面背景 → 玻璃主体（模糊、饱和、边框、阴影）→ 装饰高光 → 不透明文字/图标。用 isolation 与内容层 z-index 隔离；高光不能遮挡点击或溢出圆角。
5. **Tokens**：先读 `assets/tokens.json`；Web 复制 `assets/liquid-glass.css`。材质颜色、圆角、动效从令牌取值；适配现有品牌时修改令牌并记录，不散落魔法数字。
6. **交互**：Web 复用 `assets/liquid-glass.js`；原生用系统 API。细指针按 rAF 更新绘制变量；触摸只在 pointerdown 定位一次；卸载清理监听、rAF、计时器和观察器。
7. **降级**：按下面矩阵处理透明度、动态、能力、输入方式与主题；低端设备或移动端默认 subtle、避免嵌套、关闭持续跟踪。
8. **验收**：运行静态校验，再检查真实背景、键盘与视觉状态。静态通过不能代表对比度、帧率或辅助技术通过。

| 档位 | blur | saturate | 背景 α | 边框 α | 适用 |
|---|---|---|---|---|---|
| subtle | 12px | 140% | 0.08 | 0.20 | 大面积容器、侧栏 |
| medium | 24px | 180% | 0.14 | 0.35 | 卡片、导航栏、弹窗 |
| strong | 36px | 220% | 0.22 | 0.50 | 按钮、TabBar、浮动小控件 |

### 强制约束

- Web 模糊与饱和成对；常用 20–30px / 160–200%，三档具体值以 Tokens 为准。
- 1px 半透明亮边、至少一条顶部 inset 高光、柔和外阴影；最多四组阴影，不堆五层以上模拟厚度。
- 浮动容器圆角通常 20–32px，最小 16px；药丸与贴边导航（0px）是明确例外。SwiftUI 显式 continuous shape；Web radius 只是近似。
- 正文对比度 ≥4.5:1，大字 ≥3:1；优先调整文字/实底遮罩，其次加深局部底色；不能只靠文字投影。可读性优先于通透度。
- 玻璃嵌套最多 3 层、目标 1 层；同屏目标 ≤3 个、上限 5 个。禁止滚动列表逐项模糊。
- 高光不修改布局属性；扫光一次 900ms，悬停 200ms，按压 120ms；不持续循环，不动画化 blur，不常驻 `will-change: backdrop-filter`。
- 禁止用 `filter: blur()` 模糊组件内容，禁止霓虹、彩虹描边、过量发光、重投影。
- 悬浮/按压反馈只用于真实可操作控件；装饰卡片不加假按钮手势。强度选择用原生 radio 或完整的单选语义；导航用真实链接，无对应面板与键盘行为时不要使用 tablist。
- **Web 端无法复刻 Apple 官方折射效果**：本模板只近似模糊、饱和与高光，不含系统级边缘位移折射、背景自适应色调或玻璃流体融合。不得承诺像素级复刻。

### 降级矩阵

| 条件 | 必须处理 |
|---|---|
| `prefers-reduced-transparency: reduce` | 移除模糊与高光，提供真正不透明底色；同步文字颜色。可另提供应用内开关弥补浏览器支持差异 |
| `prefers-reduced-motion: reduce` | 关闭扫光、跟踪、视差与按压缩放；保留静态顶部高光，JS 响应偏好运行时变化 |
| 不支持标准/前缀 `backdrop-filter` | `@supports not` 改高不透明度纯色、提高边框可见度，同时修正文字色 |
| 移动端 / 粗指针 / 低性能 | subtle、单层、无扫光和持续跟踪；触摸可做一次定位 |
| 深色模式 | 背景 α 0.06、边框 α 0.18、加深柔和阴影；规则在强度类之后生效 |
| Windows 强制颜色 | Canvas / CanvasText，移除模糊、装饰与阴影，保留焦点 |

### 平台与资源路由（按需读取）

| 场景 | 参考 |
|---|---|
| 视觉原理、层级、圆角与高光 | `references/design-principles.md` |
| HTML/CSS、变体、背景、运行方式 | `references/web-implementation.md` |
| React 组件与 useGlassHighlight | `references/react-implementation.md` |
| Vue SFC 与 v-glass-highlight | `references/vue-implementation.md` |
| SwiftUI 26+ glassEffect / GlassEffectContainer、旧版 Material、UIKit | `references/swiftui-implementation.md` |
| Flutter BackdropFilter、装饰 ShaderMask 与降级 | `references/flutter-implementation.md` |
| 性能预算与排查 | `references/performance.md` |
| 对比度、焦点、弹窗、辅助技术 | `references/accessibility.md` |
| React Native、能力矩阵与平台决策 | `references/platform-matrix.md` |

可复制资源：`assets/tokens.json`、`assets/liquid-glass.css`、`assets/liquid-glass.js`。示例见 [卡片](examples/card.html)、[导航栏](examples/navbar.html)、[弹窗](examples/modal.html)、[强度切换演示](examples/liquid-glass-demo.html)、[材质对比](examples/liquid-glass-comparison.html)、[React](examples/react-glass-card.tsx)。五份 HTML 可直接打开；TSX 需 React 构建环境，不能作为 HTML 打开。

校验入口：`scripts/validate.mjs`。在本 Skill 目录运行：

```sh
node scripts/validate.mjs examples/card.html examples/navbar.html examples/modal.html examples/react-glass-card.tsx
node scripts/validate.mjs examples/liquid-glass-demo.html examples/liquid-glass-comparison.html
```

### Liquid Glass 交付契约

实现任务交付六项，可简洁合并表述：①完整可运行代码与依赖/启动方式；②Token 档位与实际值；③高光触发和动效时长；④三类降级代码及深色处理；⑤以下自检结果；⑥与 Apple 官方效果的差异。评审/咨询只交付用户所需分析，不擅自创建代码。

- [ ] 页面有实际可见的非纯色背景
- [ ] blur 与 saturate 成对；亮边、顶部 inset 与柔和外阴影齐全
- [ ] 圆角 ≥16px（贴边例外注明）；嵌套 ≤3、同屏 ≤5
- [ ] 对比度附最坏情况采样/估算；未测项目标“待验证”，不伪造勾选
- [ ] 减少透明度、减少动态、特性查询降级均可读
- [ ] 深色、触摸、强制颜色与键盘焦点可用
- [ ] 高光不写布局属性，离开/卸载/偏好改变时正确清理
- [ ] 无霓虹、彩虹渐变、多重发光；已说明 Web 折射限制
- [ ] 默认素净灰阶；使用彩色底色时有明确的用户要求或品牌依据

`references/liquid-glass-checklist.md` 是检查入口；[实现说明与验证记录](LIQUID_GLASS_AUDIT.md) 记录配方选择、示例用途与验证边界。演示页统一使用三档 Tokens，不把任何 Web CSS 参数称为 Apple 官方规范。

## 设计自检清单（交付前逐项核对）

**目标感**：用途一句话说清了吗？最重要功能是否被优先打磨？
**能动性**：能自由探索、随时返回吗？误操作可撤销吗？
**责任感**：权限/数据收集是否透明且最小化？
**熟悉感**：是否用了用户已知的概念？视觉与交互全局一致吗？状态变化有反馈吗？
**灵活**：动态字号、对比度、旁白/语义化达标吗？适配多设备与多输入方式吗？
**简洁**：有没有可删的元素或文案？层级是否一眼可见？
**匠心**：空状态/错误态/加载态打磨了吗？动效是否流畅自然？
**愉悦感**：明确了想激发的情绪吗？有没有值得记住的决定性时刻？
