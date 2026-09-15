# Vue：光学场景与语义组件

使用 Vue 3 Composition API + `<script setup lang="ts">`。先读 [Web 背景合同](web-implementation.md)；首次接入本包时从 [光学基准](../examples/optical-reference.html) 按需迁移场景与控件，保持 shader 为独立渲染层。已有接入的精修或组件提取沿用当前实现，不重建已认可页面。

## 1. 接入生命周期

复制 optics.js、optics.css、liquid-glass.css，保留项目 CSS 类型声明。下面是一个接入轮廓：source 为已绘制、尺寸有效的本地 Canvas，来源画布仍需由调用方显示在输出画布下方，作为 fallback。

```vue
<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from 'vue';
import '../assets/liquid-glass-optics.js';
import '../assets/liquid-glass-optics.css';

type Lens = { x: number; y: number; width: number; height: number; radius?: number };
type Renderer = {
  resize(width: number, height: number): void;
  render(lenses: Lens[]): boolean;
  destroy(): void;
};
const props = defineProps<{ source: HTMLCanvasElement | null; lenses: Lens[] }>();
const scene = shallowRef<HTMLDivElement | null>(null);
const canvas = shallowRef<HTMLCanvasElement | null>(null);
let renderer: Renderer | null = null;
let observer: ResizeObserver | null = null;

const optics = (globalThis as typeof globalThis & {
  LiquidGlassOptics: { createRenderer(canvas: HTMLCanvasElement, options: {
    source: HTMLCanvasElement; onStatus(status: { mode: string }): void;
  }): Renderer };
}).LiquidGlassOptics;

watch([scene, canvas, () => props.source], ([root, output, source]) => {
  observer?.disconnect(); renderer?.destroy(); renderer = null;
  if (!root || !output || !source) return;
  const instance = optics.createRenderer(output, {
    source,
    onStatus({ mode }) { root.dataset.renderer = mode; },
  });
  renderer = instance;
  const draw = () => {
    instance.resize(root.clientWidth, root.clientHeight);
    instance.render(props.lenses);
  };
  observer = new ResizeObserver(draw);
  observer.observe(root);
  draw();
}, { flush: 'post' });
watch(() => props.lenses, (lenses) => renderer?.render(lenses), { flush: 'post' });
onBeforeUnmount(() => { observer?.disconnect(); renderer?.destroy(); });
</script>

<template>
  <div ref="scene" class="lg-optical-scene" style="height: 400px">
    <slot name="background" />
    <canvas ref="canvas" class="lg-optical-output" aria-hidden="true" />
    <slot />
  </div>
</template>
```

这不是完整业务页面；geometry、真实 button/nav、背景绘制和动作沿用完整基准。slot 内控件使用 lg-optical-control、lg-optical-backplate，位置与 lenses 的 CSS 像素坐标一致。source 用 shallowRef/markRaw 保存，不要深层代理宿主对象。

## 2. 交互与更新

- 替换 lenses 数组触发一次 render；连续动画用组件内部 rAF/ref 驱动参数，不对整棵视图逐帧做响应式更新。
- 背景内容更新后需要实例 setSource；source 对象不变不代表其像素没有变化。
- 监听运行时减少动态/透明度设置；卸载时还要取消组件自己的 rAF、pointer capture、媒体查询事件。
- 选中/展开状态用 props/emits 或组件本地 state 维护，动画层不成为另一套业务状态来源。
- SSR 不创建 Canvas；节点挂载和来源加载后再初始化。Nuxt 的全局 CSS/客户端边界遵循现有工程。

## 3. v-glass-highlight 的位置

原 `v-glass-highlight` 只管理普通毛玻璃的径向亮斑，不产生折射。如果项目明确使用 basic 模式，可以继续在 mounted/updated/beforeUnmount 调用 `LiquidGlass.attachLiquidGlass` 和 cleanup。不要把该指令当成 Liquid Glass 光学实现。

运行 vue-tsc/构建，再按 [视觉验收](visual-validation.md) 验证 source 替换、布局变化、卸载与实际光学输出。不要只检查指令执行次数。
