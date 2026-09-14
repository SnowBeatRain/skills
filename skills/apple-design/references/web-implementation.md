# Web：可复用光学路径与兼容路径

## 1. 选择起点

明确要求 Liquid Glass 时从 [optical-reference.html](../examples/optical-reference.html) 开始。它展示同背景折射开/关、拖动透镜、导航选中态连续移动、按钮展开为面板，以及基础/实底/减少动态模式。

复制该 HTML 及 `../assets/liquid-glass-optics.js`、`../assets/liquid-glass-optics.css`、`../assets/liquid-glass.css`，保留相对关系即可运行；本地 Canvas 背景无需联网或 CORS。`tokens.json` 与本包校验资源应随 Skill 一起保留。

正式案例仅保留这一份光学基准，基础与实底降级也在其中验证。共享 CSS/JS 仍提供 Tokens 和按需兼容能力，不另提供不含折射的展示案例作为起点。

## 2. 背景合同（不可省略）

渲染器接受已加载的 Canvas、Image、ImageBitmap 或 Video 纹理。它按 cover 方式绘制这个来源，并在透镜边缘重采样**同一份像素**。

- 网页/图片由应用拥有且允许采样：可使用此渲染器。
- 图片/视频跨域：服务端必须提供正确 CORS，图片在加载前设置 crossOrigin；上传失败会明确退到 fallback。不要替换无关图片假装继续透出真实内容。
- 背景是任意 DOM：本渲染器不能捕捉它。先决定是否将所需背景渲染为可控画布/媒体，保持交互与文字的语义 DOM；无法接受该合同则说明限制。
- 图片已变化、视频已有新帧或受控内容重绘：调用 setSource 更新纹理，按实际变化安排渲染；静止时不循环上传。
- 源图和页面显示内容须一致；位置、cover 裁切、缩放、DPR 均需对照检查。复制纹理错位不是折射。

## 3. 最小接入

```html
<link rel="stylesheet" href="assets/liquid-glass-optics.css">
<div id="scene" class="lg-optical-scene" style="height: 400px">
  <canvas id="source" aria-hidden="true"></canvas>
  <canvas id="optics" class="lg-optical-output" aria-hidden="true"></canvas>
  <button class="lg-optical-control" type="button"
    style="left: 24px; top: 24px; width: 180px; height: 60px; border-radius: 30px">
    <span class="lg-optical-backplate" aria-hidden="true"></span>
    <span class="lg-optical-label">打开工具</span>
  </button>
</div>
<script src="assets/liquid-glass-optics.js"></script>
```

下面的 JavaScript 需与上面 HTML 一起使用。产品按钮应接实际动作；完整交互参考示例。

```js
const scene = document.querySelector('#scene');
const source = document.querySelector('#source');
const canvas = document.querySelector('#optics');
source.width = 800;
source.height = 400;
const ctx = source.getContext('2d');
const theme = getComputedStyle(document.documentElement);
ctx.fillStyle = theme.getPropertyValue('--lg-optics-scene');
ctx.fillRect(0, 0, 800, 400);
ctx.strokeStyle = theme.getPropertyValue('--lg-optics-contour');
for (let x = 0; x < 800; x += 32) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
}
const renderer = LiquidGlassOptics.createRenderer(canvas, {
  source,
  onStatus({ mode, reason }) {
    scene.dataset.renderer = mode;
    // 产品中展示所选能力级别；reason 留给诊断，不声称 fallback 有折射。
  },
});
const lenses = [{ x: 24, y: 24, width: 180, height: 60, radius: 30 }];
const observer = new ResizeObserver(() => {
  renderer.resize(scene.clientWidth, scene.clientHeight);
  renderer.render(lenses);
});
observer.observe(scene);
// 组件卸载时：observer.disconnect(); renderer.destroy();
```

脚本支持经典 script 与 ESM 副作用 import，接口在 `globalThis.LiquidGlassOptics`；没有命名 ESM exports。模块顶层无 document/window 访问，可在 SSR 工程导入，实际创建实例放在客户端挂载阶段。

## 4. 接口

| 接口 | 合同 |
|---|---|
| createRenderer(canvas, { source, maxDpr, onStatus }) | 创建隔离实例，默认 DPR 上限 1.5。status.mode 为 webgl / fallback / destroyed |
| resize(width, height) | CSS 像素尺寸，布局变化时调用；会更新绘制缓冲 |
| render(lenses, { refraction, light }) | 一次渲染；不创建永久 rAF。最多 4 个不重叠透镜，目标 ≤3 |
| setSource(source) | 上传新纹理并重绘；可在来源恢复后重试初始化 |
| destroy() | 幂等清理 GL 资源与上下文监听；调用方还须清理自身事件/计时器/观察器 |

每个透镜：`{x,y,width,height,radius,refraction,blur,tint}`，x/y 是相对画布左上角的 CSS 坐标。默认 refraction=15px、blur=1.2px、tint=.045 是可观察的近似配方；radius 限制在短边一半内。DOM 控件必须与其几何对齐。

这不是自动采样 DOM、自动测量控件、原生 Regular/Clear 引擎或自动玻璃融合库。不要省略这些范围说明。

## 5. 连续变化与输入

参考示例用可收敛弹簧插值参数，选中态在同一纹理上移动，按钮展开成更大面板。不要在动画中替换静态背景截图。

DOM 交互使用原生按钮、aria-expanded、inert/hidden。指针拖动用 pointer capture；pointerup/cancel/lostcapture 均释放；方向键提供移动替代。弹性只是非必要反馈，reduce-motion 时直接应用最终几何。

用 ResizeObserver 更新缓存坐标与纹理尺寸。不要在每个 pointermove 中交替读布局和写文档流尺寸；渲染器本身不逐帧读取 DOM 矩形。

## 6. 降级

`onStatus` 必须接入：WebGL 创建、着色器编译、纹理上传或上下文异常会返回 fallback。CSS 支持声明通过不代表 GPU 光学路径可用。背景源仍可见、真实 DOM 控件仍可操作；状态须明确为基础毛玻璃。

`prefers-reduced-transparency` 与 forced-colors 隐藏光学画布，显示实底控件；应用内可用 `data-effects="solid"` 做同样处理。减少动态的 JS 条件必须同步停止弹簧/光反馈，CSS 媒体查询不能暂停 WebGL 动画。

基础资源仍提供 `@supports not`、减少透明度/动态和强制颜色规则；它们证明的是降级覆盖，不是光学完成。

## 7. 验收

按 [visual-validation.md](visual-validation.md) 做折射 A/B、透光、形变、输入与降级检查。`--profile optical` 静态退出 0 之后仍会要求视觉验收；只有匹配当前代码版本的记录才能通过 evidence 检查。

官方材质定义与能力区别见 [official-liquid-glass.md](official-liquid-glass.md)。不要将 Web shader 的圆角距离场与像素重采样描述为 Apple 官方光学算法。
