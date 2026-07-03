# Stripe Testing

Use this reference to verify Stripe integrations in test mode before claiming a payment, billing, marketplace, or webhook flow works.

## Testing Principles

- Use Stripe test mode, never real card data.
- Exercise success, failure, cancel, retry, asynchronous completion, and duplicate webhook paths.
- Verify server-side state changes through webhooks, not only browser redirects.
- Confirm local database constraints prevent duplicate fulfillment, refunds, transfers, or entitlement changes.
- Keep test and live object IDs separate. Products, Prices, webhook endpoint IDs, keys, and signing secrets differ by mode.

## Test Data Areas

| Area | What to test |
| --- | --- |
| Cards | successful payment, decline, insufficient funds, incorrect CVC, expired card, processing error |
| Authentication | 3DS or SCA required, authentication success, authentication failure, abandoned authentication |
| Checkout | success URL, cancel URL, async success, async failure, expired session, repeated return visits |
| PaymentIntents | `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `succeeded`, `payment_failed` |
| SetupIntents | saved method succeeds, setup fails, mandate captured, off-session reuse requires action |
| Billing | subscription created, invoice paid, invoice failed, trial ending, cancellation, proration, dunning retry |
| Connect | onboarding incomplete, capability inactive, transfer failure, payout failure, wrong account context |
| Refunds | full refund, partial refund, duplicate refund prevention, failed or pending refund states |
| Disputes | dispute created, evidence due, dispute closed, fulfillment hold or reversal policy |

## Stripe CLI

Use CLI triggers for fast local checks, but remember triggered events are representative fixtures. Always run at least one real end-to-end test mode flow through your application.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

## Billing Test Clocks

Use Test Clocks for subscription lifecycle tests that depend on time:

- trials ending
- renewal invoices
- payment retries
- subscription cancellation
- proration after plan changes
- entitlement activation and revocation

Do not rely on manual date edits or mocked local time for Stripe-managed billing state.

## Checkout Verification

A Checkout flow is not verified until all of these are true:

1. A test Checkout Session was created server-side.
2. Browser completed payment or cancellation path.
3. Webhook delivery was received and signature verified.
4. Local order state changed only once.
5. Fulfillment did not run from the success URL alone.
6. Failure or cancellation did not leave paid state behind.

## Webhook Retry Test

Manually send the same event twice or replay it from Dashboard/CLI. The second delivery should be acknowledged without repeating fulfillment, email, refund, transfer, or entitlement mutation.

## Release Evidence

Before launch, keep evidence for:

- successful test mode payment
- failed payment
- webhook signature verification
- duplicate event handling
- live endpoint configuration check without real charge creation
- no Stripe secrets in source, logs, or build output
