---
name: apple-design
description: 基于 Apple 设计原则与 HIG 设计、实现和评审 App、网页与设计系统。用户提到“Apple 风格”“苹果风”“HIG”“人机界面指南”“iOS 设计”“SF 字体”“液态玻璃”“Liquid Glass”“液态屏幕”“苹果毛玻璃”“iOS 26 风格”“玻璃拟态”“glassmorphism”“玻璃卡片”“玻璃导航栏”“高光玻璃按钮”“玻璃弹窗”时使用。覆盖 HTML/CSS、React、Vue、SwiftUI、UIKit、Flutter、React Native；不用于 Liquid Retina 硬件屏幕参数。
---

# Apple Design

以内容、层级、交互和平台惯例为基础，产出简约、素净、可操作的界面。**Apple 风格页面、普通毛玻璃与 Liquid Glass 是不同交付目标，必须先识别目标。**

## 通用工作流

1. 明确产品用途、目标用户、主任务和现有技术栈；保留已有品牌与用户改动。
2. 阅读 `references/design-system.md`；普通网页追加 `references/web-adaptation.md`，可复用 `assets/apple-web-template.css`。
3. 建立信息层级，完成真实操作、空状态、错误与恢复路径，不以装饰替代功能。
4. 检查语义、焦点、字号、深色、触摸和响应式；按交付目标验证真实效果。

| 原则 | 判断依据 |
|---|---|
| 目标感 | 主任务清楚，功能确有用途 |
| 能动性 | 可探索、返回、撤销和恢复 |
| 责任感 | 意图透明，不伪造能力或结果 |
| 熟悉感 | 平台惯例、用语与反馈一致 |
| 灵活 | 多输入方式、辅助功能与环境适配 |
| 简洁 | 信息层级清晰，删除无目的装饰 |
| 匠心 | 细节、状态与真实运行经过检查 |
| 愉悦感 | 适量反馈服务任务，不增加干扰 |

默认黑白灰、留白和同色系明暗变化。**不主动添加大红大紫大蓝底色、多色光球、彩虹渐变、霓虹或循环背景动画。** 品牌色只在用户/品牌确有要求时使用。字体用系统栈，中文覆盖苹方和 Microsoft YaHei；布局沿用项目 spacing/radius Tokens。

## Liquid Glass：先定义材质，再选技术

“液态玻璃 / 液态屏幕”在此指 Apple 的 Liquid Glass 材质语言。必须先读 `references/official-liquid-glass.md` 与 `references/design-principles.md`。**不能仅凭 blur、白边和软阴影就声称实现了 Liquid Glass。**

核心是四件事：

1. **Lensing（透镜感）**：背景细节在材质边缘发生可见弯折，中央仍能辨认来源内容；白色描边不能代替折射。
2. **连续运动**：触摸弹性、选择态移动、按钮展开为面板时保持同一块材质的连续性；相关状态通过几何变化衔接。
3. **环境适应**：原生系统根据内容调整材质；Web 必须说明已实现的范围，用局部可读性措施和实际背景验证，不能假装具备系统级适应。
4. **正确层级**：用于浮在内容之上的导航与功能控件。**不要把文章、表格、任务面板或整张内容卡片都玻璃化；避免玻璃叠玻璃。**

官方语义材质为 **Regular / Clear**：默认 Regular；Clear 仅在富媒体背景、可接受必要压暗、前景文字/符号粗亮时采用。具体条件见官方参考。已有 subtle / medium / strong 是历史 Web 毛玻璃调参档位，不对应官方材质，也不是效果验收标准。

## 实现路由与能力边界

| 实际条件 | 路线 | 必须披露 |
|---|---|---|
| Apple 原生 26+ 与相应 SDK | glassEffect / GlassEffectContainer / UIGlassEffect | 优先系统 API；仍测试自定义布局、颜色、动画与辅助功能 |
| Web，背景是自己绘制或可加载的图片/Canvas | `assets/liquid-glass-optics.js` + `assets/liquid-glass-optics.css` | 对同一背景纹理做 WebGL 重采样，提供真实可见的近似折射；不是 Apple 渲染器 |
| Web，背后是任意 DOM | 先确定能否把需要折射的背景变成受控渲染源；保留语义 DOM 控件 | 当前渲染器不能自动读取任意 DOM；不要放一张无关纹理冒充背景 |
| WebGL/采样源不可用，或用户只要基础毛玻璃 | `assets/liquid-glass.css` + `assets/liquid-glass.js` | 明确标为**基础毛玻璃降级**，不能宣布理想 Liquid Glass 已完成 |
| Flutter / React Native | 优先目标 SDK 的原生 Liquid Glass 桥接；否则自绘受控纹理或明确降级 | BackdropFilter / BlurView 单独使用不等于 Liquid Glass |

平台未知时先读项目；无项目默认 Web 受控背景示例。只在背景来源、平台限制会改变结果时询问最小问题，不因例行选择重复确认。

**不能承诺任意浏览器、任意背景都像 Apple。能保证的是路由明确、模板可复用、能力不足会暴露、验收未通过不会被标成完成。**

## Web 首选起点

读 `references/web-implementation.md`，复制 [折射与形变基准](examples/optical-reference.html) 及其资源，先运行原样基准，再替换为目标产品。

- `assets/liquid-glass-optics.js`：WebGL 透镜渲染器，输入受控背景与 CSS 像素坐标中的圆角矩形；实例隔离、清理、上下文恢复、失败状态。
- `assets/liquid-glass-optics.css`：画布/真实 DOM 控件分层、基础与实底降级。
- `assets/tokens.json`：保留配方来源；optics 与历史 intensity 分开，数值是起点而非 Apple 官方参数。
- 背景必须与透镜采样源一致；先用灰阶网格、线条或文字暴露折射，再用产品内容复验。禁止用“改成彩色背景”掩盖材质缺失。
- 不在整个透镜上叠加 56%/80% 等厚遮罩。需要保护文字时使用局部衬底、已验证前景或受控背景；整体不透明只用于明确降级。
- DOM 内容保持清晰与可访问，不能对文字套 filter:blur；画布只承载材质。普通应用应默认使用真实 button/nav，而不是 Canvas 点击区域。
- 连续几何变化只驱动渲染器参数与 transform/opacity；不要每帧改文档流尺寸。动画休止时停止 rAF，减少动态时直接切到目标几何。
- 不默认采用 SVG backdrop URL 滤镜：CSS.supports 通过不证明浏览器实际执行；使用该路线必须做同背景折射开/关对照。

## 验收门槛（不可用静态检查替代）

交付前读 `references/visual-validation.md`，按目标平台记录证据：

- [ ] 折射开启/关闭的同位置对照：背景边缘细节实际发生位移。
- [ ] 中央透光：看得出背景来源，不能只看到厚白/厚黑卡片。
- [ ] 相关控件变化连续：选中态移动、按钮展开、输入反馈经过实际操作。
- [ ] 文字对比度、键盘、焦点归还与输入取消正确。
- [ ] 降低透明度、减少动态、能力不足时的状态可辨认且可操作。
- [ ] 目标视口无溢出；性能、触摸与未测平台如实记录。
- [ ] 截图/录制/结果与当前文件哈希对应；修改渲染代码后旧证据失效。

```sh
# 光学代码静态预检：退出 0 也只代表静态结果，仍须视觉验收
node scripts/validate.mjs --profile optical examples/optical-reference.html
# 同时核对对应版本的验收记录
node scripts/validate.mjs --profile optical --evidence references/qa/optical.json examples/optical-reference.html
```

**缺少折射/相关形变或视觉证据时，不得声称“已实现理想 Liquid Glass”。** 应继续修正；若平台条件确实阻断，说明当前降级级别和需要的背景/平台条件。不能自动给未执行项目打勾。

## 按需参考

| 内容 | 文件 |
|---|---|
| 官方定义、Regular/Clear、来源与更新时间 | `references/official-liquid-glass.md` |
| 光学线索、素净背景与层级 | `references/design-principles.md` |
| Web 渲染源合同、复用步骤和 fallback | `references/web-implementation.md` |
| React / Vue 生命周期和组件接入 | `references/react-implementation.md`、`references/vue-implementation.md` |
| SwiftUI / UIKit 原生与兼容 | `references/swiftui-implementation.md` |
| Flutter 与跨平台选择 | `references/flutter-implementation.md`、`references/platform-matrix.md` |
| 性能、辅助功能与视觉验收 | `references/performance.md`、`references/accessibility.md`、`references/visual-validation.md` |
| 清单入口 | `references/liquid-glass-checklist.md` |

正式案例只有 [折射与形变基准](examples/optical-reference.html)。基础毛玻璃、实底与减少动态模式在同一案例中验证；共享样式与兼容资源按需使用，不另设容易混淆的基础展示入口。

## 交付契约

提供：①完整可运行代码/资源和启动方式；②所选原生/光学/降级路线与背景合同；③材质与动效参数；④降级代码；⑤真实视觉/交互证据及未测项；⑥与 Apple 原生的差异。普通咨询或评审只回答所需分析，不擅自生成代码。

最后复查内容层级、主任务、恢复路径、可访问性与视觉一致性。已完成的普通功能不能替代材质目标的验收。
