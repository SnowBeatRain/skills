# Stripe Projects

Use Stripe Projects when the user wants to provision third-party services or retrieve credentials through Stripe Projects, including databases, auth, hosting, cache, vector DBs, LLM providers, email, search, queues, object storage, monitoring, analytics, feature flags, or provider API keys.

## CLI Workflow

1. Check Stripe CLI availability.

```bash
which stripe && stripe --version
```

2. Install or update Stripe CLI if missing or older than the required Projects version. On macOS with Homebrew, use `brew install stripe/stripe-cli/stripe` or `brew upgrade stripe/stripe-cli/stripe`. On other platforms, consult the official Stripe CLI install docs.

3. Ensure the Projects plugin is installed.

```bash
stripe plugin install projects
```

4. Search before promising a service.

```bash
stripe projects search <query> --json
stripe projects catalog --json
```

If `result_count` is 0, say the service was not found and suggest catalog alternatives only from real CLI output.

5. Check project state and initialize if needed.

```bash
stripe projects status --json
stripe projects init --preflight --json
stripe projects init --accept-tos --yes
```

`stripe projects init` installs a local `.claude/skills/stripe-projects-cli/SKILL.md` skill. If present, use that local skill as the command source of truth for service management.

## Source of Truth

The CLI manages state under `.projects/` and generated environment files. Do not hand-edit these files unless the user explicitly asks. Use CLI commands for status, service inventory, environment variable names, and health.

## Error Handling

| Error | Meaning | Recovery |
| --- | --- | --- |
| `BROWSER_AUTH_REQUIRED` | Browser login needed | Ask user to run `stripe login`; do not fake auth. |
| `ACCOUNT_NOT_ELIGIBLE` | Account not enabled for Projects | Ask user to authenticate or visit `https://projects.dev`. |
| `TOS_ACCEPTANCE_REQUIRED` | Terms not accepted | Re-run init with `--accept-tos` if appropriate. |
| `PROVIDER_NOT_LINKED` | Provider OAuth/link needed | Run the CLI link command; may require browser. |
| `PLAN_REQUIRED` | Service needs a plan first | Provision the listed plan before retrying. |
| Service not found | Catalog search returned zero | Report accurately and offer catalog browsing. |

## Output Format After Provisioning

Report provider, service, tier, and environment variable names only. Never reveal credential values.
