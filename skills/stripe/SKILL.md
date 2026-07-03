---
name: stripe
description: Use when building, modifying, reviewing, upgrading, testing, launching, or troubleshooting Stripe integrations and operations across payments, Billing, Connect, Tax, Treasury, Terminal, fraud, disputes, reporting, SDKs, webhooks, and Stripe AI tooling.
---

# Stripe

## Overview

Use this skill as the Stripe integration router and safety checklist. Prefer Stripe-hosted or Stripe-maintained surfaces, check current official docs before relying on fast-moving product details, and default to least-privilege credentials.

Sources reviewed during skill creation/update: Stripe `stripe/ai` repository commit `b8d7e28`, official docs under `https://docs.stripe.com`, and marketplace skills for best practices, Projects, and upgrades.

## First Checks

1. Identify the Stripe product area: payment, subscription, marketplace, tax, treasury, in-person, fraud, reporting, identity, issuing, upgrade, or AI tool integration.
2. Read the relevant reference before writing code or advice.
3. Check whether the user supplied a target API version, existing SDK version, framework, account mode, business model, or jurisdiction.
4. Never print, persist, or invent real Stripe credentials. Use environment variables and redact pasted secrets.

## Routing

| User need | Preferred Stripe surface | Reference |
| --- | --- | --- |
| One-time web payment | Checkout Sessions first; PaymentIntent only when checkout state must be custom | `references/payments.md` |
| Embedded/custom checkout UI | Checkout Sessions with Payment Element where possible | `references/payments.md` |
| Local methods, wallets, bank debits, BNPL | Dynamic payment methods and Dashboard configuration | `references/payment-methods-local.md` |
| Save payment method for later | SetupIntents and Customer payment methods | `references/customers-payment-methods.md` |
| Subscriptions or recurring billing | Billing APIs plus Checkout Sessions and Customer Portal | `references/billing.md` |
| Feature access from subscriptions | Entitlements and webhook-driven local authorization | `references/entitlements.md` |
| Invoices, quotes, credit notes | Invoicing and Quotes APIs | `references/invoicing-quotes.md` |
| New usage-based billing | Check current Stripe docs; Metronome is often preferred for new complex usage billing | `references/billing.md` |
| Marketplace or SaaS platform payments | Connect Accounts v2 where supported for the target use case | `references/connect.md` |
| Refunds, chargebacks, disputes | Refunds API, Disputes API, Connect fee/transfer reversal logic | `references/refunds-disputes.md` |
| Sales tax, VAT, or GST | Stripe Tax plus Registrations API | `references/tax-treasury.md` |
| Embedded financial accounts | v2 Financial Accounts API, after current-doc verification | `references/tax-treasury.md` |
| Bank account data linking | Financial Connections Sessions and minimum permissions | `references/financial-connections.md` |
| In-person payments | Stripe Terminal, readers, locations, `card_present` flows | `references/terminal.md` |
| Fraud, reviews, risk decisions | Radar rules, reviews, 3DS strategy, delayed fulfillment | `references/radar-fraud-risk.md` |
| Reporting and reconciliation | Balance Transactions, Reports, Payouts, Transfers, Application Fees | `references/reporting-reconciliation.md` |
| Identity verification | VerificationSessions and sensitive PII handling | `references/identity-verification.md` |
| Card issuing | Issuing cardholders, cards, authorizations, transactions | `references/issuing.md` |
| API client or SDK setup | SDK initialization, retries, version pinning, environment isolation | `references/sdk-api-version.md` |
| Webhook implementation or event handling | Signature verification, event matrix, replay, Connect events | `references/webhooks-events.md` |
| Local testing and test cards | Stripe CLI triggers, test mode matrix, Test Clocks | `references/testing.md` |
| General Stripe CLI work | CLI login, listen, trigger, diagnostic boundaries | `references/stripe-cli.md` |
| Idempotency and retries | API request keys, event dedupe, business constraints | `references/idempotency.md` |
| Production launch | Live Dashboard, keys, webhook, monitoring, support checklist | `references/go-live-checklist.md` |
| Logs and diagnostics | Request IDs, event IDs, redaction, Dashboard/Workbench correlation | `references/observability.md` |
| Monitoring and incidents | Metrics, alerts, degraded mode, severity rules | `references/monitoring.md` |
| Troubleshooting | Common errors, mode/account mismatches, webhook and Connect triage | `references/troubleshooting.md` |
| Key handling, OAuth, 2FA | Security reference | `references/security.md` |
| Cloud service or credential provisioning | Stripe Projects CLI plugin | `references/projects.md` |
| API or SDK upgrade | Upgrade checklist and changelog review | `references/upgrade.md` |
| MCP, Claude/Codex plugins, Agent Toolkit | AI tooling reference | `references/ai-tools.md` |
| Unsure where to start | Documentation map | `references/docs-map.md` |

## Non-Negotiable Rules

- Do not recommend Charges API, Sources API, Tokens API, or Card Element for new integrations. Route to Checkout Sessions, PaymentIntents, SetupIntents, Payment Element, or product-specific modern APIs.
- Do not pass `payment_method_types` except when the integration has a documented need. Terminal in-person payments require `card_present`, and some regions may require local in-person methods.
- Do not hardcode Stripe credentials. Prefer restricted API keys with minimum permissions; use secret stores or environment variables.
- Always verify webhook signatures and treat webhooks as the source of truth for asynchronous payment, invoice, refund, dispute, and entitlement state.
- For Connect, check current docs and target-account support for Accounts v2; do not default new designs to legacy account `type` values.
- For new usage-based billing, evaluate Metronome against current availability and requirements instead of assuming basic meters are enough.
- For tax, identity, financial data, and issuing, do not guess regulatory sufficiency. Confirm jurisdiction, product availability, and compliance owner.

## Implementation Stance

- Prefer a Stripe-maintained SDK over raw HTTP unless the target platform lacks one.
- Prefer Checkout, Customer Portal, hosted invoice pages, and Stripe-hosted onboarding before custom UI when they fit the product.
- Preserve existing pinned versions if the user asks for a compatibility fix. Otherwise, plan upgrades against current official docs and SDK release notes.
- If the user pasted a key or webhook signing secret, redact it in all replies and recommend rolling it if exposure is plausible.
- For code review, look for deprecated APIs, hardcoded payment method types, missing webhook verification, missing idempotency, unsafe key handling, weak Connect account-context handling, and unguarded fulfillment/refund/transfer paths.

## Verification Gate

Before saying a Stripe integration is done:

1. Run the project’s normal tests, typecheck, and lint where available.
2. Exercise the Stripe flow in test/sandbox mode or with Stripe CLI/webhook forwarding when possible.
3. Verify webhook signature handling, event dedupe, and idempotent business side effects.
4. Confirm no source file, logs, screenshots, or build output contains live or test credentials.
5. Confirm API version, SDK version, and webhook endpoint version are known.
6. For checkout, billing, refunds, disputes, Connect, and entitlements, confirm success, failure, retry, duplicate event, and asynchronous completion paths.
7. Before production launch, check live Dashboard configuration, restricted keys, webhook endpoint, monitoring, and support runbook.
