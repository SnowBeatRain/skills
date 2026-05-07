# JSON 与 Generated Columns

SQLite 可通过 JSON1 / JSONB 处理 JSON，但支持情况依赖 SQLite 版本、编译选项和宿主 wrapper。JSON 适合扩展字段，不应替代核心 schema。

## 能力与版本

- JSON1 提供 `json_extract`、`json_set`、`json_each` 等函数。
- `->`、`->>` 操作符依赖较新 SQLite。
- JSONB 是更新版本能力，不要默认存在。

先检测：

```sql
SELECT sqlite_version();
PRAGMA compile_options;
```

`PRAGMA compile_options` 中不出现 `ENABLE_JSON1` 不等于 JSON 不可用：SQLite 3.38.0 起 JSON 函数默认内建，且宿主 wrapper 也可能隐藏或裁剪编译选项。必须用实际函数 smoke test 判断：

```sql
SELECT json_valid('{"a":1}');
SELECT json_extract('{"a":1}', '$.a');
```

JSONB 是独立能力，不要用 JSON1 smoke test 推断 JSONB 可用；需要使用项目实际会调用的 `jsonb_*` 函数另做 smoke test，并准备降级为 TEXT JSON。

## 常见查询

```sql
SELECT json_extract(extra, '$.priority') AS priority
FROM tasks
WHERE json_extract(extra, '$.priority') = ?;
```

频繁过滤、排序、JOIN、约束的字段应独立成列。

## Generated Column + Index

如果版本支持，可把 JSON 路径暴露为生成列并建索引：

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  event_type TEXT GENERATED ALWAYS AS (json_extract(payload, '$.type')) STORED
);

CREATE INDEX idx_events_event_type ON events(event_type);
```

旧版本或 wrapper 不支持 generated columns 时，使用普通列冗余关键字段，并在应用层维护。

## 迁移与约束

- JSON 字段结构变化要有迁移策略。
- 可用 `CHECK (json_valid(payload))` 约束有效 JSON，但仍需确认函数支持。
- 不要把敏感 payload 整包写入日志。

## 何时避免 JSON

- 字段参与高频查询、排序、唯一约束或外键关系。
- 需要强类型校验或复杂迁移。
- 需要跨宿主稳定兼容但 JSON 能力不确定。

## JSON 能力检测注意

不要只依赖 `PRAGMA compile_options` 中是否出现 `ENABLE_JSON1`。SQLite 3.38.0 起 JSON 函数通常默认内置，可能没有该编译选项。优先执行 smoke test：

```sql
SELECT json_valid('{"a":1}');
SELECT json_extract('{"a":1}', '$.a');
```

JSONB 需要单独测试，例如目标环境是否支持 `jsonb()`；不要把 JSON1 可用等同于 JSONB 可用。
