# Stripe Financial Connections

Use this reference for account linking, bank account data access, ownership, balances, transactions, and ACH-related verification workflows.

## Purpose

Financial Connections lets users permission access to financial account data. It is distinct from Treasury financial accounts and from generic saved payment methods.

## Session Design

A typical flow:

1. Server creates a Financial Connections Session for an authenticated user or account.
2. Client completes account linking.
3. Server receives linked account identifiers and permissions.
4. Application retrieves only the data it needs.
5. Webhooks or follow-up checks update local state where relevant.

## Permissions

Request the minimum permissions needed, such as account ownership, balances, or transactions. Explain the user-facing purpose and avoid collecting data merely because the API can provide it.

## Use Cases

- bank account ownership verification
- ACH onboarding support
- income or cash-flow analysis where legally appropriate
- risk and underwriting support
- treasury or platform financial workflows

## Privacy and Compliance

Financial data is sensitive. Minimize local storage, redact logs, control access, and confirm regulatory obligations for the jurisdiction and product.

## Common Mistakes

- Confusing linked bank-account data with payment authorization.
- Requesting broad permissions without product need.
- Logging balances or transaction details unnecessarily.
- Treating Financial Connections as Treasury account creation.
