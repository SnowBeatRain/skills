# sqlite3 CLI

SQLite CLI 适合调试、导入导出、备份恢复、查询计划和脚本化维护。生产应用仍应通过 wrapper/API 参数绑定执行。

## 打开数据库

```bash
sqlite3 app.db
sqlite3 app.db 'PRAGMA integrity_check;'
sqlite3 app.db < script.sql
```

## 查看结构

```text
.databases
.tables
.schema table_name
.indexes table_name
```

## 输出格式

```text
.headers on
.mode column
.mode json
.once output.json
.output dump.sql
```

## 查询计划与性能

```text
.eqp on
.timer on
.stats on
```

```sql
EXPLAIN QUERY PLAN SELECT * FROM notes WHERE sync_status = 'pending';
```

## 导入导出

```text
.dump
.read script.sql
.import file.csv table_name
.backup backup.db
.restore backup.db
```

## 参数

CLI 支持 `.parameter`，但脚本中仍要注意不要把不可信输入拼进 SQL 文件。

```text
.parameter init
.parameter set @id 1
SELECT * FROM notes WHERE id = @id;
```

## 维护

```sql
PRAGMA integrity_check;
PRAGMA optimize;
VACUUM;
VACUUM INTO 'compact.db';
```
