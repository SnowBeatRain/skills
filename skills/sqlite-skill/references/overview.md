# SQLite 总览

SQLite 是嵌入式 SQL 数据库引擎，官方入口是 <https://www.sqlite.org/>。它不需要独立服务进程，数据库通常就是一个本地文件，适合移动端、桌面端、嵌入式设备、本地缓存、离线表单、测试数据和中小规模结构化存储。

## 适用场景

- 本地离线数据库。
- 本地缓存、草稿箱、工单、巡检、库存、表单采集。
- 单用户或少量连接访问的结构化数据。
- 需要事务、一致性、索引和 SQL 查询能力的端侧数据。
- 测试环境、CLI 工具、小型服务的本地持久化。

## 不适用场景

- 高并发多写入服务端数据库。
- 多租户远程网络数据库服务。
- 需要复杂权限、存储过程、内置用户管理的大型数据库。
- 多台机器同时写同一个数据库文件。

## 和 MySQL/PostgreSQL 的关键差异

| 维度 | SQLite | MySQL/PostgreSQL |
|---|---|---|
| 部署 | 嵌入式、单文件 | 独立服务 |
| 并发 | 多读、通常单写 | 多连接并发读写 |
| 类型 | 动态类型 + affinity | 更强类型约束 |
| 权限 | 依赖文件和应用权限 | 数据库用户/角色 |
| 场景 | 本地、移动端、嵌入式 | 服务端、多用户系统 |

## 官方资料入口

- 首页：<https://www.sqlite.org/>
- 文档索引：<https://www.sqlite.org/docs.html>
- SQL 语法：<https://www.sqlite.org/lang.html>
- 数据类型：<https://www.sqlite.org/datatype3.html>
- 查询计划：<https://www.sqlite.org/eqp.html>
- WAL：<https://www.sqlite.org/wal.html>
- PRAGMA：<https://www.sqlite.org/pragma.html>
