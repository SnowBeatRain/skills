# SQLite 官方文档索引

以 SQLite 官网为规范来源：<https://www.sqlite.org/docs.html>。第三方教程只作入门补充。

## 常用官方主题

- 文档总览：<https://www.sqlite.org/docs.html>
- SQL 语法总览：<https://www.sqlite.org/lang.html>
- CREATE TABLE：<https://www.sqlite.org/lang_createtable.html>
- Transactions：<https://www.sqlite.org/lang_transaction.html>
- ON CONFLICT：<https://www.sqlite.org/lang_conflict.html>
- CREATE INDEX：<https://www.sqlite.org/lang_createindex.html>
- UPSERT：<https://www.sqlite.org/lang_upsert.html>
- Foreign Keys：<https://www.sqlite.org/foreignkeys.html>
- PRAGMA：<https://www.sqlite.org/pragma.html>
- Date/Time Functions：<https://www.sqlite.org/lang_datefunc.html>
- JSON Functions：<https://www.sqlite.org/json1.html>
- FTS5：<https://www.sqlite.org/fts5.html>
- WAL：<https://www.sqlite.org/wal.html>
- Backup：<https://www.sqlite.org/backup.html>
- Limits：<https://www.sqlite.org/limits.html>

## 能力检测

开发前优先确认 SQLite 版本、编译选项和关键 PRAGMA 的真实状态：

```sql
SELECT sqlite_version();
PRAGMA compile_options;
PRAGMA foreign_keys;
PRAGMA journal_mode;
```

部分宿主 wrapper 可能不暴露 `PRAGMA compile_options` 或扩展模块信息；这时以插件文档和真机验证为准。不要默认 WAL、FTS5、JSON1/JSONB、SQLCipher 在所有端可用。

## 第三方资料取舍

- 菜鸟教程 SQLite CREATE TABLE：适合作中文入门，关键语义以 SQLite 官方文档为准。
- 公开 SQLite skill：可吸收参数化、事务、migration、WAL、FTS、安全、测试等原则；不要照搬偏 Rust/Tauri/rusqlite 的依赖和代码。
