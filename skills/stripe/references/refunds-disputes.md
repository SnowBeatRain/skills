# Stripe Refunds and Disputes

Use this reference for refunds, chargebacks, dispute evidence, application fee refunds, and Connect liability review.

## Refunds

Refunds can be full, partial, or repeated up to the refundable amount. Treat refunds as financial operations that require stable local records and idempotency keys.

For each refund request, store:

- local refund request ID
- Stripe PaymentIntent or Charge ID
- amount and currency
- reason and support actor
- Stripe Refund ID after creation
- current refund status
- idempotency key

Use webhooks such as `charge.refunded` and `refund.updated` to reconcile state. Do not assume every refund is immediately final in all payment method and banking scenarios.

## Partial Refunds

Partial refunds are common for order adjustments. Validate that local item-level refund totals cannot exceed the captured amount, and keep the local source of truth for what was returned, cancelled, or credited.

## Disputes

Disputes are time-sensitive. Handle these events:

- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`

Store the dispute ID, charge ID, due date, reason, amount, evidence status, and final outcome. Build operational alerts for new disputes and approaching evidence deadlines.

## Evidence

Evidence submission is usually irreversible after the due date or final submission. Collect proof such as fulfillment logs, delivery confirmation, customer communication, refund policy acceptance, service usage, and identity checks when relevant.

Do not fabricate evidence. If evidence is weak, record that risk rather than auto-submitting generic text.

## Connect Liability

For Connect, review the charge pattern before refund or dispute handling:

| Pattern | Refund/dispute questions |
| --- | --- |
| Direct charge | Which connected account owns the charge and dispute? |
| Destination charge | Does the platform need to refund application fees or reverse transfers? |
| Separate charges and transfers | Does the transfer need reversal after customer refund or dispute loss? |

A customer refund does not automatically make all platform fee, transfer, tax, and fulfillment consequences correct. Model each financial movement explicitly.

## Operational Rules

- Use stable idempotency keys for refund creation.
- Do not issue duplicate refunds from webhook retries, support retries, or UI double-clicks.
- Record who initiated manual refunds and why.
- Update fulfillment, entitlement, and shipment state only through guarded local workflows.
- For dispute losses, reconcile balance transactions, fees, and connected-account impact.

## Common Mistakes

- Treating refund creation response as the only state to track.
- Forgetting application fee refunds in destination-charge marketplaces.
- Failing to reverse transfers when the platform has already paid out a seller.
- Missing dispute deadline alerts.
- Auto-refunding disputed payments without checking the current dispute workflow.
