# Personal Skills

Personal Agent Skills repository for reusable AI-agent workflows.

This repo is designed to grow over time as a collection of focused, self-contained skills. Each skill lives in its own folder and starts with a `SKILL.md` file using Agent Skills-style YAML frontmatter.

## Repository layout

```text
.
├── .claude-plugin/         # Optional Claude Code plugin marketplace metadata
├── docs/                   # Repo-level notes and curation guidance
├── skills/                 # Published personal skills
│   └── <skill-name>/
│       ├── SKILL.md        # Required: metadata + instructions
│       ├── scripts/        # Optional: deterministic helper scripts
│       ├── references/     # Optional: detailed docs loaded only when needed
│       └── assets/         # Optional: templates/static resources
├── templates/              # Starter templates for new skills
├── tools/                  # Repo maintenance scripts
└── package.json            # JS/TS-oriented tooling entrypoints
```

## Create a new skill

```bash
npm run new:skill -- my-skill-name "What this skill does and when agents should use it"
```

Then edit:

```text
skills/my-skill-name/SKILL.md
```

## Validate skills

```bash
npm run validate
```

## Package one skill

```bash
npm run pack:skill -- my-skill-name
```

This creates `dist/my-skill-name.zip` for upload/import workflows.

## Reference patterns

See [`docs/skill-patterns.md`](docs/skill-patterns.md) for curation notes distilled from public skills repositories.

The repo also includes `.claude-plugin/marketplace.json` so it can later be used as a Claude Code plugin marketplace / skill set source if desired.

The validator checks that every skill has:

- a `SKILL.md`
- YAML frontmatter
- `name` and `description`
- matching folder/name conventions

## Skill design principles

- Keep `SKILL.md` concise and procedural.
- Put detailed reference material in `references/`.
- Put repeatable deterministic code in `scripts/`.
- Put reusable output resources in `assets/`.
- Prefer JS/TS helper scripts when code is needed.
- For large helper scripts, document `--help` usage and treat scripts as black boxes unless customization is required.
- Add focused examples or test prompts for important skills.
- Avoid dumping general documentation into individual skill folders.

## Minimal skill shape

```markdown
---
name: my-skill-name
description: Use when ...
---

# My Skill Name

## Workflow

1. Understand the request.
2. Read only the references needed for the task.
3. Execute the task safely.
4. Verify the result before reporting completion.
```
