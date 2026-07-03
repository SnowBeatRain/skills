# Stripe Payment Methods and Local Methods

Use this reference when selecting cards, wallets, bank debits, redirects, buy-now-pay-later, and region-specific payment methods.

## Default Strategy

Use dynamic payment methods through Checkout or Payment Element whenever possible. Let Stripe and Dashboard configuration select eligible payment methods based on currency, country, amount, device, and account capability.

Do not hardcode `payment_method_types` for standard online payments unless the integration has a documented reason. Terminal in-person payments are a notable exception because `card_present` is required and some regions add local in-person methods.

## Method Categories

| Category | Examples | Engineering implications |
| --- | --- | --- |
| Cards | card networks, Link card autofill | Fast confirmation, declines and 3DS still possible |
| Wallets | Apple Pay, Google Pay, Link | Device/browser/domain configuration can matter |
| Bank debits | ACH, SEPA, Bacs and similar methods | Mandates, delayed settlement, returns, asynchronous failures |
| Redirect methods | iDEAL, Bancontact, Sofort-like flows | Customer leaves and returns; webhook is final source |
| Buy now pay later | Klarna, Afterpay/Clearpay, Affirm and similar methods | Eligibility, country/currency limits, delayed status and refund rules |
| Regional wallets | Alipay, WeChat Pay and other local wallets where available | Region, currency, and account availability must be checked |

## Asynchronous Status

Some methods can show a completed customer flow before money is final. Handle asynchronous success and failure events. Never ship goods, unlock irreversible value, or transfer funds solely because a redirect URL was visited.

## Currency and Availability

Payment method availability depends on merchant country, customer country, currency, amount, account configuration, risk, and product surface. Check the official payment method docs and Dashboard settings before promising a method.

## Review Checklist

- Dashboard payment method settings are configured for the account and mode.
- Currency and country support match the business region.
- Webhooks handle async success and failure.
- Mandates are captured for bank debit/off-session methods.
- Refund and dispute behavior is understood for each method.
- The UI does not expose methods that the backend cannot fulfill or reconcile.

## Common Mistakes

- Hardcoding only `card` and blocking better local methods.
- Assuming all payment methods settle instantly.
- Failing to handle redirect abandonment.
- Treating wallet availability as universal across browsers and devices.
- Enabling bank debits without mandate and return handling.
