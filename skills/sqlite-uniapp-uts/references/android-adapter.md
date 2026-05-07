# Android Adapter

Android 侧优先核查官方 `SQLiteOpenHelper` 与 `SQLiteDatabase` 能力。官方文档入口：

- <https://developer.android.com/reference/android/database/sqlite/SQLiteOpenHelper>
- <https://developer.android.com/reference/android/database/sqlite/SQLiteDatabase>

## 适配重点

- 使用受控 helper 管理数据库创建、升级和打开。
- 查询后关闭 Cursor。
- 写事务使用 begin/set successful/end 模式或等价封装。
- 参数绑定优先使用 `?` args 或 compiled statement。
- 数据库路径必须属于 App 可写目录，避免写包内只读资源。

## 连接与线程

Android SQLite 写入需要避免多处同时抢写。插件层应提供串行写队列或明确事务边界。后台同步、页面操作和批量导入不要各自打开不可控连接。

## 结果映射

Cursor 读取时显式处理：

- NULL
- INTEGER
- FLOAT/REAL
- STRING/TEXT
- BLOB

列名冲突由 SQL alias 解决，Adapter 不应静默覆盖。

## 风险清单

- Cursor 未关闭导致泄漏或锁。
- 长事务阻塞 UI 或后台同步。
- 批量写入未放事务导致性能极差。
- `execSQL` 拼接外部输入导致注入。
- `onUpgrade` 直接破坏用户数据。

## 外键、WAL 与 API 差异

- 外键约束通常需要在每次打开数据库后显式启用并确认，例如使用平台 API 或执行 `PRAGMA foreign_keys = ON; PRAGMA foreign_keys;`。
- WAL 可通过 Android API 或 `PRAGMA journal_mode = WAL` 尝试启用，但必须读取结果确认，并在目标 Android 版本、连接池和真机上验证。
- `execSQL` 适合无结果 DDL/DML，不适合 SELECT；查询必须使用可返回 cursor/rows 的 API。
- 参数绑定、BLOB、NULL、INTEGER/REAL/TEXT 映射要按 Android API 实测，避免把所有值转字符串。
