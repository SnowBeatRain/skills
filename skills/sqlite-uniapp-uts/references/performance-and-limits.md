# 性能与 Limits

本文件自包含 UTS 插件层性能与 limits 最小规则。若另有通用 SQLite skill，可参考其性能、limits 与批处理资料，但不要依赖外部路径。

## 插件层关注点

- 跨 UTS/native 边界调用有成本，批量写入不要逐条跨边界调用。
- 批处理接口应一次传入 statements，由 native 侧事务执行。
- 查询结果跨边界返回前必须限制行数和字段数。
- 大 BLOB 不建议存 SQLite；文件系统存文件，SQLite 存路径、hash、大小和同步状态。

## 推荐默认

- 慢查询阈值：可从 100ms 或项目配置开始。
- 批量写入分批：按参数数量、SQL 长度和事务耗时调整。
- 大查询必须分页：优先 keyset pagination，避免大 offset。

## 诊断指标

`healthCheck` 或 debug API 可输出：

- 数据库文件大小。
- page_count、page_size、freelist_count。
- 最近慢查询摘要。
- 最近 busy/locked 次数。
- migration 耗时。

