# 公共 API 契约

公共 API 要让业务层感知“一个稳定数据库插件”，而不是三套平台实现。API 名称可按项目风格调整，但语义必须一致。

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
  encrypted?: boolean
  keyAlias?: string
  pragmas?: Record<string, string | number | boolean>
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
  platforms: Record<string, unknown>
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
