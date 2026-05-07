# 错误码与诊断

SQLite 错误处理不能只看 message。应尽量保留原始错误码、扩展错误码、SQL 类型和脱敏后的上下文。

## 常见错误

| 错误 | 含义 | 常见处理 |
|---|---|---|
| `SQLITE_BUSY` | 数据库被其他连接/事务占用 | 缩短事务、设置 busy_timeout、重试 |
| `SQLITE_LOCKED` | 表或连接内部锁冲突 | 检查并发使用和 statement 生命周期 |
| `SQLITE_CONSTRAINT` | 约束失败 | 检查唯一键、外键、CHECK、NOT NULL |
| `SQLITE_READONLY` | 数据库只读 | 检查路径、权限、只读文件系统 |
| `SQLITE_FULL` | 磁盘满或数据库达到限制 | 清理空间、暂停同步、提示用户 |
| `SQLITE_IOERR` | IO 错误 | 检查存储介质、路径、权限、崩溃恢复 |
| `SQLITE_CORRUPT` | 数据库损坏 | 停止写入、备份现场、integrity_check、恢复 |
| `SQLITE_SCHEMA` | schema 改变导致 statement 失效 | 重新 prepare statement |
| `SQLITE_MISUSE` | API 使用错误 | 检查 finalize、线程、连接生命周期 |

## 诊断步骤

1. 记录错误码、扩展错误码、操作类型和脱敏 SQL。
2. 对锁冲突检查未结束事务、未 finalize statement、并发写。
3. 对约束失败查询 `PRAGMA foreign_key_check;` 和相关唯一索引。
4. 对损坏/IO/磁盘满先停止写入，保留现场文件。
5. 恢复前后执行 `PRAGMA integrity_check;`。

## 日志原则

- 不记录完整敏感参数。
- 不记录密钥、token、证件号、手机号、精确位置。
- 可记录 SQL 模板、参数类型、错误码、耗时和影响行数。
