# 官方 Liquid Glass 定义与边界

来源核对：2026-09-14。此文件是规则依据，不是 Apple 效果参数表；后续在目标 SDK/平台发生变化时重新核对官方文档。

## 1. 来源

| 来源 | 关键位置 |
|---|---|
| [Apple Design](https://developer.apple.com/design/) | 官方设计入口与资源导航 |
| [Materials / HIG](https://developer.apple.com/design/human-interface-guidelines/materials) | Liquid Glass 与标准材质的区别、使用层级、Regular/Clear |
| [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) | 1:55 lensing；3:10 视觉与运动；6:00 环境适应；12:46 使用原则；13:48 变体；18:22 辅助功能 |
| [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views) | 原生自定义控件和容器 |

## 2. 定义

官方讲解把 **lensing** 作为主要视觉识别线索：材料弯折、塑造和集中背景的光，透明控件由此能与内容分层。它不是把整个区域糊掉再画一圈白边。

视觉和运动共同设计：交互时柔性变化与光反馈、选择态移动、按钮到菜单的连续变化，让人理解是同一块材质在改变状态。不是给一个静态卡片加通用 hover 位移就完成了“液态”。

原生材质会依据环境改变局部阴影、明暗、对比度和色调；不同尺寸元素的行为也不同。不能把统一的 `.white.opacity`、固定阴影或手动深色开关等同于这些能力。

## 3. 层级

HIG 明确写道：“Don’t use Liquid Glass in the content layer.”

主要用于浮在内容之上的导航、工具、功能控件。内容层用标准材质或实底。滑块、开关等内容中的短暂交互控件可以在交互时采用 Liquid Glass；这不授权把整张文章/任务卡片变成玻璃。

避免 glass-on-glass：玻璃上方的子控件采用普通填充、透明度或 vibrancy，建立同一材质内的结构，不再加另一层完整玻璃。

## 4. Regular / Clear

| 变体 | 用途与条件 |
|---|---|
| Regular | 默认，具有背景模糊与亮度调整，适合大多数导航、功能控件及需要清晰文字的菜单/侧栏等 |
| Clear | 高透明、以富媒体背景为前提；需要明亮粗重的前景；根据背景亮度采用必要的局部/整体压暗 |

HIG 建议在 Clear 背景较亮时考虑约 35% 的暗化层；这不是所有材质的全局必填值。背景足够暗或原生播放控件已经处理压暗时，不必重复加层。

subtle / medium / strong 是本包早期 CSS 配方，**不对应官方变体**。12/24/36px、140/180/220%、固定 1px 白边都不应写成 Apple 标准，更不能拿这些数值判断视觉是否达标。

## 5. 辅助功能与近似

原生 Reduced Transparency 使材质更磨砂、遮挡更多背景；Increased Contrast 与 Reduced Motion 另有行为。Web 用实底降级是本项目的兼容策略，不是对原生效果的逐像素描述。

WebGL 可以对**自己拥有的背景纹理**做实际像素重采样，产生看得见的折射近似。浏览器不会把任意 DOM 背景直接交给本包 WebGL；普通 backdrop-filter 方案也没有本包光学渲染器的位移能力。必须区分实现范围、运行结果与 Apple 原生能力。
