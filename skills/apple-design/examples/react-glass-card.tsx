'use client';

// BASIC compatibility example: frosted material and pointer highlight, no optical refraction.

import { forwardRef, useCallback, useEffect, useState, type ComponentPropsWithoutRef, type ForwardedRef } from 'react';
import '../assets/liquid-glass.css';
import '../assets/liquid-glass.js';

// 经典脚本同时支持副作用 import；声明随示例携带，不依赖缺失的 .d.ts。
declare global {
  var LiquidGlass: {
    attachLiquidGlass(element: HTMLElement): () => void;
    initLiquidGlass(root?: Document | HTMLElement): () => void;
    observeLiquidGlass(root?: Document | HTMLElement): () => void;
  };
}

type Common = {
  intensity?: 'subtle' | 'medium' | 'strong';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'pill';
  interactive?: boolean;
};
type GlassProps = Common & (
  | ({ as?: 'div' | 'section' | 'nav' | 'aside' } & ComponentPropsWithoutRef<'div'>)
  | ({ as: 'button' } & ComponentPropsWithoutRef<'button'>)
);

// DOM 节点本身是依赖；tag 切换、条件挂载和 StrictMode 重挂载均触发清理。
export function useGlassHighlight(element: HTMLElement | null, enabled = true) {
  useEffect(() => {
    if (element && enabled) return globalThis.LiquidGlass.attachLiquidGlass(element);
  }, [element, enabled]);
}

function assignRef(ref: ForwardedRef<HTMLElement>, node: HTMLElement | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

export const LiquidGlass = forwardRef<HTMLElement, GlassProps>(function LiquidGlass(props, forwardedRef) {
  const { intensity = 'medium', radius = 'md', interactive = true, className = '', children } = props;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const ref = useCallback((element: HTMLElement | null) => {
    setNode(element);
    assignRef(forwardedRef, element);
  }, [forwardedRef]);
  useGlassHighlight(node, interactive);
  const classes = `lg-surface lg-surface--${intensity} lg-radius--${radius} ${className}`;
  if (props.as === 'button') {
    const { as, intensity: _intensity, radius: _radius, interactive: _interactive, className: _class, children: _children, ...rest } = props;
    return <button {...rest} type={rest.type ?? 'button'} ref={ref} className={classes} data-lg-interactive={interactive}>
      <span className="lg-surface__content">{children}</span>
    </button>;
  }
  const { as: Tag = 'div', intensity: _intensity, radius: _radius, interactive: _interactive, className: _class, children: _children, ...rest } = props;
  return <Tag {...rest} ref={ref} className={classes} data-lg-interactive={interactive}>
    <div className="lg-surface__content">{children}</div>
  </Tag>;
});

export function GlassCardDemo() {
  const [saved, setSaved] = useState(false);
  return <main className="lg-demo lg-demo--center">
    <div>
      <LiquidGlass intensity="medium" radius="lg" className="lg-card">
        <h1>留一点空间，给此刻。</h1>
        <p>柔和的背景、清晰的文字，以及随指针轻轻浮现的高光。</p>
      </LiquidGlass>
      <LiquidGlass as="button" intensity="strong" radius="pill" className="lg-button" aria-pressed={saved} onClick={() => setSaved(!saved)}>
        {saved ? '已收藏' : '收藏此刻'}
      </LiquidGlass>
    </div>
  </main>;
}

export default GlassCardDemo;
