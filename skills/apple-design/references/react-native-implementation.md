# React Native 材质接入

仅在 React Native 任务读取。目标为原生 Liquid Glass 时，先核对锁定版本是否提供原生桥接，例如相应 Expo SDK 的 [GlassEffect](https://docs.expo.dev/versions/latest/sdk/glass-effect/)，不要凭旧示例猜 import/API。

## 基础模糊兼容

下面保留 expo-blur 示例，只是基础毛玻璃，不含透镜折射。项目已有 Expo 时可按需使用；裸 RN 可选 Community Blur，不自动混装。Android 实底是此配方的选择，不代表平台永远不支持模糊。

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

数值是示例配方，接入时映射项目主题；库的 intensity 不等于 CSS blur 或官方强度。子 Text 须设置主题文字色，View.color 不会像 CSS 一样自动继承。用实际媒体测试背景、加载失败和实底；阴影在外层、裁切在内层。

自定义触摸装饰不拦截事件，也不承担读屏语义；减少动态时停止动画，卸载清理监听/计时器。原生桥接与旧模糊方案的可用性、渲染顺序、Android 参数及辅助功能按目标版本验证。

参考：[Expo BlurView](https://docs.expo.dev/versions/latest/sdk/blur-view/)、[AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)、[Community Blur](https://github.com/Kureev/react-native-blur)。
