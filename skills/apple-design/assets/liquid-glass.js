/*!
 * liquid-glass.js v1.0.0
 * BASIC: standard frosted highlight only; no lensing/refraction.
 * 经典脚本：<script src="liquid-glass.js" data-lg-auto="true" defer></script>
 * ESM：import './liquid-glass.js'; globalThis.LiquidGlass.initLiquidGlass(root)
 * 无命名 ESM export，保证 file:// 示例可直接打开。框架中默认不自动扫描。
 */
(function (global) {
  'use strict';
  const bindings = new WeakMap();
  const selector = '.lg-surface';

  function attachLiquidGlass(el) {
    if (!el?.ownerDocument?.defaultView) return () => {};
    let binding = bindings.get(el);
    if (!binding) {
      const win = el.ownerDocument.defaultView;
      const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
      const transparency = win.matchMedia('(prefers-reduced-transparency: reduce)');
      const coarse = win.matchMedia('(pointer: coarse), (max-width: 768px)');
      const forced = win.matchMedia('(forced-colors: active)');
      const listeners = [];
      let raf = 0;
      let timer = 0;
      let rect = null;
      let point = null;
      const blocked = () => motion.matches || transparency.matches || forced.matches || el.closest('.lg-opaque') || el.matches(':disabled') || el.dataset.lgInteractive === 'false';
      const tracking = () => !blocked() && !coarse.matches && !el.closest('.lg-reduced');
      const listen = (target, type, fn, options) => {
        target.addEventListener(type, fn, options);
        listeners.push(() => target.removeEventListener(type, fn, options));
      };
      const reset = () => {
        if (raf) win.cancelAnimationFrame(raf);
        if (timer) win.clearTimeout(timer);
        raf = timer = 0;
        point = rect = null;
        el.classList.remove('is-active');
        el.style.removeProperty('--lg-mx');
        el.style.removeProperty('--lg-my');
      };
      const flush = () => {
        raf = 0;
        if (blocked() || !point) return;
        // 读取在写入前；位置只影响渐变绘制，不写 width/top/left 等布局属性。
        rect ||= el.getBoundingClientRect();
        el.style.setProperty('--lg-mx', `${point.x - rect.left}px`);
        el.style.setProperty('--lg-my', `${point.y - rect.top}px`);
      };
      const queue = (e) => {
        point = { x: e.clientX, y: e.clientY };
        if (!raf) raf = win.requestAnimationFrame(flush);
      };
      const onEnter = (e) => {
        if (e.pointerType === 'touch' || !tracking()) return;
        rect = null;
        el.classList.add('is-active');
        queue(e);
      };
      const onMove = (e) => {
        if (e.pointerType !== 'touch' && tracking()) {
          el.classList.add('is-active');
          queue(e);
        }
      };
      const onDown = (e) => {
        if (blocked()) return;
        if (e.pointerType !== 'touch' && tracking()) return;
        reset();
        queue(e);
        el.classList.add('is-active');
        const duration = Number.parseFloat(win.getComputedStyle(el).getPropertyValue('--lg-motion-touch-ms'));
        timer = win.setTimeout(reset, Number.isFinite(duration) ? duration : 600);
      };
      const invalidate = () => { rect = null; };
      listen(el, 'pointerenter', onEnter, { passive: true });
      listen(el, 'pointermove', onMove, { passive: true });
      listen(el, 'pointerdown', onDown, { passive: true });
      listen(el, 'pointerleave', reset, { passive: true });
      listen(el, 'pointercancel', reset, { passive: true });
      listen(win, 'scroll', invalidate, { passive: true, capture: true });
      listen(win, 'resize', invalidate, { passive: true });
      listen(win, 'blur', reset);
      for (const query of [motion, transparency, coarse, forced]) listen(query, 'change', reset);
      const resize = win.ResizeObserver ? new win.ResizeObserver(invalidate) : null;
      resize?.observe(el);
      el.classList.add('lg-bound');
      binding = { owners: 0, destroy() {
        reset();
        listeners.forEach((off) => off());
        resize?.disconnect();
        el.classList.remove('lg-bound');
        bindings.delete(el);
      } };
      bindings.set(el, binding);
    }
    binding.owners++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--binding.owners === 0) binding.destroy();
    };
  }

  function surfaces(root) {
    const elements = Array.from(root?.querySelectorAll?.(selector) || []);
    if (root?.matches?.(selector)) elements.unshift(root);
    return elements;
  }

  function initLiquidGlass(root = global.document) {
    const cleanups = surfaces(root).map(attachLiquidGlass);
    return () => cleanups.forEach((cleanup) => cleanup());
  }

  function observeLiquidGlass(root = global.document) {
    if (!root) return () => {};
    const doc = root.nodeType === 9 ? root : root.ownerDocument;
    if (!doc?.defaultView) return () => {};
    const owned = new Map();
    const sync = () => {
      const current = new Set(surfaces(root));
      for (const [el, cleanup] of owned) {
        if (!current.has(el)) { cleanup(); owned.delete(el); }
      }
      for (const el of current) {
        if (!owned.has(el)) owned.set(el, attachLiquidGlass(el));
      }
    };
    sync();
    const observer = new doc.defaultView.MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      owned.forEach((cleanup) => cleanup());
      owned.clear();
    };
  }

  global.LiquidGlass = { attachLiquidGlass, initLiquidGlass, observeLiquidGlass };
  if (global.document?.currentScript?.dataset.lgAuto === 'true') {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', () => initLiquidGlass(), { once: true });
    } else initLiquidGlass();
  }
})(globalThis);
