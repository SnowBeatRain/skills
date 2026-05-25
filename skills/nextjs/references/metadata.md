# Metadata 与 SEO

## 概述

Next.js 提供内置的 Metadata API 用于管理 HTML `<head>` 中的 meta 标签，支持 SEO 和社交分享优化。

## 静态 Metadata

在任意 `layout.tsx` 或 `page.tsx` 中导出 `metadata` 对象：

```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | My App',  // 子页面标题模板
    default: 'My App',         // 默认标题
  },
  description: '这是我的应用',
  keywords: ['Next.js', 'React', 'TypeScript'],
  authors: [{ name: 'Author' }],
  creator: 'Author',

  // Open Graph
  openGraph: {
    title: 'My App',
    description: '这是我的应用',
    url: 'https://myapp.com',
    siteName: 'My App',
    images: [
      {
        url: 'https://myapp.com/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: '这是我的应用',
    images: ['https://myapp.com/og.png'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // 其他
  metadataBase: new URL('https://myapp.com'),
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/zh-CN',
      'en-US': '/en-US',
    },
  },
}
```

## 动态 Metadata

使用 `generateMetadata` 函数根据动态数据生成 metadata：

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{/* ... */}</article>
}
```

## Title 模板

```typescript
// app/layout.tsx — 设置模板
export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
}

// app/about/page.tsx — 子页面
export const metadata: Metadata = {
  title: 'About',  // 渲染为 "About | My App"
}

// 绝对标题（忽略模板）
export const metadata: Metadata = {
  title: {
    absolute: 'Custom Title',  // 渲染为 "Custom Title"
  },
}
```

## Sitemap

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://myapp.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://myapp.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}

// 动态 sitemap（大量页面）
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({ select: { slug: true, updatedAt: true } })

  return posts.map((post) => ({
    url: `https://myapp.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }))
}
```

## Robots.txt

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: 'https://myapp.com/sitemap.xml',
  }
}
```

## JSON-LD 结构化数据

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>{/* ... */}</article>
    </>
  )
}
```

## Open Graph 图片生成

```typescript
// app/og/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'My App'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: 48,
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

## Favicon 和 App Icons

在 `app/` 目录下直接放置图标文件：

```
app/
├── favicon.ico           → /favicon.ico
├── icon.png              → /icon-192x192.png
├── apple-icon.png        → Apple Touch Icon
└── opengraph-image.png   → OG 图片（每个路由段可覆盖）
```

或使用代码生成：

```typescript
// app/icon.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{ fontSize: 24, background: '#000', color: '#fff', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      A
    </div>,
    size
  )
}
```
