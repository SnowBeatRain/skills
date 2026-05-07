# 统一错误模型

SQLite 错误需要同时服务三类使用者：业务层判断、开发调试、后台恢复。错误对象应统一且可脱敏记录。

## 推荐结构

```ts
export interface DatabaseError {
  code: string
  message: string
  nativeCode?: number | string
  extendedCode?: number | string
  operation?: 'open' | 'close' | 'execute' | 'query' | 'transaction' | 'migration' | 'backup'
  sqlKind?: 'DDL' | 'DML' | 'SELECT' | 'PRAGMA' | 'TRANSACTION'
  retryable?: boolean
  constraint?: boolean
  platform?: string
  cause?: unknown
}
```

`message` 面向开发者，不应包含敏感参数。UI 展示文案由业务层根据 `code` 映射。

## 错误分类

| 统一 code | SQLite/native 情况 | 建议处理 |
|---|---|---|
| `DB_BUSY` | busy / locked | 缩短事务、重试、设置 busy timeout |
| `DB_CONSTRAINT` | unique / foreign key / check / not null | 返回业务错误或修复数据 |
| `DB_READONLY` | readonly / permission | 检查路径、权限、只读包内资源 |
| `DB_FULL` | full / quota | 暂停写入和同步，提示清理空间 |
| `DB_IO` | IO error | 停止写入，检查文件系统和权限 |
| `DB_CORRUPT` | corrupt / notadb | 停止写入，备份现场，恢复 |
| `DB_SCHEMA` | schema changed | 重新 prepare statement，检查迁移 |
| `DB_MISUSE` | API misuse | 检查连接、事务、statement 生命周期 |
| `DB_UNSUPPORTED` | wrapper 不支持能力 | 降级或禁用功能 |

## 诊断上下文

日志可记录：

- SQL 模板或 SQL kind。
- 参数类型和数量，不记录敏感参数值。
- 耗时、影响行数、数据库别名、迁移版本。
- 原始错误码、扩展错误码、平台和 wrapper 名称。

日志不能记录：

- 密钥、token、证件号、手机号、精确位置。
- 未脱敏业务 payload。
- 完整用户输入或同步原始数据。

## 可重试判断

可重试通常包括 busy/locked、临时 IO、后台同步网络相关失败。不可盲目重试 constraint、readonly、schema 设计错误、misuse 和 corrupt。重试必须有次数、退避和用户可见状态。

