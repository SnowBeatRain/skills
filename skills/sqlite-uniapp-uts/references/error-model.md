# UTS 插件错误模型

本文件自包含 UTS 插件对外错误模型。若另有通用 SQLite skill，可参考其 SQLite 原生错误分类，但不要依赖外部路径。

## 对外错误结构

```ts
export interface SqlitePluginError {
  errCode: string
  errMsg: string
  platform: 'android' | 'ios' | 'harmony'
  nativeCode?: number | string
  extendedCode?: number | string
  operation?: string
  retryable?: boolean
}
```

## 错误码命名

建议使用稳定插件错误码：

| errCode | 含义 |
|---|---|
| `SQLITE_PLUGIN_UNAVAILABLE` | 当前平台或运行环境不可用 |
| `SQLITE_OPEN_FAILED` | 打开失败 |
| `SQLITE_CLOSE_FAILED` | 关闭失败 |
| `SQLITE_EXECUTE_FAILED` | 执行失败 |
| `SQLITE_QUERY_FAILED` | 查询失败 |
| `SQLITE_TRANSACTION_FAILED` | 事务失败并回滚 |
| `SQLITE_MIGRATION_FAILED` | 迁移失败 |
| `SQLITE_BUSY` | 锁等待或并发冲突 |
| `SQLITE_CONSTRAINT` | 约束失败 |
| `SQLITE_UNSUPPORTED` | 能力不支持 |

## 日志脱敏

插件日志可记录 SQL 模板、参数数量、参数类型、耗时和原生错误码。不要记录完整参数值、密钥、token、手机号、证件号、位置或同步 payload。

