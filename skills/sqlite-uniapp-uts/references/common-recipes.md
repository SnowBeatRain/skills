# 常用方案

## 最小 DAO

```ts
export class NoteDao {
  constructor(private dbId: string) {}

  async create(note: { id: string; title: string; createdAt: number }) {
    return execute({
      dbId: this.dbId,
      sql: 'INSERT INTO notes(id, title, created_at) VALUES (?, ?, ?)',
      params: [note.id, note.title, note.createdAt]
    })
  }

  async list(limit: number) {
    return query({
      dbId: this.dbId,
      sql: 'SELECT id, title, created_at FROM notes ORDER BY created_at DESC LIMIT ?',
      params: [limit]
    })
  }
}
```

## 初始化流程

```text
openDatabase
  -> getCapabilities
  -> enable/confirm required PRAGMA
  -> migrate
  -> healthCheck optional
  -> hand dbId to DAO
```

## 同步写入事务

业务数据和 outbox 同事务写入：

```ts
await transaction({
  dbId,
  statements: [
    { sql: 'UPDATE tasks SET title = ?, sync_status = ? WHERE id = ?', params: [title, 'pending', id] },
    { sql: 'INSERT INTO outbox(id, type, payload) VALUES (?, ?, ?)', params: [eventId, 'task.update', payload] }
  ]
})
```

## 能力降级

```text
需要全文搜索
  -> getCapabilities().fts5 supported?
    -> yes: 使用 FTS5
    -> no: 使用普通索引 + LIKE 前缀搜索，或禁用高级搜索
```

