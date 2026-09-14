# Liquid Glass 实现说明与验证记录

本 Skill 在原有 Apple/HIG 指引中加入 Liquid Glass 路由、三档 Tokens、跨平台参考、可复制资源和示例校验。默认风格是简约、素净；材质通过明暗层次呈现，不依赖艳丽底色。

## 设计依据

- 用户确定采用 subtle / medium / strong 三档配方，替代此前固定 60% / 150% 的要求。
- 用户提供的 HTML 可借鉴强度选择、悬浮导航、指针高光与按压反馈；不采用彩色光球、彩虹徽标、发光圆点、背景循环动画或全页玻璃堆叠。
- “玻璃背后需要内容”不等于“背景必须彩色”。默认浅色纸白/浅灰、深色炭灰/石墨灰；已有品牌色用于必要操作或状态。
- 仅真正可操作的元素带按钮语义与按压反馈；强度选择采用原生 radio，导航采用真实链接。实底内容不是错误设计。
- 这些 Web 数值是项目配方，不是 Apple 官方参数。旧版报告中“完全符合官方规范”“必须 60% / 150%”等结论已撤回。

## 资源与示例

| 路径 | 用途 |
|---|---|
| [SKILL.md](SKILL.md) | 触发条件、平台路由、视觉约束与交付要求 |
| [tokens.json](assets/tokens.json) | 材质强度、圆角、高光、动效与中性背景的唯一令牌源 |
| [liquid-glass.css](assets/liquid-glass.css) | 组件形态、内容分层、主题与辅助功能降级 |
| [liquid-glass.js](assets/liquid-glass.js) | 指针/触摸高光、动态偏好与生命周期清理 |
| [强度切换演示](examples/liquid-glass-demo.html) | 原生单选、预览卡片、透明度开关和收藏反馈 |
| [材质对比](examples/liquid-glass-comparison.html) | 同背景下比较实底与玻璃的适用场景 |
| [卡片](examples/card.html) / [导航](examples/navbar.html) / [弹窗](examples/modal.html) | 最小可运行 HTML |
| [React 示例](examples/react-glass-card.tsx) | 组件、Hook、语义标签与类型声明；需构建环境 |
| [校验器](scripts/validate.mjs) | 相对引用、Token 同步、样式候选与经典脚本语法检查 |

五份 HTML 可直接本地打开，资源引用无需联网。React 和 Vue 的接入、SSR 与类型要求分别见 [React](references/react-implementation.md)、[Vue](references/vue-implementation.md)。Apple 原生优先系统 API，见 [SwiftUI/UIKit](references/swiftui-implementation.md)。

通用 `assets/apple-web-template.css` 保留原有 `.nav/.modal` 等项目样式；明确请求 Liquid Glass 时使用 `.lg-*` 资源。不要在同一个节点混用两套材质参数。

## 校验与维护

在 Skill 目录执行：

```sh
node scripts/validate.mjs --sync-tokens
node scripts/validate.mjs examples/card.html examples/navbar.html examples/modal.html examples/react-glass-card.tsx examples/liquid-glass-demo.html examples/liquid-glass-comparison.html
```

`--sync-tokens` 只用于修改 JSON 后更新 CSS 令牌区。仓库级检查从仓库根目录执行：

```sh
npm run validate
npm run test:validate
git diff --check
```

浏览器检查应覆盖桌面与窄屏、强度单选的鼠标/键盘切换、减少透明度、收藏反馈、弹窗 Escape 与焦点归还。非交互卡片不添加按压伪反馈；新页面限制玻璃数量，正文不逐项叠加模糊。

## 证据边界

2026-09-14 本轮验证：

| 检查 | 结果 |
|---|---|
| 仓库 Skill 校验 | 11 个 Skill 通过 |
| 仓库校验器回归测试 | 6 项通过 |
| 本包 5 个 HTML + 1 个 TSX 的静态预检 | 0 错误、0 警告；两份旧演示已统一配方与降级 |
| Skill frontmatter 与本地文档链接 | 通过 |
| 临时 DOM 验证 | SSR 导入、rAF 合并、触摸单次定位、动态偏好、观察器增删与清理通过 |
| 校验器临时失败用例 | 缺饱和、错误 filter:blur、缺动态降级、断资源引用均被拦截 |
| Chrome 桌面与 390px 演示 | 强度鼠标/方向键切换、减少透明度、收藏反馈通过；390px 实际降为 12px / 140%，无页面横向溢出 |
| 简化最坏对比度估算 | 浅色 5.19:1、深色 5.26:1；不等同于逐像素采样 |

React/Vue 模板的类型检查已在前一轮完成，当前调整未改变这些组件的逻辑。临时 DOM 用例使用隔离工具目录，不属于交付包的标准测试命令。

- 静态校验会递归读取相对 CSS/JS/import，并识别 CSS 变量；它不是完整 CSS/HTML/TSX 编译器，也不证明实际级联、读屏或帧率。
- 正文对比度依据前景和最终合成背景评估，当前保守估算与算法见 [无障碍](references/accessibility.md)；修改遮罩或文字色后重新计算。
- TypeScript/Vue 类型检查、浏览器行为检查、原生编译和真机性能是不同证据，不能相互替代。
- 本轮没有 Xcode、Flutter 或 React Native 真机构建证据；VoiceOver/NVDA 与完整强制颜色模式测试也不能由静态结果代替。
- Web 实现不含 Apple 官方的实时边缘折射、内容色调自适应或玻璃流体融合。
