# Skill Patterns

Notes distilled from public Agent Skills repositories such as Anthropic's `skills` and Composio's `awesome-claude-skills`.

## Patterns worth copying

### 1. Self-contained skill folders

Each skill should work as a standalone package:

```text
skills/<skill-name>/
├── SKILL.md
├── scripts/       # optional executable helpers
├── references/    # optional deeper docs
└── assets/        # optional output resources/templates
```

### 2. Strong trigger descriptions

The YAML `description` is the primary trigger. It should include:

- what the skill does
- when to use it
- common user phrases or contexts
- important exclusions if misuse is likely

Prefer specific descriptions over generic ones.

### 3. Progressive disclosure

Keep `SKILL.md` lean. Move details to:

- `references/` for long guidance, schemas, examples, API docs
- `scripts/` for deterministic/repeated logic
- `assets/` for templates/static files

When referencing bundled files, tell the agent exactly when to read or run them.

### 4. Scripts as black boxes

For large helper scripts, instruct agents to run `--help` first and avoid reading source unless customization is required. This preserves context and makes behavior more deterministic.

### 5. Skill sets / marketplace metadata

Anthropic's repo uses `.claude-plugin/marketplace.json` to group skills into installable sets. This repo includes a personal skill set so it can later be used as a Claude Code plugin marketplace if desired.

### 6. Quality gates

Before publishing or using a skill:

- validate frontmatter
- check folder/name match
- check trigger specificity
- run any bundled script help/tests
- create at least one realistic usage prompt for important skills

## What not to copy blindly

- Very large bundled assets unless they are truly needed.
- Huge generated skill collections without curation.
- Long `SKILL.md` files that should be split into references.
- License fields from other repos unless the license actually applies.

## JS/TS preference for this repo

When a skill needs executable support, prefer:

- Node.js scripts (`.mjs`) for repo maintenance and text/file transforms
- TypeScript for larger reusable tools
- Zod for schema validation in TS helpers
- Playwright for browser/UI verification when relevant
