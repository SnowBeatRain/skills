# 仓库复用与维护说明

本参考用于把 `sqlite-skill` 作为可复制、可打包、可跨 Agent 复用的技能目录来维护。

## 可借鉴的仓库级原则

- **中文优先**：说明、流程、注意事项默认中文；SQL、命令、API 名、文件路径保留原文。
- **自包含**：复制或分发时必须保留整个 `skills/sqlite-skill/` 目录，不能只复制 `SKILL.md`，否则 references 索引会失效。
- **渐进式披露**：`SKILL.md` 只放触发条件、核心工作流和 references 索引；长文档、示例、清单放入 `references/`。
- **平台中立**：SQLite 数据层能力与具体端平台、UI 框架、插件封装解耦；宿主 API 细节按需由其他 skill 或项目文档补充。
- **验证再交付**：新增或修改本 skill 后，必须运行仓库校验，避免 frontmatter、路径引用、敏感信息或行数约束出错。

## 外部参考资料合并规则

分析外部 SQLite/离线存储 skill 或文档时，只吸收平台中立、SQLite 数据层可复用的模式：Adapter 契约、DAO/Repository、migration runner、outbox/sync、health check、测试指标。不要把外部文档的具体框架定位、平台 API、插件结构、安装说明或开发过程记录搬进本 skill。

## 本 skill 的维护边界

适合放入本 skill：

- SQLite schema、SQL、迁移、事务、并发、索引、性能、同步、安全、测试策略。
- 平台中立的离线数据工程模式。
- 可复用的 SQLite 诊断、迁移、验证脚本。

不适合放入本 skill：

- 某个具体业务项目的表结构全量说明。
- 某个 UI 框架、端平台或插件的专属封装细节。
- 只对一次任务有用的过程记录。
- 密钥、token、真实用户数据、生产数据库内容或未脱敏日志。

## 修改后验证

在仓库根目录运行：

```bash
npm run validate
npm run test:validate
```

重点确认：

- `SKILL.md` 中每个反引号引用的 `references/...` 文件都真实存在。
- `SKILL.md` 未膨胀成长教程，仍保持入口文档定位。
- 新增资料没有包含疑似敏感信息。
- `git status --short` 中只包含本次预期修改；不要误改其他 skill 或 README。

## 分发方式

直接复制：

```text
skills/sqlite-skill/
```

打包单个 skill：

```bash
npm run pack:skill -- sqlite-skill
```

生成的压缩包应包含 `SKILL.md` 与完整 `references/`。