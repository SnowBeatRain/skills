# SQLite 数据类型与 Affinity

SQLite 使用动态类型。类型更多附着在值上，而不是严格固定在列上。列声明会影响 type affinity，但不会等同于传统强类型数据库。

## Storage Classes

SQLite 值的存储类别：

- `NULL`
- `INTEGER`
- `REAL`
- `TEXT`
- `BLOB`

## Type Affinity

列亲和性通常为：

- `TEXT`
- `NUMERIC`
- `INTEGER`
- `REAL`
- `BLOB`

例如 `VARCHAR(20)` 通常是 TEXT affinity，但 SQLite 不会自动限制 20 个字符。需要限制长度时使用：

```sql
name TEXT NOT NULL CHECK (length(name) <= 20)
```

## 布尔值

SQLite 没有独立布尔存储类，推荐用 `INTEGER` 的 `0/1`：

```sql
completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1))
```

## 日期时间

常见存储方式：

```text
TEXT     ISO-8601，如 2026-05-07T12:00:00Z
INTEGER  Unix timestamp，建议明确秒或毫秒
REAL     Julian day
```

本地/端侧场景建议统一使用 UTC ISO 字符串或 Unix 毫秒时间戳。不要存本地时区格式字符串；跨端同步时明确单位（秒/毫秒）和时区。服务端同步游标不要只依赖客户端本地时间，避免设备时间漂移导致漏同步或乱序。

## STRICT tables

较新 SQLite 支持 `STRICT` 表来增强类型约束，但宿主内置 SQLite 版本不一定支持。跨端 skill 输出时不要默认可用，应先确认运行环境 SQLite 版本。

## JSON 字段

SQLite 可支持 JSON 函数，但依赖版本和编译选项。核心查询字段不要全部塞进 JSON；需要检索、排序、约束的字段应独立成列。
