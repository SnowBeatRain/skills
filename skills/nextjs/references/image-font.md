# 图片与字体优化

## next/image

### 基本用法

```typescript
import Image from 'next/image'

// 本地图片（自动推断宽高）
import heroImg from '@/public/hero.png'

export function Hero() {
  return (
    <Image
      src={heroImg}
      alt="Hero banner"
      placeholder="blur"  // 本地图片支持模糊占位
      priority            // 首屏图片设置 priority
    />
  )
}

// 远程图片（必须指定宽高或 fill）
export function Avatar({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt="User avatar"
      width={64}
      height={64}
      className="rounded-full"
    />
  )
}
```

### fill 模式（容器自适应）

```typescript
export function Banner({ url }: { url: string }) {
  return (
    <div className="relative w-full h-[400px]">
      <Image
        src={url}
        alt="Banner"
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  )
}
```

### sizes 属性

`sizes` 帮助浏览器选择正确的 srcset 图片：

```typescript
<Image
  src={url}
  alt="Product"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 远程图片配置

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
    // 自定义设备宽度（用于 srcset）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 自定义图片宽度
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 输出格式
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 常用属性

| 属性 | 说明 |
|------|------|
| `priority` | 首屏/LCP 图片设为 true，预加载 |
| `placeholder="blur"` | 加载时显示模糊占位 |
| `quality={75}` | 图片质量 1-100 |
| `loading="lazy"` | 默认值，懒加载 |
| `unoptimized` | 跳过优化（SVG 等） |

### 最佳实践

1. **首屏图片加 `priority`**——避免 LCP 延迟
2. **始终设置 `alt`**——无障碍和 SEO
3. **使用 `sizes`**——避免下载过大图片
4. **SVG 用 `unoptimized`**——SVG 不需要像素优化
5. **避免布局偏移**——始终指定 `width`/`height` 或使用 `fill`

---

## next/font

### Google 字体

```typescript
// app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### 本地字体

```typescript
import localFont from 'next/font/local'

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-my',
})
```

### Tailwind CSS 集成

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        chinese: ['var(--font-noto)'],
      },
    },
  },
}
```

```html
<p class="font-sans">English text</p>
<p class="font-chinese">中文文本</p>
```

### 字体最佳实践

1. **使用 `variable` 模式**——通过 CSS 变量引用，更灵活
2. **设置 `display: 'swap'`**——字体加载前显示系统字体，避免 FOIT
3. **指定需要的 `weight`**——不要加载不使用的字重
4. **指定 `subsets`**——减少字体文件体积
5. **在根 layout 中加载**——全局可用，只加载一次
6. **不要用外部 CSS `@import`**——会产生额外网络请求和 FOUT

### next/font vs 外部引入

| 特性 | next/font | 外部 @import |
|------|-----------|-------------|
| 自托管 | ✅ | ❌（依赖 CDN） |
| CLS | 零 | 可能有 |
| 性能 | 构建时预加载 | 运行时加载 |
| 子集化 | 自动 | 手动 |
| 隐私 | 不泄露到第三方 | 请求发到 Google |
