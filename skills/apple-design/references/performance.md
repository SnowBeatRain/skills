# Liquid Glass 性能指南

## 1. 项目预算（不是平台保证）

| 指标 | 目标 | 复查阈值 |
|---|---|---|
| 同屏玻璃元素数 | ≤3 | 5 |
| 嵌套 | 1 层 | 3 层 |
| 单元素 blur | 24px | 40px |
| 高光帧率 | 60fps | 低于 50fps 降级 |
| 首屏玻璃附加合成时间 | <8ms | 达到 16ms 重评 |

先记录测试设备、屏幕刷新率、DPR、浏览器/引擎、视口和背景。高刷新率屏幕帧预算更短；以上为配方目标，不是静态校验器能测出的结果。

## 2. 成本模型

浏览器/引擎通常需要采样下方内容、离屏过滤、颜色调整、合成。大面积、大模糊、多个重叠层和动态背景更昂贵。`面积 × 半径² × 数量` 只能当粗略风险提示，现代引擎可能降采样、缓存、用不同模糊算法，不能作为精确复杂度或毫秒预测。嵌套不会在所有实现上“指数级变慢”，但会增加采样/合成负担并改变 backdrop root。

## 3. 优化

模态遮罩只用颜色，面板做模糊：

```css
.overlay { position: fixed; inset: 0; background: var(--lg-overlay); }
.panel { backdrop-filter: blur(var(--lg-medium-blur)) saturate(var(--lg-medium-saturate)); }
```

只给固定容器一次玻璃，行项目普通填充。不要把整页装饰成全屏动态模糊。动画只改变 transform / opacity；径向渐变变量会产生 paint，应限制区域并按 rAF 合并。不要在每个 pointermove 先读 getBoundingClientRect 再写样式，更不要动画化 blur、width、height。

`will-change: backdrop-filter` 是否有帮助取决于引擎，不应常驻，可能浪费合成内存。先测量再优化；transform 也会改变定位包含块，不能随意用来“强制 GPU”。

移动端/粗指针在局部强度类之后覆盖，避免只改 :root 而根本未生效：

```css
@media (max-width: 768px), (pointer: coarse) {
  .lg-surface { --lg-blur: var(--lg-subtle-blur); --lg-saturate: var(--lg-subtle-saturate); }
  .lg-surface .lg-surface { -webkit-backdrop-filter: none; backdrop-filter: none; }
  .lg-surface::after { display: none; }
}
```

设备探测只能辅助，不应无条件拦截：

```js
const lowEndHint = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || (navigator.deviceMemory && navigator.deviceMemory <= 4);
// 结合实测或应用内“减少效果”设置决定；不是所有四核设备都低端。
if (lowEndHint) document.documentElement.classList.add('lg-reduced');
```

脚本不会自动采集设备信息或设置此类。`.lg-reduced` 降到 subtle、禁持续跟踪/扫光，粗指针可单次高光；若仍慢，用 `.lg-opaque` 完全不透明。

## 4. 排查

Chrome/Edge DevTools：Rendering 的 Paint flashing 检查重绘区域；Performance 录制滚动/触摸，检查长帧、绘制与合成任务；Layers 检查合成区域与内存。Safari Web Inspector 的 Timelines 检查帧与绘制。Flutter 用 DevTools frame timeline；原生用 Instruments。

1. 同样背景下，对比关闭玻璃与开启玻璃的录制。
2. 每次只减面积、半径或数量中的一项。
3. 最低目标设备连续滚动并触摸，不只看静态截图。
4. 记录结论；没有真机/录制时标待验证，不编造 60fps。

## 5. 陷阱

| 情况 | 排查方向 |
|---|---|
| 父级 opacity/filter/mask/clip 或复合层 | 检查 backdrop root 和可采样范围，不能断言 overflow 一定让所有玻璃失效 |
| 父级 transform + fixed/sticky | 新包含块/滚动祖先可能改变定位；不随意加 transform |
| 自身 overflow:hidden | 可裁切子内容与焦点，但通常不会裁掉自身 box-shadow；优先裁切装饰层 |
| 父容器裁切外阴影 | 外部绘制阴影、内部裁切玻璃 |
| fixed 背景与滚动玻璃 | 可能重采样，需实测，不保证 sticky 一定更快 |
| MutationObserver 清理只覆盖初始节点 | 后加入节点泄漏；观察器停止要清理其持有的所有节点 |
