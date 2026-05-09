# Skills

[![skills.sh](https://skills.sh/b/SnowBeatRain/skills)](https://skills.sh/SnowBeatRain/skills)

> 面向 AI Agent 的中文优先能力库：把常用开发经验、平台规则和踩坑记录整理成可直接复用的 Skills，让 Agent 在处理 uni-app、鸿蒙 UTS、SQLite 等任务时更稳定、更懂上下文。

这个仓库不是普通的代码库，而是一组可以交给 Agent 使用的“工作能力包”。每个 Skill 都包含触发条件、工作流程、检查清单和参考资料，帮助 Agent 在特定场景下少猜测、多验证、按一致的方法完成任务。

## 你可以用它做什么

- **让 Agent 更懂你的项目栈**：例如 uni-app、uni-app x、UTS、HarmonyOS、SQLite 本地数据库。
- **减少重复解释**：常见约定、平台限制、测试方式和安全注意事项都沉淀在 Skill 里。
- **提升交付稳定性**：每个 Skill 都要求 Agent 先识别场景、再读取必要参考、最后做验证。
- **方便迁移和分享**：单个 Skill 可以复制目录使用，也可以打包成 zip 分发。

## 当前可用 Skills

| Skill | 适合你在什么时候使用 | 能帮你解决什么 |
|------|----------------------|----------------|
| [`uniapp-skill`](skills/uniapp-skill) | 你在做 uni-app / uni-app x / 小程序 / H5 / App / HarmonyOS 跨端开发 | 页面结构、`pages.json`、`manifest.json`、uni API、Pinia、条件编译、测试与发布检查 |
| [`harmony-uts-plugin`](skills/harmony-uts-plugin) | 你需要在 uni-app / uni-app x 中封装 HarmonyOS / OpenHarmony 原生能力 | UTS 插件结构、ArkTS/ETS 对接、权限、Ability、Want、系统 Kit、真机调试与发布 |
| [`sqlite-skill`](skills/sqlite-skill) | 你需要设计或审查平台中立的 SQLite 数据层 | schema、migration、事务并发、索引、PRAGMA/WAL/FTS/JSON、备份恢复、安全隐私 |
| [`sqlite-uniapp-uts`](skills/sqlite-uniapp-uts) | 你需要给 uni-app / uni-app x 做 iOS、Android、HarmonyOS 三端统一 SQLite 插件 | 原生 SQLite 封装、三端 API 合同、事务迁移、错误模型、性能限制和真机验证 |

查看机器可读列表：

```bash
npm run list
```

## 快速使用

### 方式一：一键添加整个 Skills 集合

如果你使用支持 `skills` CLI 的环境，可以直接从 GitHub 添加本仓库：

```bash
npx skills add SnowBeatRain/skills
```

这会保持仓库里的 Skill 名称不变，并把 `SnowBeatRain/skills` 作为 Skills 集合来源使用。后续你可以在对话中让 Agent 按需加载 `uniapp-skill`、`sqlite-skill` 等能力。

### 方式二：复制单个 Skill 目录

如果你的 Agent 支持本地 Skills，也可以直接复制需要的目录：

```text
skills/uniapp-skill/
skills/sqlite-skill/
```

复制时请保留整个目录，包括：

```text
SKILL.md
references/
scripts/
assets/
```

其中只有 `SKILL.md` 是必需文件；如果某个 Skill 带有 `references/` 等资料，也建议一起复制，否则 Agent 可能缺少详细背景。

### 方式三：打包后导入

把单个 Skill 打成 zip：

```bash
npm run pack:skill -- uniapp-skill
```

输出文件：

```text
dist/uniapp-skill.zip
```

你可以把这个压缩包上传、备份，或导入到支持 Skill 包的 Agent 环境。

### 方式四：作为 Skill 集合使用

仓库包含 Claude Code plugin marketplace 元数据：

```text
.claude-plugin/marketplace.json
```

如果你的 Agent / IDE 支持以 marketplace 或 skill set 方式加载，可以把本仓库作为一个中文优先的个人 Skills 集合来源。

## 推荐使用场景

### 做 uni-app 跨端项目

当你要让 Agent 修改页面、排查打包问题、处理 `pages.json` / `manifest.json` / 条件编译时，优先加载：

```text
uniapp-skill
```

如果任务涉及鸿蒙原生能力，再配合：

```text
harmony-uts-plugin
```

### 做本地 SQLite 能力

如果你只是做 SQLite 数据层设计、迁移、索引、事务或同步策略，优先加载：

```text
sqlite-skill
```

如果你要在 uni-app / uni-app x 里封装三端 SQLite 插件，再加载：

```text
sqlite-uniapp-uts
```

## 每个 Skill 里面有什么

一个标准 Skill 目录通常长这样：

```text
skills/<skill-name>/
├── SKILL.md        # Agent 首先读取的说明：何时使用、怎么工作、如何验证
├── references/     # 可选：详细指南、API 说明、示例、平台规则
├── scripts/        # 可选：确定性辅助脚本
└── assets/         # 可选：模板、静态资源、输出素材
```

设计原则是：

- `SKILL.md` 保持短小、明确、可执行。
- 复杂背景资料放入 `references/`，让 Agent 按需读取。
- 重复、容易出错的流程尽量沉淀成脚本。
- 文档默认中文，代码、命令、API 字段保留英文原文。

## 给维护者：新增或修改 Skill

创建一个新 Skill：

```bash
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"
```

编辑生成的文件：

```text
skills/my-skill-name/SKILL.md
```

基本约定：

- 目录名和 frontmatter `name` 使用英文 kebab-case，例如 `uniapp-skill`。
- `description` 要写清楚“做什么、什么时候用、常见触发关键词”。
- `SKILL.md` 正文优先中文。
- 长说明放进 `references/`，不要把所有内容塞进 `SKILL.md`。

提交前运行：

```bash
npm run validate
npm run test:validate
```

常用维护命令：

```bash
# 列出当前 skills
npm run list

# 校验所有 skills
npm run validate

# 测试校验器自身
npm run test:validate

# 创建新 skill
npm run new:skill -- my-skill-name "用于……场景，当用户需要……时使用"

# 打包单个 skill
npm run pack:skill -- my-skill-name
```

更多维护模式见：[`docs/skill-patterns.md`](docs/skill-patterns.md)。

## 项目结构

```text
.
├── .claude-plugin/         # Claude Code plugin marketplace 元数据
├── docs/                   # 仓库级说明、模式沉淀和维护规范
├── skills/                 # 正式维护的 Agent Skills
│   └── <skill-name>/
│       ├── SKILL.md
│       ├── references/
│       ├── scripts/
│       └── assets/
├── templates/              # 新 Skill 模板
├── tools/                  # 仓库维护脚本
└── package.json            # Node.js 工具入口
```

## 设计取向

- **用户端优先**：README 先告诉你能用什么、什么时候用、怎么拿去用。
- **中文优先**：说明、流程、注意事项默认中文。
- **边界清晰**：每个 Skill 聚焦一个明确能力，不强行绑定无关技术栈。
- **自包含**：一个 Skill 目录应尽量可以独立复制、打包、使用。
- **验证再交付**：新增或修改 Skill 后必须运行校验命令。
