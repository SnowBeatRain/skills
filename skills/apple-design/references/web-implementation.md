# Web 光学接入

用于 Web Liquid Glass 接入或范围扩展。首次接入运行 [光学基准](../examples/optical-reference.html)，已有实现沿用当前场景；需要完整业务布局时选 [澄境案例](../examples/still/index.html)。

## 1. 来源与能力

复用 assets/liquid-glass-optics.js 和 assets/liquid-glass-optics.css；后者导入 liquid-glass.css。保留包内相对关系。Canvas 只绘制材质，按钮、文字、输入保留真实 DOM。

渲染器对受控纹理进行位移重采样，不是 Apple 渲染器。它不能自动读取任意 DOM、测量控件、提供系统级局部明暗适应或自动流体融合。图像来源必须与页面实际显示的背景相同，不得替换无关纹理冒充背景。

- source 可为已加载且可采样的 Canvas、Image、ImageBitmap 或 Video；尺寸必须有效。
- 跨域图片/视频需允许采样；图片加载前设置 crossOrigin，服务端提供正确 CORS。失败时显示真实降级。
- 背景改变或视频有新帧时更新纹理；静态来源不持续上传。显示与采样使用相同 cover/crop、缩放和坐标。
- 主要用于导航与功能层，不把正文/表格全部玻璃化。官方 Regular/Clear 选型需要时读 [材质语义](official-liquid-glass.md)，不把本 shader 的参数当原生变体。

## 2. 接口

脚本提供 globalThis.LiquidGlassOptics，可用经典 script 或 ESM 副作用导入；**没有命名 ESM exports**。模块可被 SSR 导入，实例只在客户端挂载后创建。

| API | 约束 |
|---|---|
| createRenderer(canvas, {source, maxDpr, onStatus}) | 默认 DPR 上限 1.5；状态为 webgl / fallback / destroyed |
| resize(width, height) | CSS 像素中的有效正尺寸；同步绘制缓冲 |
| setSource(source) | 上传新来源；来源恢复后可重新初始化 |
| render(lenses, {refraction, light}) | 单次绘制，不自建永久 rAF；refraction:false 用于关闭位移对照 |
| destroy() | 幂等释放 GPU 资源与上下文监听 |

onStatus 接收 {mode, reason} 对象，首次回调在 createRenderer() 返回前同步发生；使用回调参数，不读取尚未赋值的实例变量。返回实例的 renderer.status 也是同形对象。

每个 lens 为 {x,y,width,height,radius,refraction,blur,tint}，相对画布左上角，以 CSS 像素计。默认位移 15px、blur 1.2px、tint .045 是本包配方；圆角不超过短边一半。light 可提供 x/y/intensity。

**最多四个非重叠透镜。** 优先按功能组共享表面，不为每个按钮创建上下文；超限先调整分组/显示策略或明确降级，不能静默截断。同一连续来源和坐标空间共享实例；独立场景可以隔离。

## 3. 几何、全屏与动效

- 几何由真实布局测量：控件矩形减场景矩形得到相对坐标。DPR 只改变缓冲分辨率，不重复乘到布局坐标。
- 视口、滚动、文字/项目数量、字体与断点变化可能改位置；场景尺寸没变不代表控件没变。按实际定位方式更新，批量读布局后再写。
- 相关状态用同一表面的几何过渡；动画阶段更新缓存参数及 transform/opacity，收敛后停止 rAF。图片切换与菜单形变不是同一种动画。
- 全屏通常指网页视口，不自动调用 Fullscreen API。检查祖先限宽、边距、裁切、定位包含块，让背景与画布覆盖约定范围；控件宽度仍按各自用途决定。
- 短屏、安全区、键盘与浮层避让要保留操作入口。临时隐藏区域同步管理语义和焦点；有最小高度/文档滚动时验证真实边界。
- 用含轮廓、细线或真实细节的背景核验折射。纯色不易显现位移，应保留用户选择；不靠增添彩色光球弥补材质问题。
- 光学层不覆盖整块厚白/厚黑遮罩，必要时保护局部前景；内容复杂到无法兼顾时选择更适合阅读的材质。普通描边不能替代位移。
- SVG backdrop URL 滤镜若另行采用，CSS.supports 不是实际执行证据，也需同条件对照。

## 4. 降级与验证

onStatus 接入页面状态：真实创建/编译/纹理/上下文失败时保留来源与 DOM 控件，显示基础或实底底板，不继续宣称已启用折射。用 data-effects="solid" 可触发本包实底样式。系统偏好处理见 [无障碍专项](accessibility.md)，资源调度问题见 [性能专项](performance.md)。

按 [验收指南](visual-validation.md) 检查本次变化。布局精修需要几何与可读性检查，不因算法没变就跳过；未改范围不强制重跑全部基准。

框架接入只选实际所用的 [React](react-implementation.md) 或 [Vue](vue-implementation.md)；无需同时读两者。
