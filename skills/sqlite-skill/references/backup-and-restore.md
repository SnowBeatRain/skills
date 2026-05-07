# 备份与恢复

SQLite 数据库通常是本地文件，但不能简单把单个文件复制视为可靠备份。事务、WAL、加密、宿主文件系统和多账号隔离都会影响备份恢复。

## 可选方式

| 方式 | 适用场景 | 注意 |
|---|---|---|
| Online Backup API | 应用运行中备份 | wrapper 未必暴露；需验证一致性 |
| SQLite CLI `.backup` | 运维/桌面/脚本环境 | 依赖 CLI 可用性 |
| `VACUUM INTO` | 生成紧凑副本 | SQLite 版本要求；可能耗时和占空间 |
| 关闭连接后复制文件 | 简单本地场景 | 必须确认无写入、无未 checkpoint WAL |

## WAL 模式

WAL 模式可能存在：

```text
database.db
database.db-wal
database.db-shm
```

备份时必须考虑一致性：

- 优先使用 Online Backup API 或经过验证的 wrapper 备份能力。
- 如果复制文件，要确认没有写事务，并理解 `-wal` / `-shm` 的处理。
- 可在合适时机执行 checkpoint，但不要在高峰期强行阻塞。

```sql
PRAGMA wal_checkpoint(PASSIVE);
```

## 恢复流程

1. 暂停写入并关闭相关连接。
2. 校验备份文件来源、版本、账号/租户归属和加密状态。
3. 替换前保留当前库的安全副本。
4. 恢复后执行：

```sql
PRAGMA quick_check;
PRAGMA user_version;
```

5. 按当前应用版本运行 migration。
6. 校验关键表、索引、outbox、cursor 和账号隔离。

## 安全与隐私

- 备份文件包含完整本地数据，默认视为敏感文件。
- 加密库备份必须管理密钥生命周期；密钥不能与备份明文放在一起。
- 多账号场景恢复时不能把 A 用户备份恢复到 B 用户空间。
- 崩溃日志、导出包和客服排障包都不能包含未脱敏数据库。
