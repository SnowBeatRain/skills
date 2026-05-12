# SQLite 功能版本矩阵

SQLite 版本会影响可用语法。具体版本以 `SELECT sqlite_version();` 为准，wrapper 内置版本可能落后于系统或开发机；编译选项和 wrapper 暴露能力也可能进一步限制功能。

| 能力 | 常见最低版本 / 条件 | 注意 |
|---|---|---|
| UPSERT `ON CONFLICT DO UPDATE` | 3.24.0 | 老版本需降级为先查再改或兼容写法 |
| Window functions | 3.25.0 | 分析查询可用，端侧大数据仍需评估性能 |
| `ALTER TABLE RENAME COLUMN` | 3.25.0 | wrapper/宿主可能限制 DDL |
| `VACUUM INTO` | 3.27.0 | 需要额外磁盘空间 |
| Generated columns | 3.31.0 | 适合 JSON 派生列索引 |
| Host parameters 默认上限提升 | 3.32.0 后默认 32766；旧版本常见 999 | 仍以实际编译限制为准 |
| `ALTER TABLE DROP COLUMN` | 3.35.0 | 复杂迁移仍建议重建表 |
| `RETURNING` | 3.35.0 | wrapper 可能不返回结果集 |
| STRICT tables | 3.37.0 | 不适合作为跨宿主默认假设 |
| JSON `->` / `->>` | 3.38.0 | JSON 函数可能默认内置，不一定出现 `ENABLE_JSON1` |
| JSONB | 3.45.0 | 不默认可用，需 smoke test |
| JSON5 extensions | 3.46.0 | JSON 解析增强，支持 JSON5 语法（尾随逗号、单行注释等） |
| `SQLITE_DBCONFIG_STMT_SCANSTATUS` | 3.46.0 | 语句扫描状态监控，用于性能分析 |
| `SQLITE_DBCONFIG_REVERSE_SCANORDER` | 3.46.0 | 反向扫描顺序控制 |
| `SQLITE_CONFIG_LOG` after init | 3.46.0 | 允许在 `sqlite3_initialize()` 后调用 |
| `SQLITE_CONFIG_PCACHE_HDRSZ` after init | 3.46.0 | 允许在 `sqlite3_initialize()` 后调用 |
| 增强的 JSON SQL 函数 | 3.46.0+ | 支持 JSON5 扩展语法 |
| FTS5 | 编译选项/虚表支持 | 需 `CREATE VIRTUAL TABLE ... USING fts5` 验证 |
| RTREE | 编译选项/虚表支持 | 空间索引场景再启用 |

## SQLite 3.46+ 详细说明

### JSON5 扩展支持

SQLite 3.46.0 起支持 JSON5 语法扩展：

```sql
-- JSON5 允许的扩展语法示例
SELECT json_extract('[1, 2, 3,]', '$');  -- 尾随逗号
SELECT json_extract('{a: 1}', '$.a');     -- 无引号键名
SELECT json_extract('[1, 2, /* comment */ 3]', '$');  -- 注释
```

**注意：** 需要 wrapper 明确支持，且目标环境 SQLite 版本 >= 3.46.0。

### 新增 sqlite3_db_config 选项

```c
// 语句扫描状态（性能分析用）
sqlite3_db_config(db, SQLITE_DBCONFIG_STMT_SCANSTATUS, 1, 0);

// 反向扫描顺序
sqlite3_db_config(db, SQLITE_DBCONFIG_REVERSE_SCANORDER, 1, 0);
```

### 配置调用时序放宽

```c
// 3.46.0 前必须在 sqlite3_initialize() 前调用
// 3.46.0+ 允许在 sqlite3_initialize() 后调用
sqlite3_config(SQLITE_CONFIG_LOG, log_callback, 0);
sqlite3_config(SQLITE_CONFIG_PCACHE_HDRSZ, &hdrsz);
```

## 使用原则

- 文档中可说明 SQLite 官方支持某能力，但实现方案必须确认目标环境版本、编译选项和 wrapper API。
- migration 不应使用目标环境不支持的 DDL。
- 如需跨多个运行环境，优先选保守语法。
- 对新语法提供 fallback 或明确最低 SQLite 版本。
