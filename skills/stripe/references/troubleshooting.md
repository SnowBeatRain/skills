# Stripe Troubleshooting

Use this reference when a Stripe integration behaves differently from expectation in development, staging, or production.

## Triage Order

1. Identify the affected mode: test or live.
2. Find the local order/user/account ID.
3. Find Stripe object IDs: PaymentIntent, Checkout Session, Customer, Subscription, Invoice, Refund, Dispute, Account.
4. Find `stripe_request_id` or `stripe_event_id` in logs.
5. Check Dashboard/Workbench request logs and webhook delivery logs.
6. Confirm API version, SDK version, webhook endpoint version, and connected account context.
7. Check local idempotency and state machine records.

## Common Errors

| Symptom | Likely cause | Checks |
| --- | --- | --- |
| `No such customer` or `No such payment_intent` | wrong test/live mode, wrong connected account, stale ID | compare object prefix, Dashboard mode, account context |
| `Invalid API Key provided` | wrong env var, restricted key lacks permission, rotated key | check deployment secrets and key permissions |
| webhook signature verification failed | raw body changed, wrong endpoint secret, wrong local CLI secret | inspect body parser and endpoint secret source |
| PaymentIntent already succeeded | duplicate confirm or stale frontend state | check retry flow and state transitions |
| `requires_action` not resolved | frontend did not handle 3DS/SCA | inspect client confirmation and return URL handling |
| `invoice.payment_failed` | payment method failed, authentication required, dunning configured | check invoice, subscription, payment intent, customer default method |
| duplicate fulfillment | missing webhook event dedupe or business unique constraint | inspect event table and fulfillment records |
| duplicate refund or transfer | missing idempotency key or support retry guard | inspect local operation ID and Stripe idempotency behavior |
| API 429 | retry storm, batch job too aggressive | inspect retry policy and request fanout |
| Connect capability inactive | onboarding incomplete or requirements due | inspect account requirements and capability status |

## Webhook Debugging

- Check the endpoint URL and selected events in Dashboard.
- Inspect last delivery HTTP status and response body.
- Confirm the handler returns 2xx only after durable record/enqueue.
- Confirm test/live endpoint signing secrets are not mixed.
- Replay an event and verify duplicate handling.

## Payment State Debugging

Payment status can move through `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `succeeded`, and failure states. Do not force local success before Stripe reaches a final success event for the chosen payment method.

## Billing Debugging

For subscription issues, inspect the Customer, Subscription, latest Invoice, PaymentIntent for the invoice, default payment method, tax settings, discounts, and Test Clock if used.

## Connect Debugging

Always ask: which account owns this object? Platform and connected-account object namespaces can differ. If the same ID lookup fails in one account context, check whether it exists under the connected account.

## Escalation Triggers

Escalate immediately for:

- live secret or webhook signing secret exposure
- duplicate shipment, entitlement, refund, or transfer
- webhook failures across all live events
- payment succeeded but local system did not provision access
- payout, transfer, or dispute failure affecting many connected accounts
