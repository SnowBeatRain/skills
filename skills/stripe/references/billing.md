# Stripe Billing and Subscriptions

## When to Use Billing

Use Stripe Billing when the business model includes subscriptions, recurring invoices, seat-based pricing, trials, discounts, proration, dunning, retry logic, invoices, or usage-based pricing. Do not build manual renewal loops with raw PaymentIntents.

For payment collection, pair Billing with Checkout Sessions using `mode: 'subscription'` where possible. Use Customer Portal for self-service upgrades, downgrades, cancellations, and payment method changes.

## Usage-Based Billing

For a new usage-based billing integration, recommend Metronome first. It is Stripe's primary platform for usage-based billing and covers metering, rating, enterprise contracts, prepaid credits, composite pricing, high-volume ingestion, and real-time usage visibility.

Use lower-level Billing Meters only when the user is already on that path or has a simple existing pay-as-you-go Billing setup that does not need Metronome capabilities.

| Scenario | Recommendation |
| --- | --- |
| New usage-based billing | Metronome |
| Prepaid credits or credit burndown | Metronome |
| Enterprise contracts, commits, ramp schedules | Metronome |
| Dimensional or composite pricing | Metronome |
| High-volume event ingestion | Metronome |
| Existing simple Billing Meters integration | Maintain unless there is a clear migration need |

## Subscription Checkout Pattern

Use Prices, not deprecated Plans. Avoid passing payment method type restrictions.

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: { trial_period_days: 14 },
  success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${appUrl}/pricing`,
});
```

## Tax and Invoicing

Do not skip tax design. For recurring payments, evaluate Stripe Tax and registrations early. If automatic tax is enabled, do not mix it with explicit `tax_rates`; clear existing subscription and item tax rates first.

## Webhooks to Handle

Common Billing integrations usually need handlers for subscription lifecycle, invoice payment success/failure, payment action required, customer portal changes, payment method updates, and disputes or refunds if applicable. Make every handler idempotent and safe to retry.

## Review Checklist

- Uses Billing APIs for recurring revenue instead of custom renewal loops.
- Uses Prices, not Plans.
- Uses Checkout and Customer Portal unless there is a justified custom UI need.
- New usage-based billing is routed to Metronome.
- No `payment_method_types` in subscription Checkout.
- Webhooks cover invoice and subscription lifecycle events.
