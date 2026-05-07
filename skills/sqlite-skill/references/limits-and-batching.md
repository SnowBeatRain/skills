# Limits 与批处理

SQLite 有官方 limits，宿主 wrapper 也可能额外限制参数数量、SQL 长度、事务耗时和单次返回数据量。大批量操作必须显式分批。

## 常见限制

重点关注：

- host parameters 数量。
- SQL 文本长度。
- 列数、索引列数、表达式深度。
- 最大页数和数据库大小。
- 单事务耗时、锁等待和宿主超时。
- wrapper 对 batch execute、返回行数、内存占用的限制。

官方入口：<https://www.sqlite.org/limits.html>。

## 批量写入

```text
输入 N 条
  → 按 100~1000 条或按参数数量切片
  → 每批一个事务或整体事务内分段执行
  → 记录进度和失败批次
```

批大小不是固定值，要结合字段数、参数数量、设备性能、事务耗时和失败恢复能力测试。

## IN 查询分批

```sql
SELECT * FROM tasks WHERE local_id IN (?, ?, ...);
```

当 id 很多时按批查询，或写入临时表后 JOIN。不要生成超长 SQL。

## 分页与导出

- UI 列表使用 keyset pagination。
- 导出/同步拉取按 cursor 或时间窗口分批。
- 大结果集不要一次读入内存。

## 失败恢复

- 每批提交后记录 checkpoint。
- 同步或导入失败后能从最近成功批次继续。
- 事务过大可能导致锁时间长、WAL 膨胀或低端设备卡顿。
