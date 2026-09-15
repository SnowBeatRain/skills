# 平台选择

只有原生/跨平台任务或比较平台时读取。先核对目标 OS、SDK、锁定依赖和具体 API availability；不把“26+”套到所有系统。原生优先系统组件，普通 BlurView/BackdropFilter 不等于原生 Liquid Glass。

## 1. Apple 平台差异

| 平台 | 要点 |
|---|---|
| iOS / iPadOS | 导航/工具功能层采用系统玻璃；内容层可用标准材质。Glass.regular 与 Material.regular 不同 |
| macOS | 尊重窗口、工具栏、侧栏与用户强调色。NSVisualEffectView 的 behindWindow/withinWindow 属标准材质融合模式，不是新增玻璃变体 |
| tvOS | 部分控件聚焦时采用玻璃；遥控器焦点与阅读距离优先，Web hover 不能代替焦点 |
| visionOS | 窗口通常使用不可修改的系统 glass，自适应环境亮度，没有独立 Dark Mode；优先半透明，不能把“内容层不用 Liquid Glass”套为禁止系统窗口 glass |
| watchOS | 保留模态 sheet 默认材质与系统工具栏惯例，不照搬桌面尺寸和多层面板 |

标准材质的标签也按语义选择：iOS/iPadOS 的 quaternary 在 thin/ultraThin 上通常对比不足；visionOS 的 tertiary 不用于需要高可读性的内容。

## 2. 只读目标平台的接入资料

- SwiftUI/UIKit： [swiftui-implementation.md](swiftui-implementation.md)。
- Flutter： [flutter-implementation.md](flutter-implementation.md)。
- React Native： [react-native-implementation.md](react-native-implementation.md)。
- 只是核对 Regular/Clear、颜色或辅助功能外观时： [材质语义](official-liquid-glass.md)。

旧系统使用标准材质或实底兼容，并明确能力级别；跨平台库可能支持原生桥接，须查目标版本，不能凭旧模糊示例断言永远不支持。

来源为 2026-09-15 核对的 [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials#Platform-considerations) 与 [Color](https://developer.apple.com/design/human-interface-guidelines/color)。文档核对不等于目标平台编译/真机测试。
