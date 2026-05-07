# 发布与使用文档

插件交付文档要面向使用者说明“怎么用、支持什么、不支持什么、如何验证”，不要只写安装步骤。

## 必备文档内容

- 支持平台和最低版本。
- 公共 API 列表和类型。
- 能力矩阵。
- 错误码表。
- migration 使用方式。
- 事务和批处理示例。
- 安全与隐私说明。
- 已知限制和 fallback。

## 示例结构

```ts
const db = await openDatabase({ name: 'app.db' })

await execute({
  dbId: db.dbId,
  sql: 'CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, title TEXT NOT NULL)'
})

await execute({
  dbId: db.dbId,
  sql: 'INSERT INTO notes(id, title) VALUES (?, ?)',
  params: ['n1', 'hello']
})

const result = await query({
  dbId: db.dbId,
  sql: 'SELECT id, title FROM notes WHERE id = ?',
  params: ['n1']
})
```

## 版本说明

破坏性变更必须说明：

- API 改名或返回结构改变。
- 错误码改变。
- 最低平台版本改变。
- migration 行为改变。
- BLOB、INTEGER、Date 映射改变。

