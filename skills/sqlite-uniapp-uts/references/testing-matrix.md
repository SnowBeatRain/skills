# 测试矩阵

SQLite UTS 插件必须做三端真实环境验证。模拟器只能作为早期反馈，不能替代关键数据库验证。

## 平台矩阵

| 平台 | 最低验证 |
|---|---|
| Android | 目标 minSdk 真机 + 一个较新系统真机 |
| iOS | 目标最低 iOS 版本设备/模拟器 + 真机 |
| HarmonyOS | 目标 API Level 真机，必要时覆盖不同系统版本 |

## 功能用例

- open/close/reopen。
- execute/query 参数绑定。
- NULL、INTEGER、REAL、TEXT、BLOB 映射。
- transaction 成功提交。
- transaction 中途失败回滚。
- batch 大量写入。
- migration 新装、逐历史版本升级和真实旧库 fixture。
- busy/locked 或并发写入。
- 数据库文件不存在、路径不可写、磁盘空间不足。
- App 后台切换、崩溃后重启。
- migration 中途失败后再次启动恢复，不重复破坏数据。

## 一致性测试

同一组 SQL fixture 在三端运行，比较：

- rowsAffected。
- lastInsertRowid 语义。
- 查询 rows 和 columns。
- 错误码映射。
- user_version。
- capability report。

## 发布前门禁

- 三端 example 可以运行。
- README 能力矩阵与测试结果一致。
- 日志无敏感信息。
- 未支持能力明确标注 unsupported/unknown。

