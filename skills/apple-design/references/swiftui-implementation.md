# SwiftUI / UIKit 实现

## 1. 原生优先与 SDK

iOS / macOS 26+、相应 SDK 支持时优先官方 Liquid Glass；不要把 Material 手绘冒充官方材质。系统负责真实材质渲染、背景适应与容器融合，Web Tokens 只映射布局尺度，不用于覆盖系统模糊内部参数。

以下 SwiftUI 示例面向 iOS 15+ / macOS 12+，使用包含 26 API 的 SDK 构建。`#available` 是运行时判断，**不能让旧 SDK 编译它不认识的符号**；旧 SDK 项目只采用兼容分支，或升级工具链后再接原生 API。

## 2. iOS 26+ 官方用法

```swift
import SwiftUI

@available(iOS 26.0, macOS 26.0, *)
struct GlassCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("标题").font(.headline)
            Text("内容").font(.subheadline).foregroundStyle(.secondary)
        }
        .padding(24)
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

@available(iOS 26.0, macOS 26.0, *)
struct GlassActions: View {
    var body: some View {
        GlassEffectContainer(spacing: 20) {
            HStack(spacing: 20) {
                Button("操作 A") { }.buttonStyle(.glass)
                Button("操作 B") { }.buttonStyle(.glass)
            }
        }
    }
}
```

真正融合/变形还取决于几何距离、视图标识和动画事务；容器不是一加上就自动产生所有流体动画。标准控件优先系统 buttonStyle；定制控件的交互配置以当前 SDK 的 Glass API 为准。

## 3. 旧版与统一封装

iOS 18 及以下的常用兼容范围可用 `.ultraThinMaterial`；本组件最低 iOS 15 / macOS 12，更早系统需纯色或 UIKit 兼容。不要把 .white.opacity(.2) 单独称作玻璃实现。

```swift
import SwiftUI

struct AdaptiveGlass<Content: View>: View {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorScheme) private var colorScheme
    let cornerRadius: CGFloat
    let content: Content

    init(cornerRadius: CGFloat = 24, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.content = content()
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    }

    var body: some View {
        if reduceTransparency {
            content.background(colorScheme == .dark ? Color.black : Color.white, in: shape)
        } else if #available(iOS 26.0, macOS 26.0, *) {
            content.glassEffect(.regular, in: shape)
        } else {
            content.background {
                shape.fill(.ultraThinMaterial)
                    .overlay {
                        shape.strokeBorder(
                            LinearGradient(colors: [.white.opacity(0.7), .white.opacity(0.1)],
                                           startPoint: .top, endPoint: .bottom),
                            lineWidth: 1)
                    }
                    .shadow(color: .black.opacity(0.22), radius: 25, y: 20)
            }
        }
    }
}

struct CompatGlassCard: View {
    var body: some View {
        AdaptiveGlass {
            VStack(alignment: .leading, spacing: 12) {
                Text("标题").font(.headline)
                Text("内容").font(.subheadline)
            }
            .padding(24)
            .foregroundStyle(.primary)
        }
    }
}
```

布局示例 12/24/25/20 是配方映射：实际项目从共享 Token 生成 Swift 常量或并入现有设计系统。不要动态把 JSON 值当作官方原生材质参数。

## 4. 无障碍

系统材质会适配系统辅助功能，但自定义动画、布局与颜色仍由应用负责，不能声称调用 glassEffect 后无需测试。

```swift
@Environment(\.accessibilityReduceTransparency) private var reduceTransparency
@Environment(\.accessibilityReduceMotion) private var reduceMotion
```

兼容分支在减少透明度时走实底；自定义 sweep/parallax/弹性过渡在 reduceMotion 时关闭，使用静态状态或无位移动画。保留 Dynamic Type、VoiceOver 标签、语义文字色与 ≥44pt 命中区域。

## 5. UIKit

在 iOS 26 SDK，`UIGlassEffect` 可传给 `UIVisualEffectView`；旧版改 UIBlurEffect。

```swift
import UIKit

func makeGlassView() -> UIVisualEffectView {
    if #available(iOS 26.0, *) {
        return UIVisualEffectView(effect: UIGlassEffect(style: .regular))
    }
    return UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterial))
}
```

内容放 effectView.contentView，通过 Auto Layout 约束。兼容自绘圆角/高光时，将投影放外层、裁切放内层，不在同一 clipsToBounds 层绘制外阴影。读取 `UIAccessibility.isReduceTransparencyEnabled` / `isReduceMotionEnabled`，并监听对应状态变化通知；兼容分支将 effect=nil、使用 systemBackground 和 label 语义色。不要对每个列表行加独立玻璃。

## 6. 官方链接与验证边界

2026-09-14 核对官方文档中的 `glassEffect(_:in:)`、`GlassEffectContainer`、`UIGlassEffect` 声明。最低版本和参数仍以目标 SDK 为准。

- [glassEffect(_:in:)](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:))
- [GlassEffectContainer](https://developer.apple.com/documentation/swiftui/glasseffectcontainer)
- [UIGlassEffect](https://developer.apple.com/documentation/uikit/uiglasseffect)
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)

文档核对不等于 Xcode 编译/真机测试。交付原生代码时明确实际执行了哪种验证，不提供未经测量的帧率承诺。
