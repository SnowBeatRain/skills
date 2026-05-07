# 能力矩阵

三端插件必须公开能力矩阵。不要把 SQLite 官方支持的能力等同于当前插件三端都支持。

## CapabilityReport

```ts
export interface CapabilityReport {
  pluginVersion: string
  currentPlatform: 'android' | 'ios' | 'harmony'
  platforms: Record<'android' | 'ios' | 'harmony', PlatformCapabilities>
}

export interface PlatformCapabilities {
  available: boolean
  sqliteVersion?: string
  wrapper: string
  minRuntime?: string
  parameterBinding: boolean
  transactions: boolean
  batch: boolean
  userVersion: boolean
  foreignKeys: 'supported' | 'unsupported' | 'unknown'
  wal: 'supported' | 'unsupported' | 'unknown'
  busyTimeout: 'supported' | 'unsupported' | 'unknown'
  fts5: 'supported' | 'unsupported' | 'unknown'
  json1: 'supported' | 'unsupported' | 'unknown'
  encryption: 'supported' | 'unsupported' | 'field-level' | 'platform' | 'unknown'
  backup: 'supported' | 'unsupported' | 'unknown'
  notes?: string[]
}
```

## 检测原则

- 能执行 SQL 的平台，优先使用 `SELECT sqlite_version()` 和关键 PRAGMA。
- wrapper 不允许检测时，查官方文档并做真机验证。
- WAL、FTS5、JSON1、SQLCipher、backup API 都是可选能力。
- HarmonyOS 不要默认等同于 Android SQLite；必须按目标 API Level 和 wrapper 能力核查。

## 文档输出要求

目标插件项目的 README 或交付说明应列出（这是生成/审查的插件工程文档，不是在本 AgentSkill 目录中新增 README）：

| 能力 | Android | iOS | HarmonyOS | 备注 |
|---|---|---|---|---|
| 参数绑定 | required | required | required | 不支持则不能处理外部输入 |
| 事务 | required | required | required | 事务中复用同一上下文 |
| WAL | detected | detected | detected | 以实际返回值为准 |
| FTS5 | optional | optional | optional | 需要真实建表验证 |
| JSON1 | optional | optional | optional | 需要函数验证 |
| 加密 | detected | detected | detected | 值应为 `supported`、`field-level`、`platform`、`unsupported` 或 `unknown`；SQLite 官方本身不加密 |

