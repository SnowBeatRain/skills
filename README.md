# 个人 Skills

这是 SnowBeatRain 的个人 Agent Skills 仓库，用来沉淀可复用的 AI Agent 工作流、领域知识、工具说明和自动化脚本。

仓库语言策略：**中文优先**。文档、模板、说明默认使用中文；命令、文件名、协议字段、生态关键词按需保留英文。

## 目录结构

```text
.
├── .claude-plugin/         # 可选：Claude Code plugin marketplace 元数据
├── docs/                   # 仓库级说明、模式沉淀和维护规范
├── skills/                 # 正式维护的个人 skills
│   └── <skill-name>/
│       ├── SKILL.md        # 必需：元数据 + 使用说明
│       ├── scripts/        # 可选：确定性辅助脚本，优先 JS/TS
│       ├── references/     # 可选：按需读取的详细参考资料
│       └── assets/         # 可选：模板、静态资源、输出素材
├── templates/              # 新 skill 模板
├── tools/                  # 仓库维护脚本
└── package.json            # JS/TS 工具入口
```

## 创建新 skill

```bash
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"
```

然后编辑：

```text
skills/my-skill-name/SKILL.md
```

建议：

- 目录名和 `name` 使用英文 kebab-case，方便跨工具识别。
- `description` 优先中文，写清楚“做什么、何时使用、常见触发场景”。
- `SKILL.md` 正文优先中文。

## 校验 skills

```bash
npm run validate
```

校验器会检查：

- 每个 skill 都有 `SKILL.md`
- 存在 YAML frontmatter
- 存在 `name` 和 `description`
- 目录名与 `name` 一致

## 打包单个 skill

```bash
npm run pack:skill -- my-skill-name
```

会生成：

```text
dist/my-skill-name.zip
```

用于后续上传、导入或分发。

## 可参考的模式

见 [`docs/skill-patterns.md`](docs/skill-patterns.md)。里面沉淀了从 Anthropic `skills`、Composio `awesome-claude-skills` 等公开仓库中值得借鉴的组织方式。

仓库也包含 `.claude-plugin/marketplace.json`，后续可按需作为 Claude Code plugin marketplace / skill set 来源。

## Skill 设计原则

- 中文优先：说明、流程、注意事项默认中文。
- `SKILL.md` 保持短小、具体、可执行。
- 长参考资料放到 `references/`，需要时再读取。
- 可重复、容易出错的流程沉淀到 `scripts/`。
- 输出模板、静态资源放到 `assets/`。
- 需要脚本时优先 JS/TS；仓库维护脚本优先 Node.js `.mjs`。
- 大型辅助脚本要提供 `--help`，让 Agent 优先当黑盒调用，不要默认读源码。
- 重要 skill 至少准备一个真实使用场景或测试提示词。
- 不要把泛泛的长文档塞进单个 skill 目录。

## 最小 skill 示例

```markdown
---
name: my-skill-name
description: 用于……场景。当用户需要……时使用。
---

# My Skill Name

## 意图

这个 skill 帮助 Agent 完成……

## 工作流

1. 明确用户想要的具体结果和约束。
2. 先检查相关文件、资料或输入，再行动。
3. 只读取当前任务需要的 references。
4. 安全执行任务。
5. 用最小有效方式验证结果。
6. 汇报改了什么、验证了什么、还有什么阻塞。
```
