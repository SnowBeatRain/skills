# Stripe Customers and Payment Methods

Use this reference for customer records, saved payment methods, SetupIntents, mandates, off-session charging, and mobile customer access.

## Customers

Create a Stripe Customer when you need a durable relationship: subscriptions, saved payment methods, invoices, Customer Portal, reusable mandates, or customer-level reporting.

Store the Stripe Customer ID on your local user, account, workspace, or organization record. Treat it as a case-sensitive external ID and allocate enough column length.

Use metadata for low-sensitivity correlation IDs such as local account ID or environment tag. Do not store secrets, card details, government IDs, or sensitive personal notes in metadata.

## Payment Methods

PaymentMethods represent reusable payment instruments only when attached and authorized for the intended future use. A saved card can still require authentication or fail later.

Common operations:

- attach a PaymentMethod to a Customer after a successful SetupIntent or Checkout setup flow
- detach obsolete methods through Customer Portal or a controlled server action
- set `invoice_settings.default_payment_method` for invoice/subscription billing
- listen for payment method or mandate events where relevant

## SetupIntents

Use SetupIntents to save a payment method without immediately charging, especially for future off-session payments. Distinguish:

- on-session setup: customer is present and can authenticate
- off-session use: future charges may require mandate support and can still fail
- subscription setup: often handled by Checkout, Billing, or Customer Portal flows

## Mandates and Bank Debits

Bank debit methods such as ACH and SEPA often require mandates and delayed settlement. Do not treat method attachment as proof that future debits will settle. Handle pending, failed, and returned states through webhooks.

## Mobile and Ephemeral Access

Mobile apps must not contain secret keys. Use server-issued ephemeral access patterns supported by current Stripe mobile SDKs, such as Customer Sessions or Ephemeral Keys depending on SDK and flow.

The app may collect or confirm payment details, but the backend remains responsible for creating intents, verifying webhooks, and updating business state.

## Customer Portal

Prefer Customer Portal for subscription payment method updates, invoice payment, cancellation, and billing details when its configuration fits the business. Custom payment method management increases PCI and edge-case burden.

## Common Mistakes

- Creating duplicate Customers for the same business user without reconciliation.
- Storing card PAN, CVC, or full billing details locally.
- Using Tokens or Sources for new saved payment method flows.
- Treating a PaymentMethod ID as permanently chargeable.
- Updating local subscription status from frontend callbacks instead of invoice/subscription webhooks.
