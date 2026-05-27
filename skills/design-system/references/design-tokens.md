# 设计令牌（Design Tokens）

## 概念

设计令牌是设计决策的最小原子单元——一个颜色值、一个间距值、一个字号。它们是设计与工程之间的桥梁。

## 令牌层级

```
Global Tokens（全局令牌）
  └─ Alias Tokens（别名令牌）
      └─ Component Tokens（组件令牌）
```

### 全局令牌

所有可能的原始值：

```json
{
  "color-blue-500": "#3b82f6",
  "space-4": "16px",
  "radius-md": "8px"
}
```

### 别名令牌

带语义的引用：

```json
{
  "color-primary": "{color-blue-500}",
  "space-card-padding": "{space-4}",
  "radius-button": "{radius-md}"
}
```

### 组件令牌

绑定到具体组件：

```json
{
  "button-bg": "{color-primary}",
  "button-padding": "{space-card-padding}",
  "button-radius": "{radius-button}"
}
```

## 产出格式

| 工具 | 格式 | 说明 |
|------|------|------|
| Tailwind CSS | `tailwind.config.ts` | 用 `extend` 覆盖默认令牌 |
| CSS Variables | `:root` 变量 | 通用，任何框架可用 |
| Style Dictionary | JSON → 多平台 | 企业级设计系统 |
| Figma Tokens | JSON 插件 | 设计工具同步 |

## Tailwind 配置示例

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
    },
  },
}
```
