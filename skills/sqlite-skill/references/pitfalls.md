# SQLite 避坑

## 把 SQLite 当服务端数据库

SQLite 适合本地、嵌入式、移动端和中小规模单机数据，不适合高并发多用户服务端写入。

## 误解字段类型

`VARCHAR(20)` 不会自动限制 20 个字符。需要使用：

```sql
CHECK (length(name) <= 20)
```

## 误解 BOOLEAN

用 `INTEGER 0/1` 并加 `CHECK`：

```sql
is_done INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1))
```

## 滥用 AUTOINCREMENT

大多数场景 `INTEGER PRIMARY KEY` 足够。离线同步更应使用 `local_id` 和 `server_id` 分离。

## 忘记开启外键

```sql
PRAGMA foreign_keys = ON;
```

通常每次打开连接都要设置。

## 批量写入不用事务

循环单条提交会慢且不一致。批量导入、同步落库、迁移必须使用事务。

## 拼接 SQL

所有用户输入使用参数绑定。动态排序字段必须白名单化。

## 无条件更新或删除

执行 `UPDATE` / `DELETE` 前确认 `WHERE` 条件。重要操作可先 `SELECT COUNT(*)` 检查影响范围。

## 本地自增 ID 当服务端 ID

离线新增时服务端 ID 尚不存在。使用 `local_id` 作为本地身份，服务端返回后保存到 `server_id`。

## 直接物理删除离线数据

离线同步建议先软删除，服务端确认后再清理。

## 所有字段塞 JSON

JSON 灵活但影响查询、索引、约束和迁移。核心字段独立成列。

## 大量 BLOB 入库

大量图片、音频、视频和文档建议存文件系统，SQLite 存路径、hash、大小和同步状态。

## 任何宿主默认可用 SQLite

不要默认浏览器、移动端、桌面端、嵌入式设备或后端脚本拥有同样的 SQLite 能力。先确认宿主是否提供 SQLite 引擎、wrapper API、文件系统权限和扩展支持。

## 不做数据库迁移

应用或工具升级后旧库仍可能长期存在。所有 schema 变更必须有 migration。

## 日志泄露敏感数据

不要输出 token、密钥、手机号、证件号、完整 payload 或 SQL 参数。
