# FTS5 与本地搜索

普通 `LIKE '%keyword%'` 通常无法利用普通 B-tree 索引。大量全文搜索可评估 FTS5，但必须先确认 SQLite 版本、编译选项和 wrapper 支持。

## 能力检查

```sql
SELECT sqlite_version();
PRAGMA compile_options;
```

查找是否包含 `ENABLE_FTS5`。不支持时应降级为服务端搜索、宿主搜索能力、前缀查询或小数据量 LIKE。

## 基础虚表

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  tokenize = 'unicode61'
);

INSERT INTO notes_fts(rowid, title, content)
SELECT id, title, content FROM notes;

SELECT rowid, rank
FROM notes_fts
WHERE notes_fts MATCH ?
ORDER BY rank
LIMIT ?;
```

## External Content

业务表保留权威数据，FTS 表只保留索引：

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='id'
);
```

需要维护业务表与 FTS 索引同步，可用触发器或应用层事务。触发器能力也要确认 wrapper 支持。

## 中文与 tokenizer

- 默认 tokenizer 对中文分词有限，可能只能按字符或连续文本匹配。
- 需要高质量中文搜索时，评估宿主 tokenizer、服务端搜索或专门搜索引擎。
- 不要承诺 FTS5 能直接满足所有中文分词、拼音、同义词、排序需求。

## 维护

- 批量导入后可重建 FTS 索引。
- 删除/软删除业务数据时，同步处理 FTS 表。
- 搜索结果仍要回表校验权限、租户、软删除和同步状态。
