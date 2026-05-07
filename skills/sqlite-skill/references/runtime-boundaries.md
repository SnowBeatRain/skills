# 运行环境边界

SQLite skill 保持平台中立，只处理 SQLite 数据层、SQL、迁移、事务、性能、安全、同步和可靠性。具体框架、端平台、插件封装、页面代码、条件编译等内容不在本 skill 内展开；需要时由用户主动调用对应能力或提供宿主文档。

## 先确认宿主能力

- 宿主是否真的提供 SQLite 引擎或兼容 wrapper。
- SQLite 版本、编译选项、扩展模块和 PRAGMA 支持。
- 数据库文件路径、沙盒/权限、备份、升级、低磁盘空间和崩溃恢复限制。
- wrapper 是否支持事务、参数绑定、批处理、错误码、备份、WAL、FTS5、JSON、加密。

## 不要混淆的存储

- SQLite：嵌入式关系型数据库，本地文件，SQL 查询。
- IndexedDB / WebSQL / key-value storage：浏览器或宿主存储，不等同 SQLite。
- 文件存储：适合大附件，SQLite 可存元信息。
- 服务端 RDBMS：独立服务、多用户权限和高并发模型不同。

## 输出边界

- 可以输出平台中立 schema、SQL、migration、DAO/Repository、Adapter 契约、同步队列和测试清单。
- 不默认任何宿主拥有 WAL、FTS5、JSON1/JSONB、SQLCipher、backup API。
- 不编造具体 wrapper API；未确认时只给通用 SQL 和能力核查步骤。
- 对跨宿主项目，保持上层接口统一，底层 adapter 按宿主实现。
