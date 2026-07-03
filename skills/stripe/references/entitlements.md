# Stripe Entitlements

Use this reference for mapping Stripe Billing state to SaaS feature access, active entitlements, downgrade behavior, and webhook-driven authorization.

## Purpose

Payment success and feature access are related but not identical. Entitlements help map products, prices, or subscription items to features that the application can grant or revoke.

## Design Model

Track:

- local account/workspace/user
- Stripe Customer
- Subscription
- Product/Price
- Feature or entitlement
- active entitlement state
- source webhook event

The application should make authorization decisions from a durable local entitlement state, updated by Stripe webhooks, not by trusting frontend redirects.

## Lifecycle

Handle:

- subscription created
- subscription updated
- invoice paid
- invoice failed
- trial started and ended
- cancellation scheduled
- subscription deleted
- plan downgrade
- feature add-on purchase

Define grace periods and failure behavior before launch.

## Webhooks

Use Billing and entitlement-related events supported by the current Stripe API. At minimum, subscription and invoice events should update access state idempotently.

## Common Mistakes

- Granting access from Checkout success URL only.
- Never revoking access after cancellation or failed payment.
- Not handling plan downgrade or quantity change.
- Tying feature flags directly to price IDs without a migration layer.
- Ignoring Test Clocks for entitlement lifecycle tests.
