# Stripe Documentation Map

Use this map when a request does not fit one obvious Stripe product area or when current official documentation must be checked before implementation.

## Official Sources

- Stripe Docs: `https://docs.stripe.com`
- API Reference: `https://docs.stripe.com/api`
- Stripe Changelog: `https://docs.stripe.com/changelog`
- Stripe SDKs: `https://docs.stripe.com/sdks`
- Stripe CLI: `https://docs.stripe.com/stripe-cli`
- Stripe Workbench: `https://docs.stripe.com/workbench`
- Stripe AI repository: `https://github.com/stripe/ai`

## Product Areas

| Area | Official docs starting point | Local reference |
| --- | --- | --- |
| Checkout | `https://docs.stripe.com/payments/checkout` | `payments.md` |
| PaymentIntents | `https://docs.stripe.com/payments/payment-intents` | `payments.md` |
| Payment Element | `https://docs.stripe.com/payments/payment-element` | `payments.md` |
| Payment methods | `https://docs.stripe.com/payments/payment-methods` | `payment-methods-local.md` |
| SetupIntents | `https://docs.stripe.com/payments/setup-intents` | `customers-payment-methods.md` |
| Customers | `https://docs.stripe.com/api/customers` | `customers-payment-methods.md` |
| Billing | `https://docs.stripe.com/billing` | `billing.md` |
| Subscriptions | `https://docs.stripe.com/billing/subscriptions/overview` | `billing.md` |
| Customer Portal | `https://docs.stripe.com/customer-management` | `billing.md` |
| Entitlements | `https://docs.stripe.com/billing/entitlements` | `entitlements.md` |
| Invoicing | `https://docs.stripe.com/invoicing` | `invoicing-quotes.md` |
| Quotes | `https://docs.stripe.com/quotes` | `invoicing-quotes.md` |
| Connect | `https://docs.stripe.com/connect` | `connect.md` |
| Connect embedded components | `https://docs.stripe.com/connect/supported-embedded-components` | `connect.md` |
| Refunds | `https://docs.stripe.com/refunds` | `refunds-disputes.md` |
| Disputes | `https://docs.stripe.com/disputes` | `refunds-disputes.md` |
| Stripe Tax | `https://docs.stripe.com/tax` | `tax-treasury.md` |
| Treasury | `https://docs.stripe.com/treasury` | `tax-treasury.md` |
| Financial Connections | `https://docs.stripe.com/financial-connections` | `financial-connections.md` |
| Terminal | `https://docs.stripe.com/terminal` | `terminal.md` |
| Radar | `https://docs.stripe.com/radar` | `radar-fraud-risk.md` |
| Reporting | `https://docs.stripe.com/reports` | `reporting-reconciliation.md` |
| Sigma | `https://docs.stripe.com/stripe-data/query-billing-data` | `reporting-reconciliation.md` |
| Identity | `https://docs.stripe.com/identity` | `identity-verification.md` |
| Issuing | `https://docs.stripe.com/issuing` | `issuing.md` |
| Webhooks | `https://docs.stripe.com/webhooks` | `webhooks-events.md` |
| API versions | `https://docs.stripe.com/api/versioning` | `sdk-api-version.md` |
| Testing | `https://docs.stripe.com/testing` | `testing.md` |
| Security | `https://docs.stripe.com/keys-best-practices` | `security.md` |
| Projects | `https://docs.stripe.com/stripe-projects` | `projects.md` |
| AI tools | `https://github.com/stripe/ai` | `ai-tools.md` |

## When to Check Official Docs First

Always check current official docs before implementing or making strong claims about:

- product availability by country, account type, or platform
- payment method country/currency support
- Connect Accounts v2 support for the target flow
- Metronome availability and usage-based billing migration
- Terminal reader and Tap to Pay support
- Tax jurisdiction and registration requirements
- Treasury, Issuing, Financial Connections, and Identity compliance boundaries
- API version changes, SDK major upgrades, and webhook payload versioning

## Local Reference Coverage

This skill intentionally avoids mirroring the whole Stripe documentation site. Local references provide implementation guardrails, review checklists, event/operation patterns, and launch readiness checks. Use official docs for exact parameter names, current API schemas, and fast-changing availability tables.
