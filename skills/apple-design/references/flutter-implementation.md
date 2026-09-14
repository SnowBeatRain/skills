# Flutter 实现

## 1. 实现边界

Flutter 的通用 BackdropFilter 方案是近似，不等于 Apple Liquid Glass。先按项目平台分支：若已有原生 iOS 26 材质桥接，优先复用；否则使用本配方并说明无边缘折射、自适应色调或流体融合。

模糊半径、CSS px 与 Flutter sigma 并非跨渲染器视觉等价，只能作为起点实测。将 `../assets/tokens.json` 转为项目 Dart 常量，下面的构造参数直接接这些 Token。代码用现代 Flutter 的 Color.withValues；旧 SDK 使用其支持的颜色 API。

## 2. 基础组件（外阴影不被裁掉）

```dart
import 'dart:ui';
import 'package:flutter/material.dart';

class LiquidGlass extends StatelessWidget {
  const LiquidGlass({
    super.key,
    required this.child,
    this.blur = 24,
    this.radius = 24,
    this.backgroundAlpha = 0.14,
    this.borderAlpha = 0.35,
    this.reduceTransparency = false,
  });

  final Widget child;
  final double blur;
  final double radius;
  final double backgroundAlpha;
  final double borderAlpha;
  // 由原生辅助功能桥接或应用内设置传入；不是 disableAnimations。
  final bool reduceTransparency;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final rounded = BorderRadius.circular(radius);
    final text = dark ? const Color(0xFFF5F5F7) : const Color(0xFF1D1D1F);
    final solid = dark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F7);
    final readable = dark
        ? const Color(0xFF121212).withValues(alpha: 0.80)
        : Colors.white.withValues(alpha: 0.56);
    final body = Container(
      decoration: BoxDecoration(
        borderRadius: rounded,
        color: reduceTransparency ? solid : Colors.white.withValues(alpha: dark ? 0.06 : backgroundAlpha),
        border: Border.all(color: Colors.white.withValues(alpha: dark ? 0.18 : borderAlpha)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: reduceTransparency ? solid : readable,
          borderRadius: rounded,
          border: Border.all(color: Colors.white.withValues(alpha: dark ? 0.28 : 0.75)),
        ),
        padding: const EdgeInsets.all(24),
        child: DefaultTextStyle.merge(style: TextStyle(color: text), child: child),
      ),
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: rounded,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: dark ? 0.50 : 0.22), blurRadius: 50, offset: const Offset(0, 20))],
      ),
      child: ClipRRect(
        borderRadius: rounded,
        child: reduceTransparency ? body : BackdropFilter(
          filter: ImageFilter.compose(
            outer: ColorFilter.matrix(const <double>[
              1.62992, -0.57216, -0.05776, 0, 0,
              -0.17008, 1.22784, -0.05776, 0, 0,
              -0.17008, -0.57216, 1.74224, 0, 0,
              0, 0, 0, 1, 0,
            ]), // Rec.709 饱和度 1.8，作用于背景滤镜，不作用于 child。
            inner: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          ),
          child: body,
        ),
      ),
    );
  }
}
```

ColorFilter 作为 ImageFilter 的组合支持、矩阵渲染在目标 Flutter 引擎上编译验证；若目标平台滤镜组合不支持，退到 blur + 半透明色，明确饱和度近似能力缺失。不要用包裹整个 child 的 ColorFiltered/ShaderMask 给文字一起调色。

示例参数为 medium。扩展 subtle/strong 时同时改变 sigma、矩阵饱和度、背景 α、边框 α；矩阵按 `lum + saturation × (identity - lum)` 生成，不能只改 blur。响应式尺寸/颜色仍由现有设计系统管理。

## 3. 高光与 ShaderMask

静态高光由顶部边框提供；可选动态装饰放在 Stack 中的 Positioned.fill + IgnorePointer，置于文字下方。ShaderMask 只蒙装饰 child，例如：

```dart
IgnorePointer(
  child: ShaderMask(
    blendMode: BlendMode.dstIn,
    shaderCallback: (bounds) => const LinearGradient(
      colors: [Colors.white, Colors.transparent],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ).createShader(bounds),
    child: ColoredBox(color: Colors.white.withValues(alpha: 0.20)),
  ),
)
```

此片段需放入有边界的圆角裁切装饰层。桌面 MouseRegion 可记录指针；触摸 Listener 仅 onPointerDown 一次定位；降低动态时保持静态，不添加持续 ticker。不要每帧重新构建整棵玻璃内容子树。

## 4. 降级与性能

`MediaQueryData.disableAnimations` 表示关闭/减弱动画，**不是降低透明度**，accessibleNavigation 也不能等同于降低透明度。不同 Flutter/平台版本的 reduceMotion 暴露方式可能不同，检查目标 SDK 的 AccessibilityFeatures；应用内明确开关/平台桥接是可用的透明度来源。

- reduceTransparency=true：组件不创建 BackdropFilter，改实底与对应文字色。
- 减少动态：关闭自定义跟随、扫光、视差，保留静态边缘；不根据这个值谎称系统降低透明度已开启。
- 低端 Android：优先无模糊实底/高不透明度方案，允许用户显式恢复。
- 同屏 BackdropFilter 目标 ≤3；禁止 ListView 每项一个；不动画化 sigmaX/sigmaY。
- 外部 DecoratedBox 绘制投影，内部 ClipRRect 只裁切模糊与装饰。

## 5. 来源与验收

- [BackdropFilter](https://api.flutter.dev/flutter/widgets/BackdropFilter-class.html)
- [ImageFilter.compose](https://api.flutter.dev/flutter/dart-ui/ImageFilter/ImageFilter.compose.html)
- [MediaQueryData.disableAnimations](https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html)（2026-09-14 核对其用途）

实际项目执行 flutter analyze、目标平台构建、真机 frame timeline；测试动态字号、读屏、键盘焦点、实底降级。仅有代码审查不得声称原生编译或性能通过。
