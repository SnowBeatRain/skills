# Skills

这是个人 Agent Skills 仓库，用来集中管理可复用的 AI Agent 能力包。

这里的 **skill** 指一个自包含目录：它通过 `SKILL.md` 告诉 Agent 何时触发、如何工作，并可按需携带 `references/`、`scripts/`、`assets/` 等辅助资源。

本项目定位：

- 沉淀个人高频工作流和领域知识。
- 让 OpenClaw、Claude Code 等 Agent 更稳定地复用同一套技能说明。
- 以中文为主要使用语言，同时兼容 Agent Skills 生态的目录和元数据约定。
- 技术工具链优先 JS/TS。

## 当前 Skills

| Skill | 用途 | 位置 |
|------|------|------|
| `uniapp-skill` | uni-app / uniapp / uni-app x / UTS / 小程序 / H5 / App / HarmonyOS / 鸿蒙元服务等跨端开发任务 | [`skills/uniapp-skill`](skills/uniapp-skill) |
| `harmony-uts-plugin` | uni-app / uni-app x 中通过 UTS 封装 HarmonyOS / OpenHarmony 原生 API 为鸿蒙插件 | [`skills/harmony-uts-plugin`](skills/harmony-uts-plugin) |

查看完整列表：

```bash
npm run list
```

## 如何使用

### 方式一：直接复制 skill 目录

把需要的目录复制到目标 Agent 支持的 skills 目录中，例如：

```text
skills/uniapp-skill/
```

每个 skill 至少包含：

```text
SKILL.md
```

如果有 `references/`、`scripts/`、`assets/`，也应一起复制。

### 方式二：打包单个 skill

```bash
npm run pack:skill -- uniapp-skill
```

生成：

```text
dist/uniapp-skill.zip
```

这个压缩包可用于后续上传、导入或分发。

### 方式三：作为 Claude Code plugin marketplace / skill set 来源

仓库包含：

```text
.claude-plugin/marketplace.json
```

后续可按 Claude Code plugin marketplace 方式安装或组织 skill set。当前 metadata 已将本仓库声明为一个中文优先的个人 skills 集合。

## 项目结构

```text
.
├── .claude-plugin/         # Claude Code plugin marketplace 元数据
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

## 新增 Skill

创建：

```bash
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"
```

然后编辑：

```text
skills/my-skill-name/SKILL.md
```

命名与语言约定：

- 目录名和 frontmatter `name` 使用英文 kebab-case，例如 `uniapp-skill`。
- `description` 优先中文，必须写清楚“做什么、什么时候用、常见触发关键词”。
- `SKILL.md` 正文优先中文。
- 文件名、命令、协议字段、生态关键词可保留英文。

## Skill 目录规范

推荐结构：

```text
skills/<skill-name>/
├── SKILL.md
├── references/     # 长文档、API 说明、示例、领域知识
├── scripts/        # 可执行辅助脚本，优先 JS/TS
└── assets/         # 模板、静态资源、输出素材
```

`SKILL.md` 应该保持短小、明确、可执行；长资料放入 `references/`，让 Agent 按需读取。

最小示例：

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

## 维护命令

```bash
# 列出当前 skills
npm run list

# 校验所有 skills
npm run validate

# 创建新 skill
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"

# 打包单个 skill
npm run pack:skill -- my-skill-name
```

校验器会检查：

- 每个 skill 都有 `SKILL.md`
- 存在 YAML frontmatter
- 存在 `name` 和 `description`
- 目录名与 `name` 一致

## 设计原则

- **中文优先**：说明、流程、注意事项默认中文。
- **自包含**：一个 skill 目录应尽量可以独立复制、打包、使用。
- **渐进式披露**：`SKILL.md` 放核心流程，细节放 `references/`。
- **脚本确定性**：可重复、容易错的流程沉淀到 `scripts/`。
- **JS/TS 优先**：仓库维护脚本和新增 helper 优先使用 Node.js / TypeScript。
- **验证再交付**：新增或修改 skill 后运行 `npm run validate`。

更多模式笔记见：[`docs/skill-patterns.md`](docs/skill-patterns.md)。
