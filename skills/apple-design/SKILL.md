---
name: apple-design
description: 用于 Apple 风格、HIG、Liquid Glass 界面的设计、实现、评审与组件精修。覆盖 Web 和 Apple/跨平台适配；普通玻璃拟态仅在需要 Apple 语义时使用，不用于屏幕硬件参数。
---

# Apple Design

内容优先，层级清楚，控件比例服从任务。先识别交付目标：普通 Apple 风格、标准毛玻璃，或 Liquid Glass。

## 执行边界

- 从项目确定技术栈、已有组件、主任务和目标设备；信息足够时直接推进。
- 区分已认可范围、本次变化和未测项。精修从当前实现继续；新的明确要求优先，不重建已认可部分。
- 咨询/评审只读；明确要求实现或组件提取时完成修改、调用点迁移和适用验证。
- 无品牌要求时采用克制的中性色；保留真实内容与品牌，不自动添加彩色光球、照片背景或循环动画。
- 全屏是场景范围，不代表控件全宽；普通后台不默认改成沉浸式玻璃页面。
- 原生优先系统语义组件；Web 普通 blur 不等于光学折射。不要把建议组件名写成现成 API。

## 按任务读取

先选一行的主参考；正文链接仅在对应问题出现时追加读取，不递归遍历全部引用。已有项目的小修改无需先读完整设计系统。资料足以完成当前判断后，转向实际项目。

| 当前任务 | 主参考 |
|---|---|
| 普通网页设计或实现 | [网页指南](references/web-adaptation.md) |
| 按钮比例、动态选择、公共组件分析/提取 | [组件指南](references/component-patterns.md) |
| 定义颜色、字体、间距或通用视觉规范 | [设计基础](references/design-system.md) |
| Liquid Glass 概念、Regular/Clear 选型 | [材质语义](references/official-liquid-glass.md) |
| Web 光学接入、全屏扩展 | [Web 光学](references/web-implementation.md) |
| Apple 原生或跨平台材质 | [平台路由](references/platform-matrix.md)，再选目标平台 |
| 查看/复用完整案例 | [案例入口](references/examples.md) |
| 用户需要可复用提示词 | [提示词模板](references/task-prompts.md) |

无障碍专项读 [accessibility.md](references/accessibility.md)，性能专项读 [performance.md](references/performance.md)。普通任务不主动加载其他平台代码、提示词或历史审计。

## 选择代码起点

- 普通网页按需并入 [CSS 模板](assets/apple-web-template.css)，已有组件库优先。
- 首次接入本包光学，运行 [光学基准](examples/optical-reference.html)；已有接入直接增量修改。
- 完整业务组合看 [澄境全屏版](examples/still/index.html)，[局部版](examples/still/contained.html)用于对比范围；[CSS/SVG 演示](examples/glass-gallery/index.html)用于看组件与材质配方，不是光学基准。案例不是公共组件库。
- 历史验收位于 archive/ 和 references/qa/，仅追溯证据时读取；案例是否完成视觉复核以其记录为准。

## 验证与交付

按实际变更选择 [验收指南](references/visual-validation.md) 的相关检查，不把光学全量用例套到普通样式调整。

提供实际结果、必要的运行入口和未测项。静态、构建、交互、视觉与真机证据不能互相替代；用户满意也不代表所有状态已验收。浏览器自动化受阻不等于页面 GPU 不可用，不能据此改变材质能力结论。
