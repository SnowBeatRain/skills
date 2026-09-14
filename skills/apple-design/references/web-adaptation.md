# Apple 风格网页适配指南

把 Apple 设计语言落到网页（HTML/CSS）。**做网页设计任务时必读**，并优先使用 `assets/apple-web-template.css` 作为起点。

## 目录

1. [核心原则](#1-核心原则)
2. [CSS 令牌（Token）](#2-css-令牌token)
3. [布局模式](#3-布局模式)
4. [组件清单](#4-组件清单)
5. [深色模式](#5-深色模式)
6. [动效与减少动态](#6-动效与减少动态)
7. [示例骨架](#7-示例骨架)

## 1. 核心原则

- **内容至上**：大留白（hero 区 80–120px）、居中窄栏（内容区 ≤ 980px）、少装饰。
- **克制配色**：以白/浅灰为主，用 1 个品牌强调色 + 系统状态色；不用大面积高饱和。
- **清晰层级**：标题→正文→说明的字号差拉开；避免边框堆砌，用留白与灰度分层。
- **玻璃质感**：导航栏/浮层用 `backdrop-filter` 毛玻璃；纯白实底内容区。
- **移动优先**：单栏流式布局 → 桌面多栏；触控目标 ≥44px。

## 2. CSS 令牌（Token）

```css
:root {
  /* 颜色（浅色） */
  --bg: #FFFFFF;            /* 页面背景 */
  --bg-grouped: #F2F2F7;    /* 分组背景 */
  --bg-secondary: #F5F5F7;  /* 区块/卡片底 */
  --text-primary: #1D1D1F;  /* 主文字 */
  --text-secondary: #86868B;/* 次要文字 */
  --text-tertiary: #AEAEB2; /* 弱化文字 */
  --separator: rgba(60,60,67,.29); /* 分隔线 */
  --accent: #007AFF;        /* 主操作（品牌色可替换） */
  --accent-hover: #0A84FF;
  --success: #34C759;
  --danger: #FF3B30;
  --warning: #FF9500;
  --fill: rgba(120,120,128,.12); /* 输入框/胶囊填充 */

  /* 字体 */
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text",
          "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;

  /* 间距（8pt 栅格） */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  /* 圆角与阴影 */
  --radius-sm: 10px; --radius-md: 14px; --radius-lg: 18px; --radius-full: 999px;
  --shadow-card: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06);
  --shadow-float: 0 4px 16px rgba(0,0,0,.12), 0 12px 40px rgba(0,0,0,.10);

  /* 毛玻璃 */
  --glass: rgba(255,255,255,.65);
  --glass-blur: blur(20px) saturate(180%);
}
```

## 3. 布局模式

- **内容宽度**：正文 680px；内容区 ≤980px；hero 可全宽。
- **Hero**：大标题（clamp(36px, 6vw, 56px) 字重 700）+ 副标题（18–20px 次要色）+ 1–2 个 CTA；居中或左对齐，下留 64–96px。
- **导航**：吸顶，`position: sticky` + 毛玻璃；左侧 logo、中间/右侧链接（≤6 项）；移动端汉堡菜单。
- **卡片网格**：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`；卡片内边距 24px、圆角 18px、hover 轻浮起（translateY(-2px) + 阴影加深，150ms）。
- **分区标题**：区块上方 28px 字重 700 + 4px 留白后接内容；多用"上留白"代替分割线。

## 4. 组件清单

| 组件 | 写法要点 |
|---|---|
| 按钮 | 主：`background: var(--accent); color:#fff; border-radius: 980px; padding: 12px 22px; font-weight:600;` 次：透明+accent 描边/文字；禁用：`opacity:.4` |
| 卡片 | `background:#fff; border-radius:18px; box-shadow: var(--shadow-card); padding:24px` |
| 输入框 | `background: var(--fill); border:none; border-radius:10px; padding:12px 14px;` focus 加 2px accent 描边 |
| 标签/胶囊 | `background: var(--fill); border-radius:999px; padding:6px 12px; font-size:13px` |
| 表格 | 去掉纵向边框，只保留行分隔线 `border-bottom:1px solid var(--separator)`；表头 13px 次要色 |
| 侧栏 | 宽 240–280px，`background:#F5F5F7` 或毛玻璃；选中项 `background:var(--fill)` 圆角 8px |
| 弹窗 | 固定定位居中，宽 ≤420px，圆角 18px，阴影 `--shadow-float`，遮罩 `rgba(0,0,0,.4)` |

## 5. 深色模式

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000000;
    --bg-grouped: #1C1C1E;
    --bg-secondary: #161617;
    --text-primary: #F5F5F7;
    --text-secondary: #AEAEB2;
    --text-tertiary: #636366;
    --separator: rgba(84,84,88,.6);
    --accent: #0A84FF;
    --success: #30D158; --danger: #FF453A; --warning: #FF9F0A;
    --fill: rgba(120,120,128,.24);
    --glass: rgba(28,28,30,.65);
    --shadow-card: 0 1px 3px rgba(0,0,0,.4);
  }
}
```

## 6. 动效与减少动态

- 过渡统一 `150–250ms ease-out`；hover 只做轻量反馈（颜色/透明度/2px 位移）。
- 尊重用户：`@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`
- 页面进入可用 8–12px 位移 + 淡入（250ms），不做花哨入场。

## 7. 示例骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Apple 风格页面</title>
  <!-- 引入或内联 assets/apple-web-template.css -->
</head>
<body>
  <nav class="nav">
    <a class="brand">Logo</a>
    <div class="nav-links"><a>功能</a><a>设计</a><a>关于</a></div>
    <button class="btn btn-primary">开始使用</button>
  </nav>

  <header class="hero">
    <h1>大标题，直接有力</h1>
    <p class="sub">副标题用次要色，一句话说清价值。</p>
    <div class="hero-actions">
      <button class="btn btn-primary">主要操作</button>
      <button class="btn btn-secondary">次要操作</button>
    </div>
  </header>

  <main class="content">
    <section>
      <h2>分区标题</h2>
      <div class="grid">
        <article class="card">卡片 1：标题 + 一句说明</article>
        <article class="card">卡片 2</article>
        <article class="card">卡片 3</article>
      </div>
    </section>
  </main>

  <footer class="footer">
    <span>页脚：次要色小字，版权与链接</span>
  </footer>
</body>
</html>
```

具体样式直接复制 `assets/apple-web-template.css`。
