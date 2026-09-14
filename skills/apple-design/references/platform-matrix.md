# 跨平台能力与 React Native

Liquid Glass 的定义与层级先看 [官方参考](official-liquid-glass.md)。Web 的首选路径现为受控背景 WebGL 重采样；本页旧 BlurView/BackdropFilter 代码仅是 standard/basic 降级。

## 1. 能力矩阵

| 能力 | iOS/macOS 26 系统材质 | Web 本配方 | Flutter 通用近似 | React Native 通用 BlurView |
|---|---|---|---|---|
| 背景模糊 | 系统 | 受控纹理采样；basic 用 CSS | BackdropFilter | 依库/平台 |
| 饱和提升 | 系统 | 按采样管线处理；basic 用 saturate | 背景 ColorFilter 组合，需引擎验证 | 依库，有限 |
| 边缘位移折射 | 系统 | optics.js 对同一受控纹理重采样；basic 无 | 普通模糊无，需原生/自绘 | 普通 BlurView 无；原生桥接另议 |
| 内容自适应色调 | 系统 | 手动语义色/遮罩 | 手动 | 手动 |
| 玻璃流体融合 | GlassEffectContainer 等 | 无 | 需自绘/桥接 | 需原生桥接 |
| 弹性形变 | 原生交互/动画 | 示例的连续透镜几何；非自动流体融合 | 需原生/自定义 | 需原生/自定义 |
| 指针/触摸高光 | 系统交互 | 本地脚本 | 自绘装饰 | 自绘或原生 |
| 降级偏好 | 系统材质 + 自定义内容仍需检查 | 媒体查询 + 应用开关 | 按目标 SDK/桥接/开关 | AccessibilityInfo + 应用开关 |

“Flutter/React Native 无”仅针对此处普通模糊实现，不代表所有未来库或桥接都不可能使用原生 API。版本、Expo SDK 和操作系统能力以项目锁定版本为准。

## 2. React Native 方案

项目已使用 Expo 时可选 expo-blur；裸 RN 可选 @react-native-community/blur，遵循其安装/原生依赖流程，不自动混装两套。先核对对应版本的 Android 支持、降级参数与 BlurView 渲染顺序。

以上两个包是**基础模糊路线**。如果目标是 iOS 26 Liquid Glass，先检查目标框架版本是否提供原生玻璃模块及其可用性检查（例如对应 Expo SDK 的 [GlassEffect 文档](https://docs.expo.dev/versions/latest/sdk/glass-effect/)）；必须按项目锁定版本核对，不能凭本页推测 import/API 或把普通 BlurView 当作官方材质。

下面以 expo-blur 为例，阴影在外层、裁切在内层。示例默认 Android 实底，以可预测性能为先；该默认是配方策略，不是断言 Android 永远不支持模糊。

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassCard({ children, opaque = false }: { children: ReactNode; opaque?: boolean }) {
  const dark = useColorScheme() === 'dark';
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (value) => {
      changed = true;
      if (active) setReduced(value);
    });
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active && !changed) setReduced(value);
    }).catch(() => { if (active) setReduced(true); });
    return () => { active = false; subscription.remove(); };
  }, []);
  const solid = dark ? '#1c1c1e' : '#f5f5f7';
  const fallback = opaque || reduced || Platform.OS !== 'ios';
  return <View style={styles.shadow}>
    <View style={styles.clip}>
      {!fallback && <BlurView intensity={60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      <View style={[styles.content, { backgroundColor: fallback ? solid : dark ? 'rgba(18,18,18,.80)' : 'rgba(255,255,255,.56)' }]}>
        {children}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 12 },
  clip: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)' },
  content: { padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.75)' },
});
```

示例中的数值是 `../assets/tokens.json` 的布局/颜色映射；实际项目从 JSON 或现有主题常量读，不散落硬编码。BlurView intensity=60 是库的专有尺度，不等于 Web blur=24px，也不是官方 Liquid Glass 强度。

子元素 Text 必须显式使用主题文字色（浅 #1d1d1f / 深 #f5f5f7），React Native 不像 CSS 自动继承 View.color。加上非纯色的 ImageBackground 或项目已有渐变，并验证加载失败时的实底。若引入触摸高光，装饰 pointerEvents="none"、accessibilityElementsHidden，监听 reduceMotionChanged 并在卸载清理动画/计时器；单次定位，不持续追踪手指。

## 3. 平台选择

| 场景 | 首选 |
|---|---|
| Apple 原生 26+ 且 SDK 可用 | glassEffect / UIGlassEffect |
| 旧版 SwiftUI | ultraThinMaterial + 明确高光/实底兼容 |
| Web 桌面 | 受控纹理光学模板 + 视觉验收 |
| Web 移动 | 同样明确背景合同，按实测降 DPR/采样；关闭光学时明确标 basic |
| 跨平台且 iOS 优先 | 已有原生玻璃桥接优先；否则 BlurView 近似 |
| Android 优先 | 按最低设备实测选实底或轻模糊 |
| 极低性能或用户减少透明度 | 不透明卡片 |

```text
用户需要玻璃材质
├─ Apple 原生 + 26 SDK/运行系统 → 官方 API
├─ Apple 原生旧版本 → Material / UIBlurEffect + 实底兼容
├─ Web 可控背景 → WebGL 重采样 + 连续几何 + DOM 控件
├─ Web 任意 DOM → 先解决来源合同；无法解决则明确 basic 降级
└─ 跨平台 → 核对原生桥接或库能力
   ├─ 能使用官方材质 → 平台分支
   └─ 普通 BlurView / BackdropFilter → 明确近似 + 性能/无障碍降级
```

## 4. 官方/库参考

- [Expo BlurView](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
- [Community Blur](https://github.com/Kureev/react-native-blur)

库参数经常随版本变化；使用前读取目标版本文档和项目 lockfile。Web、Flutter、RN 通用模糊方案均不能承诺 Apple 官方实时折射。来源核对不替代构建和真机测试。
