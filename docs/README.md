# 文档索引

这里收纳仓库级说明、维护模式和质量约定。面向普通使用者的入口请先看根目录 [`README.md`](../README.md)。

## 当前文档

| 文档 | 适合什么时候读 | 内容 |
|------|----------------|------|
| [`skill-patterns.md`](skill-patterns.md) | 你要新增、拆分、重构或审查 Skill 时 | Skill 目录组织、frontmatter 描述、渐进式披露、脚本/参考资料使用方式、质量门禁 |
| [`apple-design` 实现说明](../skills/apple-design/LIQUID_GLASS_AUDIT.md) | 维护 Apple 风格与 Liquid Glass 资源时 | 官方定义、光学与基础路线、验收截图、来源哈希、独立复制与验证边界 |

## 常用维护流程

### 查看当前 Skills

```bash
npm run list
```

### 新增 Skill

```bash
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"
```

新增后编辑：

```text
skills/my-skill-name/SKILL.md
```

如果说明很长，把细节拆到：

```text
skills/my-skill-name/references/
skills/my-skill-name/scripts/
skills/my-skill-name/assets/
```

### 打包单个 Skill

```bash
npm run pack:skill -- my-skill-name
```

输出位置：

```text
dist/my-skill-name.zip
```

### 提交前质量门禁

```bash
npm run validate
npm run test:validate
git diff --check
```

这些检查分别覆盖：

- `npm run validate`：Skill frontmatter、目录命名、`SKILL.md` 行数、反引号引用路径、疑似敏感信息。
- `npm run test:validate`：校验器自身的回归测试。
- `git diff --check`：空白错误和补丁格式问题。

修改 `apple-design` 时，另外执行其示例校验。命令从仓库根目录运行：

```bash
node skills/apple-design/scripts/validate.test.mjs
node skills/apple-design/scripts/validate.mjs --profile optical --evidence skills/apple-design/references/qa/optical.json skills/apple-design/examples/optical-reference.html
```

修改 `assets/tokens.json` 后先运行 `node skills/apple-design/scripts/validate.mjs --sync-tokens`，不要手改 CSS 自动生成的令牌区。渲染/样式/来源代码变化后重新做相应视觉验收，更新截图与哈希；不能仅更新哈希沿用未经复查的 pass。基础模板不能通过 optical 验收。会话自动生成的 `.claude/` 状态文件不属于 Skill 发布内容，暂存与归档时按明确范围选择。

## 文档维护约定

- 根目录 `README.md` 保持为用户入口：这是什么、有哪些 Skill、怎么使用、怎么维护。
- `docs/` 放仓库级维护说明和模式沉淀。
- 单个 Skill 的详细背景资料放在该 Skill 自己的 `references/` 目录，不要集中堆到仓库级 docs。
- 过期但仍有参考价值的文档应归档，而不是直接删除；归档时保留原始路径关系并写明替代文档。
