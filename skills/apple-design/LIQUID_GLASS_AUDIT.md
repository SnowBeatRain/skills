# Liquid Glass v2：实现与验收记录

本次修订针对旧版“规则齐全但像厚白卡片”的问题。默认继续素净灰阶，主路线改为官方材质定义、受控背景光学重采样和真实视觉验收。

## 改正的判断

- blur、白边、阴影和三档 intensity 只属于基础毛玻璃配方，不能定义 Liquid Glass。
- 官方材质以 Regular/Clear 及其语义场景区分；核心包括 lensing、连续运动、环境适应与功能层级。
- 整张文章、任务或普通内容卡片不应当作 Liquid Glass。导航/功能控件浮在内容上方，不玻璃叠玻璃。
- 删除“整个透镜必须覆盖厚白/黑遮罩”的默认要求；只在必要的前景区域做可读性处理。
- “Web 无法做到 Apple 系统级一致”不能成为交付完全没有折射的效果的理由。可控纹理的实际重采样已提供，任意 DOM 采样仍不在能力范围内。

## 可直接复用的资源

| 资源 | 用途 |
|---|---|
| [官方定义](references/official-liquid-glass.md) | 官方来源、语义材质与使用层级 |
| [光学渲染器](assets/liquid-glass-optics.js) | WebGL 纹理重采样、圆角透镜、局部边缘光学、失败与清理 |
| [光学样式](assets/liquid-glass-optics.css) | 画布/语义 DOM 分层及基础/实底降级 |
| [光学基准](examples/optical-reference.html) | A/B、拖动、方向键、导航移动、按钮展开、降级开关 |
| [视觉流程](references/visual-validation.md) | 必查用例、截图条件、哈希记录与未测说明 |
| [脚本](scripts/validate.mjs) / [回归测试](scripts/validate.test.mjs) | basic/optical 分级、依赖和证据完整性检查 |

旧 CSS/JS 与六个基础入口保留为 basic。它们的历史交互检查不构成光学证据。未把工作区外的个人工作台 Demo 作为 Skill 的光学起点。

## 当前基准的证据

2026-09-14，在 Chrome、1280×1040 视口完成基准检查。可查看 [折射开/关局部对照](references/qa/optical-comparison.png)、[开启](references/qa/optical-on.png)、[关闭](references/qa/optical-off.png)、[展开态](references/qa/expanded.png)、[移动到轮廓背景](references/qa/input-moved.png) 和 [基础降级](references/qa/fallback.png)。

同位置 A/B 在所测透镜的边缘带中，有 1913 / 9648 个像素的最大 RGB 通道差超过 4/255，平均最大通道差约 4.651/255。该数值只证明此基准对照存在局部变化；结合截图里的网格弯折判断折射，不能作为所有设计的美学评分。

按钮展开过程中观察到中间几何 `scale(0.989566, 0.979214)`，最终为 `scale(1,1)`；导航选择态也观察到起终点之间的平移。减少动态开关启用后直接进入目标几何。Escape 回焦触发器，Tab 到展开内容；方向键与鼠标拖动可改变透镜位置。

[optical.json](references/qa/optical.json) 记录截图与当前源码哈希，[observations.json](references/qa/observations.json) 保留观察到的 DOM 几何，[ab-metrics.json](references/qa/ab-metrics.json) 保留 A/B 统计。验证器核对完整性，不自动判断图像是否好看。

回归测试 8 项通过，覆盖 basic 不能通过 optical、CSS 引用、SSR 导入、无 GPU/编译失败、非法尺寸、过期证据与跨 cwd 调用。React Hook 与 Vue SFC 接入代码分别通过 TypeScript 5.9.3 和 vue-tsc 检查；这是类型证据，不是 React/Vue 版本的浏览器视觉验收。

完整 Skill 已复制到独立临时目录，并从其父目录运行验收记录检查及 8 项回归测试，均通过。归档解压后的副本又在独立 HTTP 根目录运行，Chrome 输出 webgl，引用为包内相对资源；[副本截图](references/qa/portable.png) 与 [390px 窄屏截图](references/qa/mobile.png) 已保存。窄屏没有页面横向溢出，展开控件可操作。它不依赖工作区绝对路径、外部 Demo 或宿主会话文件。

## 验证边界

- 本轮有实际 Chrome WebGL 输出和控制交互；无 Safari/Firefox、真实移动设备或原生 Xcode/Flutter/RN 编译结论。
- 窄屏检查是桌面 Chrome 的 390×1100 视口；没有把它等同于真实触摸设备或其他移动浏览器测试。
- 减少动态/透明度测试包含应用内开关；没有把它等同于完整 OS 辅助功能、强制颜色或读屏测试。
- label 的局部衬底/前景在简化极端合成下估算约 5.19:1；不是任意主题/视频的逐像素认证。
- 纹理来源是本地 Canvas，未把本例当作跨域媒体或任意 DOM 的验证。
- 本 shader 不实现自动多玻璃流体融合或系统级色调适应；移动/展开是同一透镜几何的连续近似。
- 静态检查、单位测试、视觉观察、可携带性和目标平台性能分别记录，不互相替代。
