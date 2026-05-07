# 插件连接生命周期

通用规则见 `sqlite-skill/references/connection-lifecycle.md`。本文件只补充 uni-app / UTS 插件层关注点。

## dbId 管理

对外返回 `dbId`，不要返回原生连接对象。插件内部维护：

```text
dbId -> platform connection/store/helper
```

`dbId` 应绑定数据库 name/path/account scope，避免不同用户误用同一连接。

## 页面与应用生命周期

- 页面卸载不一定意味着数据库必须关闭；后台同步可能仍需要连接。
- 用户退出登录或切换账号必须关闭对应连接。
- App 进入后台时避免启动长事务。
- 插件应提供显式 `closeDatabase`，并在调试日志中暴露未关闭连接数量。

## 并发策略

推荐插件内部提供写队列：

- 查询可并发，但要受平台连接模型约束。
- 写入、事务、migration 串行化。
- 长事务必须记录耗时。

## 健康检查

`healthCheck` 应返回：

- open connection 数量。
- user_version。
- quick_check/integrity_check 结果。
- 数据库大小估算。
- 最近一次 migration 或 SQL 错误摘要。

