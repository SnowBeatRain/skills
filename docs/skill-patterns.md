# Skill 模式笔记

本文沉淀从公开 Agent Skills 仓库中值得借鉴的组织方式，主要参考 Anthropic `skills` 和 Composio `awesome-claude-skills`。

本仓库约定：**中文优先**。除目录名、命令、协议字段、生态关键词外，文档和 skill 正文默认使用中文。

## 值得借鉴的模式

### 1. 自包含 skill 目录

每个 skill 应该尽量是一个独立包：

```text
skills/<skill-name>/
├── SKILL.md
├── scripts/       # 可选：可执行辅助脚本
├── references/    # 可选：更详细的参考资料
└── assets/        # 可选：输出资源、模板、静态素材
```

这样方便复制、打包、独立测试，也方便未来被不同 Agent 系统消费。

### 2. 高质量触发描述

YAML frontmatter 里的 `description` 是 skill 触发的关键。它应该写清楚：

- 这个 skill 做什么
- 什么时候应该使用
- 用户可能怎么表达这个需求
- 如果容易误用，说明不适用场景

优先写具体描述，不要写“帮助处理文件”这类泛泛描述。

### 3. 渐进式披露

保持 `SKILL.md` 精炼，把细节拆出去：

- `references/`：长指南、schema、示例、API 文档
- `scripts/`：确定性脚本、重复逻辑、易错流程
- `assets/`：模板、静态文件、输出素材

引用这些资源时，要告诉 Agent “什么时候读”或“什么时候运行”，不要让它一上来读完整个目录。

### 4. 脚本优先当黑盒使用

大型辅助脚本应提供 `--help`。在 skill 说明中要求 Agent：

1. 先运行 `--help` 看用法。
2. 能直接调用就直接调用。
3. 只有需要定制或排错时才读源码。

这样能节省上下文，也更稳定。

### 5. Skill set / marketplace 元数据

Anthropic 仓库使用 `.claude-plugin/marketplace.json` 把多个 skills 组织成可安装集合。本仓库保留这个结构，后续可以把个人 skills 暴露成一个 skill set。

### 6. 质量门禁

发布或正式使用 skill 前，至少检查：

- frontmatter 是否有效
- 目录名与 `name` 是否一致
- `description` 是否足够具体
- bundled scripts 是否能运行 `--help` 或基础测试
- 重要 skill 是否有至少一个真实使用场景 / 测试提示词

## 不要盲目照搬的东西

- 不必要的大型 assets。
- 未经筛选的海量生成 skill。
- 过长的 `SKILL.md`，应该拆到 `references/`。
- 其他仓库的 license 字段，除非当前 skill 真的使用同一授权内容。
- 只适合英文语境的触发描述；本仓库应中文优先。

## 本仓库的 JS/TS 偏好

当 skill 需要可执行支持时，优先考虑：

- Node.js `.mjs`：仓库维护、文本处理、文件转换
- TypeScript：较复杂、可复用的工具逻辑
- Zod：TS helper 的 schema 校验
- Playwright：浏览器、前端 UI、端到端验证

## 推荐维护节奏

1. 先把常用工作流写成中文 `SKILL.md`。
2. 如果说明变长，把背景知识拆到 `references/`。
3. 如果步骤重复或容易错，把它沉淀成 JS/TS 脚本。
4. 给重要 skill 补一个真实测试提示词。
5. 运行 `npm run validate`。
