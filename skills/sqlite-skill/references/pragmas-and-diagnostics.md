# PRAGMA 与诊断

PRAGMA 是 SQLite 的运行配置、元信息和诊断入口。不同 SQLite 版本、编译选项和宿主 wrapper 可能支持不同子集，执行后必须读取结果或做真实验证。

## 初始化类

```sql
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;
PRAGMA busy_timeout = 5000;
PRAGMA journal_mode;
PRAGMA synchronous;
```

注意：

- `foreign_keys` 通常每个连接都要设置并查询确认。
- `busy_timeout` 只能缓解锁等待，不能替代缩短事务和写入队列。
- `journal_mode` / `synchronous` 会影响性能、崩溃恢复和备份策略。

## 版本与迁移类

```sql
PRAGMA user_version;
PRAGMA user_version = 3;
PRAGMA application_id;
PRAGMA schema_version;
```

- `user_version` 适合轻量 schema migration。
- `application_id` 可用于识别应用数据库文件，但不要当安全校验。
- `schema_version` 是 SQLite 内部 schema 版本，通常不作为业务迁移版本。

## 诊断与维护类

```sql
PRAGMA integrity_check;
PRAGMA quick_check;
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;
PRAGMA optimize;
```

- `quick_check` 较快，适合常规健康检查。
- `integrity_check` 更完整，可能更耗时。
- 数据库大小可粗略估算为 `page_count * page_size`。
- `freelist_count` 偏高时可评估 `VACUUM`，但不要在用户关键路径执行。

## 能力探测

```sql
SELECT sqlite_version();
PRAGMA compile_options;
```

关注：`ENABLE_FTS5`、`ENABLE_JSON1`、SQLCipher、线程模式、默认页大小等。部分 wrapper 不暴露 `compile_options`，这时以宿主文档和真实环境验证为准。

## 风险

- PRAGMA 拼写错误或不支持时可能不会按预期报错。
- 有些 PRAGMA 只对当前连接生效。
- 生产环境不要随意修改 `synchronous`、`journal_mode`、`cache_size` 等配置。
- 诊断日志要脱敏，不输出完整业务 payload 或敏感参数。
