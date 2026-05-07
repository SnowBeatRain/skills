# 三端原生 API 对比

本文件只做架构对比。具体实现必须查目标版本官方文档和项目 wrapper。

| 维度 | Android | iOS | HarmonyOS |
|---|---|---|---|
| 常见底层能力 | `SQLiteOpenHelper` / `SQLiteDatabase` | SQLite C API `sqlite3_*` | RDB/关系型数据库能力或可用 SQLite wrapper |
| 连接管理 | helper + database handle | `sqlite3*` handle | store/helper/context 依赖目标 API |
| 参数绑定 | SQLiteStatement / rawQuery args | `sqlite3_bind_*` | 以 wrapper/API 为准 |
| 查询结果 | Cursor | step + column APIs | result set / cursor 形态以 API 为准 |
| 事务 | begin/setSuccessful/end | BEGIN/COMMIT/ROLLBACK 或 exec | transaction API 或 SQL 事务 |
| 资源释放 | close cursor/db | finalize statement + close db | close result/store/listener |
| 主要风险 | Cursor 泄漏、线程锁、路径 | finalize/close、类型映射 | API Level、UTS 编译边界、能力差异 |

## 统一适配目标

每端 Adapter 都要实现同一组能力：

- open/close
- execute/query
- transaction/batch
- parameter binding
- result mapping
- native error mapping
- capability detection
- health check

不能实现的能力必须在 `getCapabilities()` 中标记为 unsupported 或 unknown。

