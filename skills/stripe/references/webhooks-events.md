# Stripe Webhooks and Events

Use this reference for webhook implementation, event processing, local forwarding, replay, retries, and Connect account events. Webhooks are the source of truth for asynchronous Stripe state.

## Core Rules

- Verify every webhook signature before parsing or trusting the event.
- Use the raw request body required by the Stripe SDK. Framework JSON parsers often break signature verification.
- Return a 2xx response only after the event is durably recorded or safely handed to a queue.
- Treat event delivery as at-least-once. Duplicate events are normal.
- Do not assume event order. Query Stripe or use a local state machine when ordering matters.
- Keep handlers short. Long-running fulfillment, emails, provisioning, and transfers should be queued.

## Handler Shape

1. Read the raw body.
2. Verify the event with the endpoint signing secret for the current environment.
3. Store `event.id`, `event.type`, `livemode`, created time, and relevant object ID.
4. Reject duplicates using a unique constraint on `event.id`.
5. Route by `event.type` to a small handler.
6. Make business updates idempotent with object-level guards.
7. Return 2xx after durable completion or enqueue.

## Local Development

Use Stripe CLI for local forwarding and standard event simulation:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_failed
```

Record the endpoint signing secret printed by `stripe listen` in a local environment variable. Do not reuse a Dashboard endpoint secret for local CLI forwarding unless that is the intentional target.

## Event Matrix

| Flow | Events to handle |
| --- | --- |
| Checkout one-time payments | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed` |
| Custom PaymentIntents | `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.requires_action`, `charge.refunded` |
| Saved payment methods | `setup_intent.succeeded`, `setup_intent.setup_failed`, `payment_method.attached`, `payment_method.detached` |
| Subscriptions | `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.finalized` |
| Invoices and quotes | `invoice.created`, `invoice.finalized`, `invoice.paid`, `invoice.voided`, `invoice.marked_uncollectible` |
| Refunds and disputes | `charge.refunded`, `refund.updated`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` |
| Connect accounts | `account.updated`, `capability.updated`, `person.updated`, `payout.failed`, `transfer.failed` |
| Treasury and Issuing | Use the product-specific event list from official docs; these products have account and compliance consequences. |

## Connect Webhooks

Connect platforms must distinguish platform events from connected-account events. For connected-account events, store and route the event `account` value. Never update a platform-owned order, payout, or account state without checking which Stripe account emitted the event.

If a handler uses a platform secret key to retrieve connected account objects, pass the connected account context supported by the SDK or API. A `No such object` error often means the request is using the wrong account context or wrong test/live mode.

## Event Versions

Webhook endpoint API version can differ from the account default and from SDK request versions. During upgrades, check the endpoint version in Dashboard and update handlers against the actual payload shape. Do not assume a newer SDK changes existing webhook payloads.

## Failure and Replay

- Stripe retries non-2xx deliveries. Avoid returning 2xx for events that were not recorded.
- If a transient downstream system is down, record the event and queue retry work rather than blocking the webhook request for a long time.
- Use Dashboard delivery logs or Stripe CLI to replay events during recovery.
- Replays must be safe: duplicate fulfillment, duplicate refunds, duplicate transfers, and duplicate emails should be prevented by local constraints.

## Common Mistakes

- Parsing JSON before signature verification.
- Using the test endpoint signing secret in live mode or the reverse.
- Treating success/cancel return URLs as final payment status.
- Handling only `checkout.session.completed` and missing asynchronous payment failures.
- Using `event.id` dedupe but no business-level idempotency for fulfillment.
- Performing Connect updates without checking the connected account ID.
