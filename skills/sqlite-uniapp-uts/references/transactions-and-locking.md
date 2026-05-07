# 事务与锁

本文件自包含 UTS 插件事务与锁的最小规则：事务必须同一连接/同一 store、失败回滚、写入串行化、busy/locked 有限重试。若另有通用 SQLite skill，可参考其更完整并发资料。

## 插件层要求

- `transaction` 必须由插件层控制 begin/commit/rollback。
- 事务内所有 statements 必须复用同一连接或 store。
- 任意 statement 失败时回滚，并返回统一错误。
- migration、批量导入、outbox 写入必须事务化。

## 事务 API 形态

优先 statement-list：

```ts
await transaction({
  dbId,
  statements: [
    { sql: 'INSERT INTO notes(id, title) VALUES (?, ?)', params: [id, title] },
    { sql: 'INSERT INTO outbox(id, payload) VALUES (?, ?)', params: [eventId, payload] }
  ]
})
```

callback 事务只有在三端 UTS 异步、异常传播和事务上下文都可靠时再提供。

## 锁处理

- 设置或模拟 busy timeout 前必须确认平台支持。
- 长事务记录耗时并可诊断。
- 后台同步和 UI 写入需要串行写队列。
- 对 busy/locked 可做有限退避重试；对 constraint/misuse/corrupt 不盲目重试。

## 禁止事务控制 SQL

`transaction()` 的 statement-list 由插件层统一包裹事务，业务传入的 statements 禁止包含：

- `BEGIN`
- `COMMIT`
- `ROLLBACK`
- 未受控 `SAVEPOINT` / `RELEASE` / `ROLLBACK TO`
- `PRAGMA foreign_keys = OFF` 等会改变连接/事务语义的控制语句

需要局部回滚时，应设计受控 savepoint API；不支持时明确返回 unsupported，不要允许业务自行混入事务控制 SQL。
