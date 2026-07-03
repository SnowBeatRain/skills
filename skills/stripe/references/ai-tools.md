# Stripe AI Tools

This reference covers Stripe's AI-facing tooling: remote MCP, local MCP, Agent Toolkit, Claude plugin, Codex plugin status, and the official `stripe/ai` repository.

## Official Sources

- Remote MCP server: `https://mcp.stripe.com`.
- Local MCP package: `@stripe/mcp`.
- Agent Toolkit packages: `stripe-agent-toolkit` for Python and `@stripe/agent-toolkit` for TypeScript.
- Official repository reviewed locally at `/tmp/stripe-ai`, commit `b8d7e28` from `https://github.com/stripe/ai.git`.

## MCP

Remote MCP is OAuth-based and should be preferred when the client supports secure remote MCP authentication.

For local MCP in development:

```bash
npx -y @stripe/mcp --api-key=$STRIPE_RESTRICTED_KEY
```

Use a restricted key with only the permissions required by the tools you expose. Do not run MCP with broad live credentials unless the user has explicitly accepted the risk and scope.

## Python Agent Toolkit

Requirements: Python 3.11+.

Install:

```bash
pip install stripe-agent-toolkit
```

Use with an environment-provided restricted key and close the toolkit after use.

## TypeScript Agent Toolkit

Requirements: Node 18+.

Install:

```bash
npm install @stripe/agent-toolkit
```

The TypeScript package supports agent frameworks such as LangChain and Vercel AI SDK. Tool availability is determined by restricted-key permissions.

## Claude Plugin

Observed install command:

```bash
claude plugin install stripe@claude-plugins-official
```

This command completed successfully in the current environment during skill creation. Still verify `claude plugin list` or the target agent's plugin UI before relying on it in a different machine or profile.

## Codex Plugin

Observed command:

```bash
codex plugin add stripe@openai-curated
```

This failed in the current environment because no `stripe` plugin was found in the `openai-curated` marketplace, and `codex plugin marketplace list` reported no plugin marketplaces in scope. Do not claim the Codex plugin is installed unless a later verification command proves it.

## Security Checklist

- Use restricted keys for MCP and Agent Toolkit.
- Scope tools to the minimum needed operations.
- Avoid live-mode credentials in local experiments.
- Never paste key values into prompts, logs, screenshots, or skill files.
- Confirm which methods the MCP/toolkit actually supports; the Agent Toolkit is not a complete mirror of the full Stripe API.
