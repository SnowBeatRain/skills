---
name: sqlite-skill
description: 用于平台中立的 SQLite 数据层设计与审查，包括 schema、SQL、migration、事务、索引、PRAGMA/WAL/FTS/JSON、同步持久化、备份恢复、limits 和安全。当用户明确提到 SQLite/sqlite，或需要判断本地关系型数据库是否适合 SQLite 时使用；不要用于未指定 SQLite 的 IndexedDB、localStorage、key-value storage 或服务端数据库任务。
---

# SQLite Skill

## 意图

帮助 Agent 独立处理 SQLite 相关的数据层问题：数据库设计、SQL 编写、迁移、事务、索引、同步、性能、安全和可靠性。

本 skill **只负责 SQLite 与离线数据工程本身**。如果业务项目还涉及具体框架、端平台、插件封装或 UI 工程，由用户主动指定或另行调用对应能力；本 skill 不主动耦合其他 skill。

如果用户明确指定要做 uni-app / UTS 的三端 SQLite 插件，可另行使用 `sqlite-uniapp-uts` 处理插件工程与平台 Adapter；本 skill 只提供 SQLite 数据层规则。

## 触发场景

- SQLite 建表、查询、索引、事务、迁移、`PRAGMA`、`EXPLAIN QUERY PLAN`。
- 本地数据库、离线缓存、offline-first、同步队列、软删除、冲突处理。
- SQLite 性能、安全、SQL 注入、敏感数据、数据库文件、备份恢复、多账号隔离。
- 需要设计 DAO、Repository、LocalDatabase adapter、QueryBuilder、sync engine、migration runner、health check。
- 需要判断 SQLite 与 IndexedDB、WebSQL、localStorage、文件存储或服务端数据库的边界。

## 非目标

- 不负责具体业务框架的页面、组件、路由、构建、插件封装或平台 API 细节。
- 不默认任何运行端支持 SQLite；只给 SQLite 数据层方案与能力核查清单。
- 不把浏览器、移动端、桌面端、后端脚本、嵌入式设备混为同一运行环境。
- 不写完整 SQLite 教程；细节按需读取 references。

## 维护与复用约定

本 skill 遵循仓库 README 的通用规范：中文优先、自包含、渐进式披露、验证再交付。修改或分发本 skill 时读取 `references/repository-usage.md`；只复制/打包整个 `skills/sqlite-skill/` 目录，不只复制 `SKILL.md`。

## 核心原则

1. 先确认运行环境：SQLite CLI、Node、移动端 wrapper、桌面端、浏览器 WASM、后端脚本或其他宿主。
2. 先确认 SQLite 版本、编译选项、wrapper 暴露能力、文件系统限制和测试环境。
3. 先确认数据规模、读写频率、同步方式、账号/租户隔离、隐私等级和冲突策略。
4. SQL 示例必须使用 SQLite 兼容语法；不确定宿主 API 时只给通用 SQL 与架构，并说明以具体 wrapper 文档为准。
5. 外部输入必须参数化；动态表名、列名、排序字段必须白名单化。
6. 离线功能必须同时考虑初始化、迁移、事务、同步队列、软删除、重试、冲突和状态恢复。
7. SQLite 不是加密存储；敏感数据默认不明文落库。
8. `PRAGMA foreign_keys = ON` 需每个连接启用并查询确认；PRAGMA 拼错可能被静默忽略。
9. 不把 `INSERT OR REPLACE` / `REPLACE INTO` 当安全 upsert；优先考虑 `ON CONFLICT DO UPDATE` 并确认 SQLite 版本。
10. 不滥用 `AUTOINCREMENT`；先理解 `INTEGER PRIMARY KEY`、rowid、NULL、布尔值和类型亲和性。
11. WAL、FTS5、JSON1/JSONB、SQLCipher、STRICT table、`RETURNING`、backup API 不承诺在所有运行环境可用，必须检测版本/编译选项/wrapper 能力。
12. 对跨宿主项目，只定义平台中立 Adapter 契约；具体平台 API、插件封装和条件编译由用户另行指定。

## 工作流

### 1. 运行环境与能力核查

读取 `references/overview.md`、`references/runtime-boundaries.md`、`references/pragmas-and-diagnostics.md`。

1. 确认宿主环境、SQLite 版本、扩展支持和 wrapper API。
2. 区分 SQLite、IndexedDB、WebSQL、key-value storage、文件存储、服务端 RDBMS。
3. 确认数据库文件路径、沙盒/权限、备份、升级、低磁盘空间和崩溃恢复限制。
4. 执行或规划能力探测：SQLite 版本、编译选项、关键 PRAGMA、扩展模块和 wrapper 限制。

### 2. Schema / 建表设计

读取 `references/schema-design.md`、`references/data-types-and-affinity.md`、`references/constraints-and-indexes.md`。

1. 明确实体、字段、主键、唯一约束、外键、时间格式和生命周期。
2. 离线同步场景区分本地 id、服务端 id、客户端幂等 key。
3. 设计 `sync_status`、`deleted_at`、`version`、`created_at`、`updated_at` 等字段。
4. 为高频 `WHERE`、`JOIN`、`ORDER BY` 字段添加索引。
5. 输出 `CREATE TABLE`、`CREATE INDEX` 和迁移说明。

### 3. Adapter / DAO / SQL 编写与优化

读取 `references/adapters-and-api-contracts.md`、`references/querybuilder-and-dao.md`、`references/sql-basics.md`、`references/performance.md`。涉及全文搜索、JSON 或批处理时再读取 `references/fts5-and-search.md`、`references/json-and-generated-columns.md`、`references/limits-and-batching.md`。

1. 判断 SQL 类型：DDL、DML、查询、事务或诊断。
2. 需要跨宿主时，先给最小 `LocalDatabase` 契约，再实现 DAO / Repository。
3. 使用参数绑定占位符，不拼接用户输入。
4. 动态排序、列名和表名必须白名单化；QueryBuilder 只生成受控 SQL 片段。
5. 对复杂查询说明索引、分页和查询计划。
6. 批量写入必须放在事务中。
7. 警惕 `LIKE '%xxx%'`、大偏移 `OFFSET`、未分页全表读。

### 4. 数据迁移

读取 `references/migrations.md`。

1. 用 `PRAGMA user_version` 或 `schema_migrations` 管理版本。
2. 从旧版本顺序升级到最新版，迁移放事务中。
3. 复杂表结构变更使用建新表、复制、删旧表、重命名、重建索引模式。
4. 覆盖新装建库、旧库升级、重复启动、迁移失败恢复。

### 5. 离线同步

读取 `references/sync-patterns.md`、`references/common-recipes.md`。

1. 明确同步方向、同步粒度、幂等 key、软删除和冲突策略。
2. 本地业务写入和 outbox/sync queue 状态更新放在同一事务。
3. 网络恢复后先处理待上传，再拉取远端增量，避免覆盖本地未同步数据。
4. 设计失败重试、重复提交、部分成功、崩溃恢复和用户可见状态。

### 6. 安全与可靠性

读取 `references/security.md`、`references/transactions-and-concurrency.md`、`references/backup-and-restore.md`、`references/pitfalls.md`。

1. 参数化查询、防注入、动态标识符白名单、日志脱敏。
2. 多用户/多租户数据隔离，退出登录和切换账号时清理敏感缓存。
3. 需要加密时调研 SQLCipher、系统安全存储或宿主平台安全能力。
4. 关注 SQLite 单写多读、WAL、锁等待、崩溃恢复和备份一致性。

## References

| 场景 | 读取 |
|---|---|
| SQLite 总览 | `references/overview.md` |
| 运行环境边界 | `references/runtime-boundaries.md` |
| Adapter 与 API 契约 | `references/adapters-and-api-contracts.md` |
| 连接生命周期 | `references/connection-lifecycle.md` |
| Statement 与参数绑定 | `references/statement-and-binding.md` |
| 结果集映射 | `references/result-set-mapping.md` |
| 统一错误模型 | `references/error-model.md` |
| DAO / QueryBuilder | `references/querybuilder-and-dao.md` |
| PRAGMA 与诊断 | `references/pragmas-and-diagnostics.md` |
| SQL 基础 | `references/sql-basics.md` |
| 表结构设计 | `references/schema-design.md` |
| 数据类型 | `references/data-types-and-affinity.md` |
| 约束与索引 | `references/constraints-and-indexes.md` |
| 事务与并发 | `references/transactions-and-concurrency.md` |
| 备份与恢复 | `references/backup-and-restore.md` |
| 数据库迁移 | `references/migrations.md` |
| 性能优化 | `references/performance.md` |
| FTS5 与搜索 | `references/fts5-and-search.md` |
| JSON 与生成列 | `references/json-and-generated-columns.md` |
| Limits 与批处理 | `references/limits-and-batching.md` |
| 同步模式与冲突 | `references/sync-patterns.md` |
| 安全 | `references/security.md` |
| 常用模板 | `references/common-recipes.md` |
| 避坑 | `references/pitfalls.md` |
| 官方文档索引 | `references/official-docs-map.md` |
| 能力检测 | `references/capability-detection.md` |
| C API 与 wrapper 映射 | `references/c-api-and-wrappers.md` |
| sqlite3 CLI | `references/cli.md` |
| 错误码与诊断 | `references/errors-and-diagnostics.md` |
| 功能版本矩阵 | `references/feature-matrix.md` |
| 测试检查清单 | `references/testing.md` |
| 仓库复用与维护 | `references/repository-usage.md` |

## 交付检查清单

- [ ] 已确认宿主环境、SQLite wrapper/API、版本、编译选项和扩展支持。
- [ ] 跨宿主项目已隔离平台中立 Adapter 契约与具体平台实现。
- [ ] 已区分 SQLite、IndexedDB、WebSQL、key-value storage、文件存储、服务端数据库。
- [ ] 已覆盖新装建库、旧库升级、重复启动、迁移失败恢复。
- [ ] 已验证事务回滚、同步重复提交、软删除、冲突和网络失败重试。
- [ ] 已评估数据库文件路径、权限、备份、卸载/清理、升级、低磁盘空间。
- [ ] 已确认 SQL 参数绑定、动态标识符白名单、DAO 事务边界和日志脱敏。
- [ ] 已规划健康检查：`integrity_check` / `quick_check`、数据库大小、关键 PRAGMA、慢查询和最近同步错误。
- [ ] 已评估备份恢复、WAL/checkpoint、limits/批处理、FTS5/JSON 等能力是否被宿主支持。
- [ ] 已规划目标宿主的真实环境验证，不用模拟环境替代关键端侧验证。
