# 安全与隐私

通用 SQLite 安全原则见 `sqlite-skill/references/security.md`。

## 插件层规则

- SQLite 不是加密存储。
- 不明文保存 token、密码、证件号、高敏定位和密钥。
- 需要加密时，先确认三端可用方案：SQLCipher、系统安全存储、平台 keystore/keychain 或业务侧加密。
- `OpenDatabaseOptions.keyAlias` 只能引用安全存储中的 key，不应直接传明文 key。

## 路径与账号隔离

- 数据库路径必须在 App 沙盒可控目录。
- 多账号建议使用账号隔离目录或数据库名。
- 退出登录时关闭连接并清理敏感缓存。
- 卸载、备份、恢复策略要与业务隐私等级匹配。

## 日志

插件默认日志应关闭或低敏。debug 日志也不能输出 SQL 参数明文。

