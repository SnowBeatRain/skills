---
name: {{name}}
description: {{description}}
---

# {{title}}

## 意图

这个 skill 帮助 Agent {{when_to_use}}。

## 工作流

1. 确认用户想要的具体结果、边界和约束。
2. 先检查相关文件、文档或输入，再行动。
3. 只读取当前任务需要的 `references/`，避免一次性加载无关资料。
4. 如果有 bundled scripts，先当黑盒运行；优先查看 `--help`，只有需要定制或排错时才读源码。
5. 新增确定性自动化时，优先使用 JS/TS helper。
6. 用最小有效检查验证结果。
7. 汇报改了什么、验证了什么、还有什么阻塞。

## 资源

- `references/`：可选，按需读取的详细指南、示例、schema 或 API 文档。
- `scripts/`：可选，确定性辅助脚本；本仓库优先 JS/TS。
- `assets/`：可选，输出模板、静态文件或素材。

## 质量检查

- frontmatter 里的 `description` 清楚说明何时使用这个 skill。
- `SKILL.md` 保持简洁；长细节移动到 `references/`。
- 脚本有清晰用法，最好支持 `--help`。
- 重要或复杂 skill 至少有一个真实使用提示词或测试场景。
