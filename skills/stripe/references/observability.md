# Stripe Observability

Use this reference for logging, correlation, Dashboard/Workbench investigation, and safe diagnostic data collection.

## Logging Goals

Stripe logs should let an engineer reconstruct a payment, invoice, refund, dispute, transfer, or entitlement change without exposing sensitive data.

## Recommended Fields

Record these fields when available:

```text
local_order_id
local_user_id
local_account_id
stripe_request_id
stripe_event_id
stripe_object_id
stripe_payment_intent_id
stripe_checkout_session_id
stripe_customer_id
stripe_subscription_id
stripe_invoice_id
stripe_refund_id
stripe_dispute_id
stripe_account_id
idempotency_key
livemode
api_version
```

For errors, include:

```text
stripe_error_type
stripe_error_code
decline_code
http_status
request_id
```

## Redaction Rules

Never log:

- secret keys
- restricted keys
- webhook signing secrets
- OAuth client secrets
- raw card data
- CVC
- full bank account details
- full identity documents
- unredacted client secrets

If a client secret must be correlated, store a truncated or hashed representation that cannot be used by a client.

## Request Correlation

Correlate these steps:

1. user starts checkout or subscription action
2. backend creates Stripe object
3. Stripe returns request ID and object ID
4. user returns from hosted or embedded flow
5. webhook event updates local state
6. fulfillment, entitlement, refund, or transfer runs

The success URL should not be the only correlation point.

## Dashboard and Workbench

Use Stripe request IDs from application logs to inspect Dashboard or Workbench request logs. Use event IDs to inspect webhook delivery logs. Compare the account, mode, API version, request body, response, and delivery status.

## Privacy and Retention

Payment systems often interact with PII, invoices, identity verification, and disputes. Keep diagnostic logs useful but minimal. Apply retention and access controls appropriate to financial and personal data.

## Common Mistakes

- Logging full webhook payloads in production without redaction.
- Omitting `livemode`, making test/live confusion harder to diagnose.
- Not storing event IDs, preventing webhook replay analysis.
- Losing Stripe request IDs, making Dashboard log correlation slow.
- Logging client secrets from frontend error reports.
