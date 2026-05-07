# FTS5 与本地搜索

普通 `LIKE '%keyword%'` 通常无法利用普通 B-tree 索引。大量全文搜索可评估 FTS5，但必须先确认 SQLite 版本、编译选项和 wrapper 支持。

## 能力检查

```sql
SELECT sqlite_version();
PRAGMA compile_options;
```

查找是否包含 `ENABLE_FTS5`。不支持时应降级为服务端搜索、宿主搜索能力、前缀查询或小数据量 LIKE。

## 基础虚表

如果业务主键是 `TEXT` / UUID / `local_id`，先保留一个整数代理键用于 FTS `rowid` 映射：

```sql
CREATE TABLE notes (
  rowid_int INTEGER PRIMARY KEY,
  local_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT
);

CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  tokenize = 'unicode61'
);

-- FTS5 rowid 必须是整数 rowid。若业务主键是 TEXT/UUID/local_id，
-- 需要额外维护 INTEGER PRIMARY KEY 代理键用于 FTS rowid 映射。
INSERT INTO notes_fts(rowid, title, content)
SELECT rowid_int, title, content FROM notes;

SELECT rowid, rank
FROM notes_fts
WHERE notes_fts MATCH ?
ORDER BY rank
LIMIT ?;
```

注意：FTS5 的 `rowid` 永远是整数；不要把 `id TEXT PRIMARY KEY`、`local_id TEXT`、UUID 等业务主键直接写入 `rowid`。如果业务表主键不是整数，常见做法是在业务表增加独立的 `INTEGER PRIMARY KEY` 代理键（如 `rowid_int`），FTS 查询返回整数 rowid 后再回表取业务主键。

## External Content

业务表保留权威数据，FTS 表只保留索引：

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid_int'
);
```

`content_rowid` 指向的列也必须是整数 rowid 语义；不要指向 TEXT 业务主键。

需要维护业务表与 FTS 索引同步，可用触发器或应用层事务。触发器能力也要确认 wrapper 支持。

## 中文与 tokenizer

- 默认 tokenizer 对中文分词有限，可能只能按字符或连续文本匹配。
- 需要高质量中文搜索时，评估宿主 tokenizer、服务端搜索或专门搜索引擎。
- 不要承诺 FTS5 能直接满足所有中文分词、拼音、同义词、排序需求。

## 维护

- 批量导入后可重建 FTS 索引。
- 删除/软删除业务数据时，同步处理 FTS 表。
- 搜索结果仍要回表校验权限、租户、软删除和同步状态。

## rowid 与 TEXT 主键

FTS5 的 `rowid` / `content_rowid` 是整数 rowid 语义。若业务表主键是 `TEXT` UUID 或 `local_id TEXT PRIMARY KEY`，不要直接映射到 FTS `rowid`。

可选方案：

- 业务表增加 `id INTEGER PRIMARY KEY` 作为 surrogate key，另保留 `local_id TEXT UNIQUE`。
- 单独维护 TEXT id 与整数 rowid 的映射表。
- 不使用 external content，应用层在同一事务中维护 FTS 表。

external content 表的 `content_rowid` 应指向稳定的 `INTEGER PRIMARY KEY` 列。
