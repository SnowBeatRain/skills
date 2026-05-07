# SQLite C API 与 Wrapper 映射

SQLite 官方底层 API 是 C API。多数语言 wrapper 都是在封装连接、prepared statement、参数绑定、step、finalize、错误码、事务和 backup。

## Statement 生命周期

```text
sqlite3_open_v2
  → sqlite3_prepare_v2
  → sqlite3_bind_*
  → sqlite3_step
  → sqlite3_column_*
  → sqlite3_reset / sqlite3_finalize
  → sqlite3_close
```

## 常用 C API

| API | 用途 | Wrapper 应暴露的能力 |
|---|---|---|
| `sqlite3_open_v2` | 打开数据库 | open(path, flags) |
| `sqlite3_close` | 关闭连接 | close() |
| `sqlite3_prepare_v2` | 编译 SQL | prepared statement / query |
| `sqlite3_bind_*` | 参数绑定 | `?` / named params |
| `sqlite3_step` | 执行一步 | execute/query iterator |
| `sqlite3_column_*` | 读取列值 | rows/typed values |
| `sqlite3_reset` | 重用 statement | statement cache |
| `sqlite3_finalize` | 释放 statement | 自动释放/显式 dispose |
| `sqlite3_exec` | 简单执行 SQL | execute batch，但不替代参数绑定 |
| `sqlite3_errcode` | 错误码 | 保留原始 code |
| `sqlite3_errmsg` | 错误消息 | 保留原始 message |
| `sqlite3_busy_timeout` | 锁等待 | busy timeout 设置 |
| `sqlite3_backup_*` | 在线备份 | backup/restore API |
| `sqlite3_limit` | 限制资源 | limits 配置/查询 |

## Wrapper 设计原则

- 必须支持参数绑定；不支持参数绑定的 wrapper 不适合处理外部输入。
- 事务回调内部必须复用同一连接/事务上下文。
- 错误对象应保留 SQLite 原始错误码，便于区分 busy、locked、constraint、readonly、full、corrupt。
- 查询接口应明确返回类型转换规则：NULL、INTEGER、REAL、TEXT、BLOB。
- 大结果集应支持分页或迭代，不要默认一次性读全表。
- prepared statement 使用后必须 finalize/dispose，避免资源泄漏。

## 推荐抽象

```ts
export interface LocalDatabase {
  open(): Promise<void>
  close(): Promise<void>
  execute(sql: string, params?: unknown[]): Promise<{ changes?: number; lastInsertRowid?: unknown }>
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
  transaction<T>(fn: (tx: LocalDatabase) => Promise<T>): Promise<T>
}
```

该接口只是宿主无关契约；具体 API 名称以语言/平台 wrapper 为准。
