# CI/CD 自动化与 Vite 配置

## GitHub Actions 工作流

### H5 构建与部署

```yaml
# .github/workflows/build-h5.yml
name: Build & Deploy H5

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build H5
        run: npm run build:h5
        env:
          VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
          VITE_APP_ENV: production

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/build/h5
```

### 微信小程序构建与上传

```yaml
# .github/workflows/build-mp-weixin.yml
name: Build & Upload WeChat Mini Program

on:
  push:
    tags: ['v*']  # 仅 tag 触发

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Mini Program
        run: npm run build:mp-weixin
        env:
          VITE_API_BASE: ${{ secrets.VITE_API_BASE }}

      - name: Install miniprogram-ci
        run: npm install -g miniprogram-ci

      - name: Upload to WeChat
        run: |
          miniprogram-ci upload \
            --pp ./dist/build/mp-weixin \
            --pkp "${{ secrets.WX_PRIVATE_KEY }}" \
            --appid ${{ secrets.WX_APPID }} \
            --uv "${GITHUB_REF#refs/tags/}" \
            -r 1 \
            --desc "CI auto upload $(date +%Y%m%d%H%M)"
```

**miniprogram-ci 说明：**
- `--pp`：构建产物目录
- `--pkp`：小程序上传密钥（微信公众平台 → 开发管理 → 开发设置 → 小程序代码上传密钥）
- `--uv`：版本号（从 git tag 提取）
- `-r`：机器人编号（1-30）
- 上传后需在微信公众平台手动提交审核

### 多平台并行构建

```yaml
# .github/workflows/build-all.yml
name: Build All Platforms

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [h5, mp-weixin, mp-alipay]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run build:${{ matrix.platform }}
        env:
          VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.platform }}
          path: dist/build/${{ matrix.platform }}
```

---

## 环境变量管理

### .env 文件

```bash
# .env（所有环境）
VITE_APP_TITLE=My App

# .env.development（开发环境）
VITE_API_BASE=http://localhost:3000
VITE_APP_ENV=development

# .env.production（生产环境）
VITE_API_BASE=https://api.example.com
VITE_APP_ENV=production

# .env.staging（预发布环境）
VITE_API_BASE=https://staging-api.example.com
VITE_APP_ENV=staging
```

### 在代码中使用

```js
// Vue3 + Vite 项目
const apiBase = import.meta.env.VITE_API_BASE
const appEnv = import.meta.env.VITE_APP_ENV
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

// Vue2 + Webpack 项目
const apiBase = process.env.VUE_APP_API_BASE
```

### CI 中注入环境变量

```yaml
# GitHub Actions 中通过 Secrets 注入
- run: npm run build:h5
  env:
    VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
    VITE_API_SECRET: ${{ secrets.VITE_API_SECRET }}
    VITE_STORAGE_KEY: ${{ secrets.VITE_STORAGE_KEY }}
```

**安全规则：**
- `VITE_` 前缀的变量会被打包进客户端代码，不要放密钥
- 真正的密钥（如 API Secret）应仅在服务端使用
- 签名用的 Secret 如果必须在客户端使用，要做好代码混淆 + APK 加固

---

## Vite 配置

### 基础配置（vite.config.js）

```js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),           // 如果用 src 目录
      '@components': resolve(__dirname, 'components'),
      '@composables': resolve(__dirname, 'composables'),
      '@store': resolve(__dirname, 'store'),
      '@utils': resolve(__dirname, 'utils'),
      '@static': resolve(__dirname, 'static')
    }
  }
})
```

### 开发代理（解决 H5 跨域）

```js
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/upload': {
        target: 'https://upload.example.com',
        changeOrigin: true
      }
    }
  }
})
```

**注意：** 代理仅在 H5 开发环境有效。生产环境需配置 Nginx 反向代理或后端 CORS。

### 构建优化

```js
export default defineConfig({
  plugins: [uni()],
  build: {
    // 生产环境移除 console.log
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 分包大小警告阈值
    chunkSizeWarningLimit: 1000,
    // CSS 代码分割
    cssCodeSplit: true,
    // sourcemap（生产环境建议关闭或用 hidden）
    sourcemap: false
  }
})
```

### 全局常量定义

```js
export default defineConfig({
  plugins: [uni()],
  define: {
    __APP_VERSION__: JSON.stringify(require('./package.json').version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
```

```js
// 代码中使用
console.log(`版本: ${__APP_VERSION__}, 构建时间: ${__BUILD_TIME__}`)
```

---

## App 构建自动化

### 云打包 API（HBuilderX CLI）

```bash
# 安装 HBuilderX CLI
npm install -g @hbuilderx/cli

# 登录 DCloud 账号
hbuilderx login --username $DCLOUD_USER --password $DCLOUD_PASS

# 云打包 Android
hbuilderx pack --project ./my-project --platform android --type release

# 云打包 iOS
hbuilderx pack --project ./my-project --platform ios --type release
```

### 安心打包（推荐）

安心打包在 DCloud 安全环境中编译，比传统云打包更安全更快：
- 代码加密传输
- 打包环境隔离
- 不保留源码

```bash
# HBuilderX 4.0+ 支持
# 发行 → 原生 App-云打包 → 勾选"使用安心打包"
```

---

## 小程序体积管控

### 主包不超过 2MB

```yaml
# CI 中检查包体积
- name: Check package size
  run: |
    SIZE=$(du -sb ./dist/build/mp-weixin | cut -f1)
    MAX_SIZE=$((2 * 1024 * 1024))  # 2MB
    if [ "$SIZE" -gt "$MAX_SIZE" ]; then
      echo "ERROR: Package size ${SIZE} exceeds 2MB limit"
      exit 1
    fi
    echo "Package size: ${SIZE} bytes (limit: ${MAX_SIZE})"
```

### 分包策略

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/mine/mine" }
  ],
  "subPackages": [
    {
      "root": "subpkg-order",
      "pages": [
        { "path": "list/list" },
        { "path": "detail/detail" }
      ]
    },
    {
      "root": "subpkg-setting",
      "pages": [
        { "path": "index/index" },
        { "path": "about/about" }
      ]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["subpkg-order"]
    }
  }
}
```

---

## 完整 CI/CD 流程图

```
代码提交
  │
  ├─ PR → Lint + Unit Test (Vitest) → Code Review → Merge
  │
  └─ Tag (v*) → 多平台并行构建
       │
       ├─ H5 → 部署到 CDN/服务器
       ├─ 微信小程序 → miniprogram-ci 上传 → 手动审核
       ├─ 支付宝小程序 → alipay-ci 上传 → 手动审核
       └─ App → 云打包/安心打包 → 上传应用商店
```

### package.json 脚本汇总

```json
{
  "scripts": {
    "dev:h5": "uni dev -p h5",
    "dev:mp-weixin": "uni dev -p mp-weixin",
    "dev:app": "uni dev -p app",
    "build:h5": "uni build -p h5",
    "build:mp-weixin": "uni build -p mp-weixin",
    "build:mp-alipay": "uni build -p mp-alipay",
    "build:app": "uni build -p app",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .vue,.js,.ts,.uts",
    "lint:fix": "eslint . --ext .vue,.js,.ts,.uts --fix"
  }
}
```
