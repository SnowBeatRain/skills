# Nuxt 4 总览与安装

## 框架定位

Nuxt 是基于 Vue 3 的全栈框架，结合 Vite（开发/构建）和 Nitro（服务引擎），提供：

- **文件系统路由**：`app/pages/` 下的文件自动生成路由
- **自动导入**：Vue composables、Nuxt 工具函数、自定义 composables 无需手动 import
- **SSR/SSG/SPA**：多种渲染模式开箱即用
- **服务端 API**：`server/api/` 下文件即 API 端点
- **模块生态**：丰富的官方和社区模块

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3（Composition API） |
| 构建工具 | Vite |
| 服务引擎 | Nitro |
| 类型系统 | TypeScript（推荐） |
| 包管理器 | pnpm（推荐）/ npm / yarn |
| Node.js | ≥ 18.x |

## 快速开始

```bash
# 创建新项目
npx nuxi@latest init my-app

# 进入目录并安装依赖
cd my-app
pnpm install

# 启动开发服务器
pnpm dev
```

开发服务器默认监听 `http://localhost:3000`。

## 项目结构（Nuxt 4）

```
my-app/
├── app/                    # 前端应用代码
│   ├── app.vue            # 根组件
│   ├── pages/             # 文件系统路由
│   ├── components/        # 自动导入的组件
│   ├── composables/       # 自动导入的组合式函数
│   ├── layouts/           # 布局组件
│   ├── middleware/        # 路由中间件
│   ├── plugins/           # 插件
│   ├── assets/            # 构建处理的静态资源
│   └── utils/             # 自动导入的工具函数
├── server/                 # 服务端代码
│   ├── api/               # API 路由
│   ├── routes/            # 服务端路由
│   ├── middleware/        # 服务端中间件
│   ├── plugins/           # Nitro 插件
│   └── utils/             # 服务端工具函数
├── public/                 # 不经构建处理的静态文件
├── layers/                 # Nuxt Layers
├── modules/                # 本地模块
├── nuxt.config.ts          # Nuxt 配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

## nuxt.config.ts 基础配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 开发工具
  devtools: { enabled: true },

  // 模块
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
  ],

  // 运行时配置
  runtimeConfig: {
    // 仅服务端可见
    apiSecret: '',
    // 客户端可见
    public: {
      apiBase: '/api',
    },
  },

  // 兼容性日期（Nuxt 4 要求）
  compatibilityDate: '2025-01-01',
})
```

## 关键命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm generate     # 静态站点生成（SSG）
pnpm preview      # 预览生产构建
npx nuxi analyze  # 分析 bundle 体积
npx nuxi cleanup  # 清理 .nuxt 缓存
npx nuxi module add <name>  # 添加模块
```

## 版本迁移注意

从 Nuxt 3 升级到 Nuxt 4 的主要变化：

1. **app/ 目录**：前端代码移入 `app/` 目录（Nuxt 3 在根目录）。
2. **compatibilityDate**：必须设置，控制行为版本。
3. **改进的类型安全**：更严格的 TypeScript 类型推断。
4. **Data fetching 优化**：`getCachedData`、`dedupe` 等新选项。
5. **vue-router v5**：新的路由 API。

## 官方资源

- 源码：https://github.com/nuxt/nuxt
- 文档：https://nuxt.com/docs
- 模块市场：https://nuxt.com/modules
- Nitro 文档：https://nitro.build
