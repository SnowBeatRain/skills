# React 实现

## 1. 完整可复制组件

可运行源文件在 [react-glass-card.tsx](../examples/react-glass-card.tsx)，包含 `LiquidGlass`、`useGlassHighlight` 与默认演示组件，所有相对依赖都已提供。不要引用包中不存在的 `components/LiquidGlass` 或 hooks 文件。

使用已有 React + TypeScript 构建项目（如 Vite），将 assets 与 examples 按原相对位置复制到 src，再在 App 导入：

```tsx
import GlassCardDemo from './examples/react-glass-card';

export default function App() {
  return <GlassCardDemo />;
}
```

`.tsx` 不是网页，不能双击直接打开。HTML 三例可直接打开，React 示例需框架运行；不要对第四个示例作虚假承诺。若已有项目规定 CSS 只能在全局入口导入，将样式 import 移到入口，避免重复引入。

Vite 项目保留 `vite/client` 类型；其他严格 TypeScript 项目需在已纳入 tsconfig 的环境声明中提供 `declare module '*.css';`，否则 CSS 副作用 import 会报缺少类型。验证时使用项目锁定的 TypeScript/框架版本，避免临时升级工具链。

## 2. Props 与语义

| 属性 | 类型/默认 | 用途 |
|---|---|---|
| intensity | subtle / medium / strong，medium | 材质配方 |
| radius | sm / md / lg / xl / pill，md | 明确对应 CSS 圆角类 |
| interactive | boolean，true | 是否绑定高光 |
| as | div / section / nav / aside / button，div | 保留原生语义 |
| ref | HTMLElement | 转发实际 DOM，可用于 focus |

按钮使用独立的属性联合分支，允许 `type`、`disabled`、onClick；默认 type=button，内容包 span。容器包 div。不要把所有标签都断言为 HTMLDivElement，或在 button 里塞 div。

```tsx
import { LiquidGlass } from './examples/react-glass-card';

export function SaveButton() {
  return <LiquidGlass as="button" intensity="strong" radius="pill"
    className="lg-button" onClick={() => window.alert('已保存')}>
    保存
  </LiquidGlass>;
}
```

## 3. Hook 与清理

组件以 callback ref 保存真实 HTMLElement，hook 的依赖是节点和 enabled，不只是稳定的 RefObject；这样切换 as、条件挂载与 StrictMode 重挂载都会正确解绑旧节点。

```ts
import { useEffect } from 'react';

export function useGlassHighlight(element: HTMLElement | null, enabled = true) {
  useEffect(() => {
    if (element && enabled) return globalThis.LiquidGlass.attachLiquidGlass(element);
  }, [element, enabled]);
}
```

上段需与示例中的资源 import、全局类型声明一起使用。底层脚本已处理 rAF、pointerType、计时器、动态媒体查询、ResizeObserver 与引用计数；不要再复制第二套事件代码或额外 throttle。

## 4. SSR、性能与验收

- 模块顶层不访问 document/window；脚本副作用只注册接口，DOM 绑定在 useEffect 内执行。SSR 不产生监听。
- Next 等环境中，交互组件属于客户端边界；保留示例的 `'use client'`，CSS 入口遵循项目约束。
- 不为每个列表行渲染玻璃；必要的容器可 interactive=false。CSS 变量调整材质，避免动态样式库每帧产生新类名。
- 验证按钮键盘/禁用态、ref focus、interactive 切换、as 切换、StrictMode、SSR 与卸载无残留。
- 调用方函数 ref 的额外 React 19 cleanup 返回值不由此兼容封装转发；若依赖这种新用法，按目标 React 版本使用原生 ref-as-prop 实现并验证。普通 callback(null) 与 object ref 已支持。

强度、主题、降级、对比度和 Web 折射限制与 [Web 指南](web-implementation.md) 一致。
