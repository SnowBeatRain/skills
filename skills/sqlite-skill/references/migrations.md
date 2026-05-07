# 数据库迁移

产品发布后，本地数据库会长期存在。任何 schema 变更都必须有迁移策略，否则升级可能导致崩溃或数据丢失。

## 版本管理方式

### PRAGMA user_version

```sql
PRAGMA user_version;
PRAGMA user_version = 2;
```

适合轻量迁移。

### schema_migrations 表

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
```

适合记录每个迁移脚本。

## 迁移原则

1. 空库初始化和旧库升级都要支持。
2. 从当前版本顺序执行到最新版本。
3. 每个迁移尽量小而清晰。
4. 迁移放事务中执行。
5. 迁移失败不能静默吞掉。
6. 大表迁移要评估耗时、空间和失败恢复。

## 基础伪代码

```ts
const current = await getUserVersion()

await db.transaction(async () => {
  if (current < 1) {
    await db.execute(`CREATE TABLE IF NOT EXISTS notes (...)`)
    await setUserVersion(1)
  }

  if (current < 2) {
    await db.execute(`ALTER TABLE notes ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending'`)
    await setUserVersion(2)
  }
})
```

## 复杂表结构变更

SQLite 某些复杂变更需要重建表：

1. 创建新表。
2. 复制旧数据到新表。
3. 删除旧表。
4. 重命名新表。
5. 重建索引、触发器、外键。

```sql
BEGIN TRANSACTION;

CREATE TABLE notes_new (...);

INSERT INTO notes_new (local_id, title, created_at, updated_at)
SELECT local_id, title, created_at, updated_at FROM notes;

DROP TABLE notes;
ALTER TABLE notes_new RENAME TO notes;

CREATE INDEX idx_notes_updated_at ON notes(updated_at);
PRAGMA user_version = 3;

COMMIT;
```

## 宿主迁移边界

- SQLite 宿主：执行真实 SQLite schema migration。
- 非 SQLite 存储：使用对应存储系统的版本升级机制，不要套用 SQLite SQL。
- 多宿主项目：保持上层迁移接口统一，底层 adapter 按宿主实现。


## ALTER TABLE 版本差异

SQLite 新版本支持更多 `ALTER TABLE` 能力，例如 `RENAME COLUMN`、`DROP COLUMN`。跨宿主或旧版本环境不要默认可用；生成迁移前先确认 SQLite 版本和 wrapper 支持。兼容性不确定时，使用“建新表 → 复制数据 → 删旧表 → 重命名 → 重建索引/触发器”的保守模式。
