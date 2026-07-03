# Stripe Payments

## API Choice

Use Stripe-hosted or Stripe-managed surfaces before custom payment plumbing:

| Need | Use | Notes |
| --- | --- | --- |
| Simple sale or product checkout | Payment Links | No-code, fastest path. |
| Most web app payments | Checkout Sessions | Handles payment UI, taxes, discounts, shipping, adaptive pricing, and many edge cases. |
| Embedded checkout with customization | Checkout Sessions plus Payment Element | Prefer `ui_mode: custom` when supported instead of a raw PaymentIntent-first design. |
| Off-session charge or custom checkout state | PaymentIntents | Use when the app must model checkout/payment state itself. |
| Save a payment method for later | SetupIntents | Do not use Sources or Tokens. |

New integrations should use Checkout Sessions, PaymentIntents, SetupIntents, Invoicing, Payment Links, Billing, or other current high-level APIs. Do not recommend Charges API, Sources API, Tokens API, Card Element, or `createToken`/`createPaymentMethod` flows for new work.

## Dynamic Payment Methods

Default rule: do not pass `payment_method_types`. Omitting it enables dynamic payment methods so Stripe can rank eligible methods using currency, location, amount, device, and Dashboard configuration.

This applies to:

- `checkout.sessions.create`: omit `payment_method_types`.
- `paymentIntents.create`: omit `payment_method_types`. On old API versions, use `automatic_payment_methods: { enabled: true }` only if needed for compatibility.
- `setupIntents.create`: same as PaymentIntents.
- `subscriptions.create` and subscription Checkout: omit `payment_settings.payment_method_types` and session `payment_method_types`.

Only exception: Terminal/in-person payments must pass `payment_method_types: ['card_present']`; in Canada include `interac_present` when required.

To customize methods, use Dashboard payment method settings, `payment_method_configurations`, or `excluded_payment_method_types`. Do not hardcode `['card']`.

## Payment Element

Use Payment Element for embedded UI. If surcharge rules, card inspection, or server-finalized flows require information before creating the final PaymentIntent or SetupIntent, use Confirmation Tokens. Do not recommend legacy Card Element or direct token creation.

## Webhook-Centric Completion

Synchronous API responses are not enough. Confirm durable payment outcomes through webhooks such as checkout session completion, payment intent success/failure, invoice payment events, disputes, and asynchronous method events. Verify signatures and make handlers idempotent.

## PCI and Raw Card Data

Do not collect or transmit raw PAN data through the application unless the merchant has the required PCI access and Stripe-approved use case. For migration from another acquirer, use Stripe's PAN import process rather than asking the user to handle card data manually.

## Review Checklist

- No Charges, Sources, Tokens, or Card Element for new work.
- No `payment_method_types` except Terminal.
- Payment completion uses verified webhooks.
- Payment methods are not saved through deprecated APIs.
- Client receives only publishable keys and client secrets; server retains privileged credentials.
- Test mode covers success, cancellation/failure, async completion, and webhook retry/idempotency.
