# SQLite 功能版本矩阵

SQLite 版本会影响可用语法。具体版本以 `SELECT sqlite_version();` 为准，wrapper 内置版本可能落后于系统或开发机。

| 能力 | 需要关注 |
|---|---|
| UPSERT `ON CONFLICT DO UPDATE` | 老版本不可用，需降级为先查再改或兼容写法 |
| window functions | 老版本不可用 |
| generated columns | 需确认版本，适合 JSON 派生列索引 |
| `RETURNING` | 老版本不可用，wrapper 也可能不支持返回结果 |
| `ALTER TABLE DROP COLUMN` | 较新版本才支持，复杂迁移仍建议重建表 |
| `STRICT` tables | 较新版本能力，不适合作为跨端默认假设 |
| JSON functions | 可能依赖编译选项或内置版本 |
| JSONB | 较新能力，不默认可用 |
| FTS5 | 依赖编译选项和虚表支持 |
| RTREE | 依赖编译选项 |

## 使用原则

- 文档中可说明 SQLite 官方支持某能力，但实现方案必须确认目标环境版本。
- migration 不应使用目标环境不支持的 DDL。
- 如需跨多个运行环境，优先选保守语法。
- 对新语法提供 fallback 或明确最低 SQLite 版本。
