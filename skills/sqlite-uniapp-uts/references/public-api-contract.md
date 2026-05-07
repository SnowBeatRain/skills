# 公共 API 契约

公共 API 要让业务层感知“一个稳定数据库插件”，而不是三套平台实现。API 名称可按项目风格调整，但语义必须一致。

## 目录

- 推荐能力
- 基础 DTO
- 查询与执行
- 关闭、版本与能力
- 事务与批处理
- API 规则

## 推荐能力

```ts
openDatabase(options: OpenDatabaseOptions): Promise<DatabaseHandle>
closeDatabase(options: CloseDatabaseOptions): Promise<void>
execute(options: ExecuteOptions): Promise<ExecuteResult>
query<T = Record<string, unknown>>(options: QueryOptions): Promise<QueryResult<T>>
transaction(options: TransactionOptions): Promise<TransactionResult>
batch(options: BatchOptions): Promise<BatchResult>
migrate(options: MigrateOptions): Promise<MigrationResult>
getUserVersion(options: DatabaseRef): Promise<number>
setUserVersion(options: SetUserVersionOptions): Promise<void>
getCapabilities(): Promise<CapabilityReport>
healthCheck(options: DatabaseRef): Promise<HealthReport>
```

## 基础 DTO

```ts
export type DatabaseId = string

export interface DatabaseRef {
  dbId: DatabaseId
}

export interface OpenDatabaseOptions {
  name: string
  path?: string
  sqlite?: SQLiteOpenOptions
  encryption?: EncryptionOptions
}

export interface SQLiteOpenOptions {
  foreignKeys?: boolean
  busyTimeoutMs?: number
  journalMode?: 'delete' | 'wal'
  synchronous?: 'full' | 'normal'
}

export interface EncryptionOptions {
  mode: 'none' | 'sqlcipher' | 'field-level' | 'platform'
  keyAlias?: string
}

export interface DatabaseHandle {
  dbId: DatabaseId
  name: string
  platform: 'android' | 'ios' | 'harmony'
}

export interface SqlStatement {
  sql: string
  params?: unknown[]
}
```

## 查询与执行

```ts
export interface ExecuteOptions extends DatabaseRef, SqlStatement {}

export interface ExecuteResult {
  rowsAffected: number
  lastInsertRowid?: number | string
  elapsedMs?: number
}

export interface QueryOptions extends DatabaseRef, SqlStatement {
  limit?: number
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  columns?: string[]
  elapsedMs?: number
}
```

## 关闭、版本与能力

```ts
export interface CloseDatabaseOptions extends DatabaseRef {}

export interface SetUserVersionOptions extends DatabaseRef {
  version: number
}

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

export interface HealthReport {
  ok: boolean
  userVersion?: number
  integrity?: 'ok' | 'failed' | 'unknown'
  pageCount?: number
  pageSize?: number
  databaseSizeBytes?: number
  openConnections?: number
  warnings?: string[]
}
```

## 事务与批处理

跨端最稳定的事务 API 是传入 statement 列表，由插件层控制同一连接和事务上下文：

```ts
export interface TransactionOptions extends DatabaseRef {
  statements: SqlStatement[]
  mode?: 'deferred' | 'immediate' | 'exclusive'
}

export interface TransactionResult {
  statements: ExecuteResult[]
  elapsedMs?: number
}

export interface BatchOptions extends DatabaseRef {
  statements: SqlStatement[]
  transaction?: boolean
  chunkSize?: number
}

export interface BatchResult {
  results: ExecuteResult[]
  elapsedMs?: number
}

export interface Migration {
  version: number
  statements: SqlStatement[]
}

export interface MigrateOptions extends DatabaseRef {
  migrations: Migration[]
}

export interface MigrationResult {
  fromVersion: number
  toVersion: number
  appliedVersions: number[]
  elapsedMs?: number
}
```

如果提供 callback 事务，要确认 UTS 三端异步调用、错误传播和事务上下文都可靠。否则优先用 statement-list 事务。

## API 规则

- `sql` 只接受 SQLite 兼容 SQL。
- `params` 只绑定值，不绑定表名、列名、排序方向。
- DDL、DML、SELECT 可分接口，也可通过 execute/query 区分。
- 不允许业务层直接拿到 native connection、cursor、statement。
- 大结果集必须分页或限制。
- `sqlite` 只接受白名单配置，不暴露任意 `pragmas: Record<string, ...>`；PRAGMA 名称和值不得由外部输入拼接，`journalMode` 设置后必须读取返回值确认。
- `encryption` 只是能力请求；只有 `getCapabilities().platforms[currentPlatform].encryption` 明确为 `supported`、`field-level` 或 `platform` 且平台实现已验证时才可启用。默认 `mode: 'none'`，不能因为业务传参就假装加密；`keyAlias` 是安全存储中的密钥别名，不是明文 key。
- `transaction()` / `batch({ transaction: true })` 的 `statements` 禁止包含 `BEGIN`、`COMMIT`、`ROLLBACK`、未受控 `SAVEPOINT`、`PRAGMA foreign_keys = OFF` 等事务/连接控制 SQL；插件层应在开发模式检测并拒绝。
