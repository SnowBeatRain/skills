# 性能优化

SQLite 性能问题通常来自无索引查询、大 offset 分页、批量写入未使用事务、查询返回过多字段或数据库文件膨胀。

## 基础原则

- 只查询需要的列，避免 `SELECT *`。
- 高频查询字段加索引。
- 批量写入使用事务。
- 大列表分页加载。
- 图片、音频、文件存文件系统，SQLite 存元信息。
- 长事务中不要夹杂网络请求。

## 查询计划

```sql
EXPLAIN QUERY PLAN
SELECT local_id, title
FROM notes
WHERE sync_status = ?
ORDER BY updated_at DESC
LIMIT 20;
```

关注是否出现全表扫描。根据查询条件设计索引。

## 分页

大 offset 会越来越慢：

```sql
SELECT * FROM notes ORDER BY updated_at DESC LIMIT 20 OFFSET 10000;
```

更推荐 keyset pagination：

```sql
SELECT local_id, title, updated_at
FROM notes
WHERE updated_at < ?
ORDER BY updated_at DESC
LIMIT ?;
```

## LIKE

`LIKE '%keyword%'` 通常难以利用普通索引。大量本地搜索可调研 FTS5，但宿主 SQLite 编译不一定启用 FTS5，必须确认插件和平台支持。

## 批量写入

```sql
BEGIN TRANSACTION;
-- many inserts / updates
COMMIT;
```

服务端增量同步落库时，建议一批数据一个事务，并控制单批大小。

## 维护命令

```sql
PRAGMA optimize;
ANALYZE;
VACUUM;
PRAGMA integrity_check;
```

`VACUUM` 可能耗时和占用额外空间，不要在用户关键路径随意执行。

## WAL

WAL 可改善读写并发，但需要实测平台支持和备份策略。小库、低并发场景不必过度调优。
