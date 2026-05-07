# iOS Adapter

iOS 侧以 SQLite 官方 C API 为规范来源。官方入口：

- <https://www.sqlite.org/cintro.html>
- <https://www.sqlite.org/c3ref/intro.html>

## 核心生命周期

```text
sqlite3_open_v2
  -> sqlite3_prepare_v2
  -> sqlite3_bind_*
  -> sqlite3_step
  -> sqlite3_column_*
  -> sqlite3_finalize
  -> sqlite3_close
```

## 适配重点

- 每个 prepared statement 必须 finalize。
- 关闭数据库前确认没有未释放 statement。
- 参数绑定覆盖 NULL、INTEGER、REAL、TEXT、BLOB。
- 错误对象保留 `sqlite3_errcode`、扩展错误码和 `sqlite3_errmsg`。
- 路径使用 App sandbox 可写目录，并明确备份策略。

## 类型映射

Swift/UTS 边界要明确：

- 64 位整数超过 JS 安全整数时返回 string 或明确约束。
- BLOB 返回 Uint8Array、ArrayBuffer 或 base64 之一，文档写死。
- Date 不自动转换，由业务选择 INTEGER epoch ms 或 TEXT ISO-8601。

## 风险清单

- 忘记 finalize statement。
- 多线程共用 connection 未加约束。
- 错误信息丢失，只返回普通字符串。
- BLOB/大结果集一次性读入内存。
- 数据库文件进入不符合预期的备份范围。

