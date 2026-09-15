# React：优先接入光学渲染器

先读 [Web 背景合同](web-implementation.md)。首次接入本包 Liquid Glass 时，可参考 [光学基准](../examples/optical-reference.html) 将需要的场景、几何与控制逻辑迁入 React；已有接入的精修或组件提取沿用当前实现，不重建已认可页面。背景与原生 DOM 控件分层，shader 不参与 React state 的每帧重渲染。

## 1. 资源与类型

复制 assets 中 optics.js、optics.css、liquid-glass.css 到项目；副作用导入 JavaScript，CSS 走项目全局入口。保留 vite/client 或 `declare module '*.css';` 声明。

```tsx
import { useEffect, useRef } from 'react';
import '../assets/liquid-glass-optics.js';
import '../assets/liquid-glass-optics.css';

type Lens = { x: number; y: number; width: number; height: number; radius?: number; refraction?: number; blur?: number; tint?: number };
type Renderer = {
  resize(width: number, height: number): void;
  render(lenses: Lens[], options?: { refraction?: boolean }): boolean;
  destroy(): void;
};
declare global {
  var LiquidGlassOptics: {
    createRenderer(canvas: HTMLCanvasElement, options: {
      source: HTMLCanvasElement;
      onStatus(status: { mode: string; reason: string }): void;
    }): Renderer;
  };
}

export function useOpticalScene(
  scene: HTMLDivElement | null,
  canvas: HTMLCanvasElement | null,
  source: HTMLCanvasElement | null,
  lenses: Lens[],
) {
  const renderer = useRef<Renderer | null>(null);
  const latest = useRef(lenses);
  useEffect(() => {
    latest.current = lenses;
    renderer.current?.render(lenses);
  }, [lenses]);
  useEffect(() => {
    if (!scene || !canvas || !source) return;
    const instance = LiquidGlassOptics.createRenderer(canvas, {
      source,
      onStatus({ mode }) { scene.dataset.renderer = mode; },
    });
    renderer.current = instance;
    const update = () => {
      instance.resize(scene.clientWidth, scene.clientHeight);
      instance.render(latest.current);
    };
    const observer = new ResizeObserver(update);
    observer.observe(scene);
    update();
    return () => {
      observer.disconnect();
      instance.destroy();
      if (renderer.current === instance) renderer.current = null;
    };
  }, [scene, canvas, source]);
  return renderer;
}
```

这是接入 Hook，需与完整基准的来源画布和语义控件一起使用。source 必须已绘制，不为 0×0；初始化在客户端完成。DOM callback ref 要把真实节点作为响应式依赖，不只依赖稳定 RefObject。SSR 时不要在 render/module 顶层创建 Canvas。

## 2. 组件合同

- 场景根 class 为 lg-optical-scene；输出 Canvas 用 lg-optical-output，且 aria-hidden=true。
- 在输出层下保留可见来源画布/图片，用作失败时的真实背景；原生 button/nav 放上层。其 lg-optical-backplate 是基础/实底降级。
- 使用 ref 保存动画几何，在实际过渡期间用 rAF 调 renderer.current.render；不要每帧 setState 整个内容页面。
- React 选中态和 aria-expanded/aria-pressed 仍由 state 管理；只把绘制几何插值交给渲染层。
- source 内容更新时调用实例 setSource；上面的最小类型可按 API 增补该方法。不能只重画源图而忘记刷新 GPU 纹理。
- 运行时媒体查询变化须停止自己的动画；CSS 不能停止 Hook 内的 rAF。
- StrictMode、节点替换、source 更换与组件卸载均需清理。不要使用全局单例 renderer 控制多个场景。

## 3. 验证与兼容

运行目标工程 TypeScript/构建，并按 [视觉验收](visual-validation.md) 在目标画布/内容上复验；原 HTML 的收据不自动覆盖 React 版本。

基础与实底降级使用光学场景里的 backplate，沿用同一套语义控件。若项目明确只需要普通毛玻璃，可按需复用基础资源；它们没有透镜折射，不能替代光学路线的验收。
