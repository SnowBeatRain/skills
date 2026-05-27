# 字体选型与排版

## 字体组合策略

推荐最多 2 个字体族：一个用于标题，一个用于正文。也可以只用 1 个字体族配合不同字重。

### 常见组合

| 风格 | 标题 | 正文 | 适合场景 |
|------|------|------|----------|
| 现代科技 | Inter / Geist | Inter | SaaS、工具、后台 |
| 优雅精致 | Playfair Display | Source Sans 3 | 杂志、品牌站 |
| 友好亲和 | Nunito / Poppins | Open Sans | 教育、消费类 |
| 代码风格 | JetBrains Mono | Inter | 开发者工具 |
| 中文优先 | 思源黑体 / 霞鹜文楷 | 苹方 / 系统默认 | 中文产品 |

## 字号阶梯（Type Scale）

选择一个比例系数，从 base size 递推：

| 名称 | 尺寸 | 行高 | 用途 |
|------|------|------|------|
| xs | 12px | 1.5 | 辅助文字、标签 |
| sm | 14px | 1.5 | 正文（紧凑） |
| base | 16px | 1.6 | 正文（默认） |
| lg | 18px | 1.5 | 小标题 |
| xl | 20px | 1.4 | 区块标题 |
| 2xl | 24px | 1.4 | 页面标题 |
| 3xl | 30px | 1.3 | 大标题 |
| 4xl | 36px | 1.2 | 页面主标题 |

## 字重

| 名称 | 值 | 用途 |
|------|------|------|
| Regular | 400 | 正文 |
| Medium | 500 | 强调正文、按钮 |
| Semibold | 600 | 小标题 |
| Bold | 700 | 标题 |

## 加载优化

- 使用 `font-display: swap` 避免 FOIT。
- 子集化（只加载用到的字符）。
- 自托管 > Google Fonts CDN（减少外部依赖和 CLS）。
- Next.js: 用 `next/font` 自动处理。
- Nuxt: 用 `@nuxt/fonts` 或 `nuxt-font-utils`。
