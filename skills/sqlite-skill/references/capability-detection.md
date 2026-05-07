# 能力检测

在编写 SQLite 方案前，先确认“这个运行环境里的 SQLite 到底支持什么”。SQLite 语法、编译选项、wrapper 暴露能力三者可能不一致。

## 基础检测

```sql
SELECT sqlite_version();
PRAGMA compile_options;
PRAGMA foreign_keys;
PRAGMA journal_mode;
```

如果 wrapper 不允许执行某些 PRAGMA，应查 wrapper 文档并做真机/真实环境验证。

## 常见能力检测

| 能力 | 检测/验证方式 | 说明 |
|---|---|---|
| 外键 | `PRAGMA foreign_keys;` | 每个连接都要确认 |
| WAL | `PRAGMA journal_mode = WAL;` 后读取返回值 | 返回值不是 `wal` 就不能视为启用 |
| JSON1/JSONB | `SELECT json_valid('{}');`，必要时查 `compile_options` | JSONB 依赖较新 SQLite |
| FTS5 | 尝试 `CREATE VIRTUAL TABLE t USING fts5(x);` | wrapper 可能禁用虚表 |
| RTREE | 尝试 `CREATE VIRTUAL TABLE r USING rtree(...)` | 适合空间索引 |
| STRICT table | 尝试 `CREATE TABLE t(x TEXT) STRICT;` | 依赖 SQLite 版本 |
| RETURNING | 尝试 `INSERT ... RETURNING ...` | 老版本不可用 |
| generated columns | 尝试 `GENERATED ALWAYS AS` | 依赖版本 |
| SQLCipher | 查 wrapper/驱动文档，测试 key PRAGMA | SQLite 官方本身不加密 |

## wrapper 能力核查

- 是否支持参数绑定，而不是只能拼接 SQL。
- 是否暴露事务 API，事务中是否共用同一连接。
- 是否能返回 SQLite 错误码和错误消息。
- 是否支持批量执行、prepared statement、statement reset/finalize。
- 是否支持 backup API、WAL checkpoint、extension loading。
- 是否有线程/队列限制。

## 结论写法

不要写“SQLite 支持 X 所以本项目可用 X”。应写：

```text
SQLite 官方支持 X；当前宿主需通过 version/compile_options/wrapper API/真实环境验证后才能使用。
```
