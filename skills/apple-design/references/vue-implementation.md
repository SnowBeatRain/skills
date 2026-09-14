# Vue 实现

Vue 3，Composition API + `<script setup lang="ts">`。组件只负责语义与样式，指令负责节点生命周期，底层 JS 负责高光。保留项目目录模式；以下相对路径以 src/assets、src/directives、src/components 为例。

## 1. 指令

把包内两个 CSS/JS 资源复制到 src/assets。经典脚本可以副作用 import；不是命名 export。

保留项目的 `vite/client` 或等效 CSS 模块声明（`declare module '*.css';`），vue-tsc 与 TypeScript 版本须兼容，使用项目 lockfile。

```ts
// src/directives/glassHighlight.ts
import type { ObjectDirective } from 'vue';
import '../assets/liquid-glass.js';

declare global {
  var LiquidGlass: {
    attachLiquidGlass(element: HTMLElement): () => void;
    initLiquidGlass(root?: Document | HTMLElement): () => void;
    observeLiquidGlass(root?: Document | HTMLElement): () => void;
  };
}

const cleanups = new WeakMap<HTMLElement, () => void>();

export const vGlassHighlight: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    if (binding.value !== false) cleanups.set(el, globalThis.LiquidGlass.attachLiquidGlass(el));
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return;
    cleanups.get(el)?.();
    cleanups.delete(el);
    if (binding.value !== false) cleanups.set(el, globalThis.LiquidGlass.attachLiquidGlass(el));
  },
  beforeUnmount(el) {
    cleanups.get(el)?.();
    cleanups.delete(el);
  },
};
```

底层 cleanup 会清除 rAF、touch timeout、活动类、CSS 坐标、事件与观察器。不要只在 mounted 检查一次 boolean：响应式 interactive 变化必须在 updated 生效。系统偏好 change 由共享 JS 监听；无需重建指令。

## 2. SFC

```vue
<!-- src/components/LiquidGlass.vue -->
<script setup lang="ts">
import { vGlassHighlight } from '../directives/glassHighlight';
import '../assets/liquid-glass.css';

withDefaults(defineProps<{
  intensity?: 'subtle' | 'medium' | 'strong';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'pill';
  interactive?: boolean;
  tag?: 'div' | 'section' | 'nav' | 'aside' | 'button';
}>(), { intensity: 'medium', radius: 'md', interactive: true, tag: 'div' });
</script>

<template>
  <component
    :is="tag"
    v-glass-highlight="interactive"
    :type="tag === 'button' ? 'button' : undefined"
    :data-lg-interactive="interactive"
    class="lg-surface"
    :class="[`lg-surface--${intensity}`, `lg-radius--${radius}`]"
  >
    <component :is="tag === 'button' ? 'span' : 'div'" class="lg-surface__content">
      <slot />
    </component>
  </component>
</template>
```

单一 DOM 根自动透传 class、aria-*、disabled 和监听；不要重复手工绑定 `$attrs`。button 只放短文案/图标，不嵌套交互元素。动态 tag 替换时 Vue 卸载旧节点并挂载新节点，指令同步清理。

## 3. 使用

```vue
<script setup lang="ts">
import { ref } from 'vue';
import LiquidGlass from './components/LiquidGlass.vue';
const saved = ref(false);
</script>

<template>
  <main class="lg-demo lg-demo--center">
    <div>
      <LiquidGlass intensity="medium" radius="lg" class="lg-card">
        <h1>液态玻璃卡片</h1>
        <p>背景模糊、边缘高光与清晰内容。</p>
      </LiquidGlass>
      <LiquidGlass tag="button" intensity="strong" radius="pill" class="lg-button"
        :aria-pressed="saved" @click="saved = !saved">
        {{ saved ? '已收藏' : '收藏此刻' }}
      </LiquidGlass>
    </div>
  </main>
</template>
```

指令 DOM 钩子在服务端不执行；脚本导入也不扫描 document，适用于 SSR。Nuxt 等场景按框架现有全局 CSS 配置引入样式。长列表不逐项加玻璃，interactive=false 仅关闭高光，不会减少 backdrop-filter 数量。

## 4. 验证

运行项目的 vue-tsc/构建；检查 true → false → true、tag 替换、卸载、SSR 无 window 错误、触摸无持续 pointermove 高光。媒体降级与视觉限制见 [Web](web-implementation.md)，对比度与辅助技术见 [无障碍](accessibility.md)。
