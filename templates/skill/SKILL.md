---
name: {{name}}
description: {{description}}
---

# {{title}}

## Intent

This skill helps agents {{when_to_use}}.

## Workflow

1. Confirm the concrete outcome and constraints from the request.
2. Inspect relevant files, docs, or inputs before acting.
3. Read bundled references only when they are relevant to the current task.
4. Run bundled scripts as black boxes first; use `--help` before reading source unless customization is required.
5. Prefer JS/TS helpers for new deterministic automation in this repo.
6. Verify the result with the smallest meaningful check.
7. Report what changed, what was verified, and any remaining blocker.

## Resources

- `references/` — optional detailed guidance loaded only when needed.
- `scripts/` — optional deterministic helpers, preferably JS/TS for this repo.
- `assets/` — optional templates or static resources used in outputs.

## Quality checklist

- The frontmatter `description` clearly says when to use this skill.
- `SKILL.md` stays concise; long details move to `references/`.
- Scripts have a documented usage path, ideally `--help`.
- At least one realistic usage prompt exists for important or complex skills.
