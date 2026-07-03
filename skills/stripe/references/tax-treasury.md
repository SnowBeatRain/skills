# Stripe Tax and Treasury

## Stripe Tax

Use Stripe Tax for Checkout Sessions, subscriptions, and invoices when the merchant sells across multiple tax jurisdictions and needs sales tax, VAT, or GST calculation. Tax collection depends on active registrations.

Setup flow:

1. Add a registration for each jurisdiction where the merchant is obligated to collect tax. Use Dashboard Tax registrations or the Tax Registrations API.
2. Enable `automatic_tax: { enabled: true }` on Checkout Session, Subscription, or Invoice objects.

It is safe to enable automatic tax before registrations exist; Stripe will not collect until at least one active registration applies.

## Tax Traps

- Do not guess jurisdictions. If obligations are unknown, ask the merchant to configure or confirm registrations.
- `automatic_tax` and explicit `tax_rates` are mutually exclusive.
- For existing subscriptions, clear `default_tax_rates` and item-level `tax_rates` before enabling automatic tax.
- For EU merchants, one OSS union registration covers all EU member states unless the merchant has a physical presence that requires separate handling.
- If Stripe Tax does not support the region or tax type, state that limitation and use manual tax rates only when appropriate.
- Do not approximate unsupported taxes such as customs duties or excise taxes through a supported region.

## Treasury and Financial Accounts

For embedded financial accounts, bank account/routing-number style accounts, and money movement tied to platform finance, use the v2 Financial Accounts API.

- New financial account integrations: use `POST /v2/core/vault/financial_accounts`.
- Do not use legacy v1 Treasury Financial Accounts for new integrations.
- Existing v1 integrations may continue to work, but new design should be v2-first.

## Review Checklist

- Tax obligations are explicit or deferred to merchant confirmation.
- Automatic tax is not combined with manual tax rates.
- Recurring tax changes account for proration and billing-cycle timing.
- Treasury guidance uses v2 Financial Accounts for new work.
