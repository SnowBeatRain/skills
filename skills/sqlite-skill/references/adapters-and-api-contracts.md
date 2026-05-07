# Adapter 与 API 契约

SQLite skill 保持平台中立，但可以设计宿主无关的数据访问契约。具体实现由项目环境或其他 skill 补充。

## 何时需要 Adapter

- 同一业务需要在多个宿主运行。
- SQLite wrapper 的 API 不一致，但上层 DAO / Repository 希望稳定。
- 需要统一事务、参数绑定、迁移、日志和错误处理。
- 浏览器/WASM、移动端 wrapper、桌面端、后端脚本等环境能力差异明显。

## 最小契约

```ts
export interface LocalDatabase {
  open?(): Promise<void>
  close?(): Promise<void>
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected?: number; lastInsertRowid?: unknown }>
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
  transaction<T>(fn: (tx: LocalDatabase) => Promise<T>): Promise<T>
  getCapabilities?(): Promise<Record<string, unknown>>
}
```

约束：

- 所有外部值必须通过 `params` 绑定。
- `transaction()` 中的所有写入必须复用同一连接或同一事务上下文。
- 动态表名、列名、排序字段不进入 `params`，必须走白名单映射。
- 错误对象要保留 SQLite error code / message，但日志中脱敏 SQL 参数。
- 结果集映射必须明确 NULL、INTEGER、REAL、TEXT、BLOB 的宿主类型。

## 能力探测

初始化时记录或检查：

```sql
SELECT sqlite_version();
PRAGMA compile_options;
PRAGMA foreign_keys;
PRAGMA journal_mode;
PRAGMA user_version;
```

不要静态假设以下能力一定存在：

- WAL / shared-cache / busy timeout
- FTS5、JSON1/JSONB、RTREE
- SQLCipher 或加密 wrapper
- `RETURNING`、`ON CONFLICT DO UPDATE`、STRICT table
- backup API、在线备份、跨进程锁行为

## 分层建议

```text
Application / Service
  → Repository / DAO
  → QueryBuilder 或 SQL 模板
  → LocalDatabase Adapter
  → 具体宿主 SQLite wrapper
```

SQLite skill 可提供前四层的通用设计。最后一层的具体 API 以宿主文档为准。

## 错误处理模式

| 模式 | 适用场景 | 行为 |
|---|---|---|
| throw-fast | 初始化、迁移、强一致写入 | 失败直接抛出并回滚 |
| result-object | UI 可恢复操作 | 返回 `{ ok, data?, error? }` |
| background-report | 同步、清理、健康检查 | 记录状态并稍后重试或上报 |

不要吞掉迁移、事务提交、同步状态更新这类关键错误。

## 健康检查

可按需实现：

```sql
PRAGMA integrity_check;
PRAGMA quick_check;
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;
```

健康检查输出应包含：数据库大小估算、表/索引数量、关键 PRAGMA、慢查询摘要、最近迁移版本、最近同步错误。
