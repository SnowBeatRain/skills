# Stripe Go-Live Checklist

Use this reference before moving a Stripe integration from test mode to production. It turns Stripe's launch guidance into an engineering checklist.

## Code and Configuration

- Test mode flow completed end to end.
- Secret keys are stored only in production secret management.
- Publishable keys are separated by environment.
- API version and SDK package version are documented.
- Webhook raw body signature verification passes.
- Create/refund/transfer operations use idempotency keys.
- No test object IDs are hardcoded in production configuration.
- No Stripe secrets appear in source, logs, build output, screenshots, or issue trackers.

## Dashboard Setup

Check the live account:

- business profile
- branding and public business information
- statement descriptor
- payment method settings
- email receipts or invoice email policy
- Customer Portal configuration, if used
- Radar and fraud settings
- user roles, 2FA, SSO or SCIM where appropriate
- restricted keys for production services

## Products, Prices, and Tax

- Live Products and Prices exist and match the business model.
- Tax behavior, tax codes, inclusive/exclusive pricing, and registrations are configured.
- Billing trial, proration, cancellation, and dunning behavior is confirmed.
- Refund, cancellation, and dispute policies are reflected in product and support flows.

## Webhooks

- Live webhook endpoint URL is reachable from Stripe.
- Selected events cover all required payment, billing, refund, dispute, and Connect flows.
- Live webhook signing secret is configured in production.
- Endpoint API version is known and tested.
- Delivery logs show 2xx for test live-mode verification where possible.
- Handler can survive retries and duplicate events.

## Connect

For platform integrations:

- Required capabilities are active or remediation flow exists.
- Account onboarding and account update links are tested.
- Payout, transfer, application fee, refund, and dispute handling is documented.
- Connected account events are routed by account ID.
- Platform and connected-account responsibilities are understood by support/ops.

## Monitoring and Support

- Alerts exist for webhook 5xx, signature failures, payment failure spikes, API 401/403, API 429, and webhook backlog.
- Support team has a runbook for refunds, disputes, failed invoices, and customer payment method updates.
- Incident path exists for key leakage, duplicate fulfillment, or payment success with no local entitlement.
- Rollback or disablement plan exists for the payment entry point.

## Final Gate

Do not launch solely because unit tests pass. A production-ready Stripe launch requires test-mode end-to-end evidence, live configuration review, webhook verification, secret scanning, and operational ownership.
