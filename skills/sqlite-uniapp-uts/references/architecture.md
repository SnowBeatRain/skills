# 架构总览

`sqlite-uniapp-uts` 是一个跨端插件工程 skill。它不替代 `sqlite-skill` 的数据库知识，而是把通用 SQLite 契约落到 uni-app / UTS 三端插件架构里。

## 分层模型

```text
Application / Page / Store
  -> Repository / DAO
  -> sqlite-uniapp-uts Public API
  -> Core Contract
  -> Platform Adapter
  -> Native SQLite / RDB capability
```

| 层 | 职责 | 不应负责 |
|---|---|---|
| Public API | 给 JS/UTS 调用，稳定类型和返回值 | 暴露原生对象 |
| Core Contract | 统一连接、事务、参数、结果、错误、能力 | 直接写平台 API |
| Platform Adapter | 适配 Android/iOS/HarmonyOS 原生能力 | 设计业务 schema |
| DAO/Repository | 业务 SQL 和领域模型 | 处理平台差异 |

## 关键架构决策

1. **契约优先**：先写 API、DTO、错误码和能力矩阵，再实现三端。
2. **能力探测优先**：每端实际 SQLite/RDB 能力可能不同，必须在初始化或诊断接口中暴露。
3. **平台差异内聚**：差异留在 adapter，不让页面和业务 DAO 直接 `#ifdef` 平台数据库行为。
4. **通用规则复用**：连接生命周期、statement、binding、result mapping、migration、error model 以 `sqlite-skill` 为准。
5. **真实环境验证**：移动端数据库问题常出现在真机文件系统、权限、低空间、后台切换和崩溃恢复中。

## 与相关 skill 的关系

- `sqlite-skill`：通用 SQLite 数据层规则。
- `uniapp-skill`：uni-app 工程、manifest、条件编译、页面调用。
- `harmony-uts-plugin`：HarmonyOS UTS 插件、ArkTS/ETS、Kit/ohpm 和调试。

当前 skill 的独有价值是把三者组合成可交付的 SQLite UTS 插件工程。

