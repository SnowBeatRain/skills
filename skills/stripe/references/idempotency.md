# Stripe Idempotency

Use this reference for preventing duplicate Stripe operations and duplicate local side effects. Stripe integrations need idempotency at three layers: API requests, webhook events, and business state.

## Three Layers

| Layer | Tooling | Purpose |
| --- | --- | --- |
| Stripe API request | `Idempotency-Key` request header or SDK option | Prevent duplicate create/update results when retrying a Stripe API call |
| Webhook event | Unique record of `event.id` | Prevent duplicate processing of the same delivered event |
| Business state | Database unique constraints and state machine guards | Prevent repeated fulfillment, refunds, transfers, credits, or entitlement changes |

## API Request Idempotency

Use a stable idempotency key for create or mutation requests that may be retried:

- create Checkout Session for an order
- create PaymentIntent for a payment record
- create Customer for a business user
- create Subscription for an account
- create Refund for a support action
- create Transfer or Application Fee refund in Connect

Example key patterns:

```text
order:{order_id}:checkout_session:create
payment:{payment_id}:payment_intent:create
refund:{refund_request_id}:create
transfer:{transfer_request_id}:create
subscription:{workspace_id}:create
```

Do not reuse one key for different parameters or different operations. If the request shape changes, the operation identity should change too.

## Webhook Idempotency

Store `event.id` in a table with a unique constraint before or during processing. On duplicates, return 2xx after confirming prior processing state.

Event-level idempotency is not enough. Stripe can send multiple distinct events for the same object, and user actions can race with webhook delivery.

## Business Idempotency

Protect the side effect itself:

- order fulfillment table unique on local order ID
- subscription entitlement update guarded by latest subscription status
- refund records unique on local refund request ID
- transfer records unique on local transfer request ID
- invoice credit records unique on invoice or credit note ID

Use transactions or locks when two workers can process the same object concurrently.

## Retries and Timeouts

If a create request times out after reaching Stripe, retry with the same idempotency key. Do not create a brand-new request just because the client did not receive the first response.

For read-only requests, idempotency keys are not the main tool; use retry with backoff and request correlation.

## Common Mistakes

- Generating a random idempotency key per retry, which defeats idempotency.
- Using only `event.id` dedupe while fulfillment can still run twice from different events.
- Letting the success URL and webhook both mark an order fulfilled without a database guard.
- Retrying refunds or transfers without stable local operation IDs.
- Using a single idempotency key for an entire user session instead of one operation.
