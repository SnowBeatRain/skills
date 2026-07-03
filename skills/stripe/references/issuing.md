# Stripe Issuing

Use this reference for Stripe Issuing cardholders, cards, authorizations, transactions, spending controls, and real-time authorization.

## Core Objects

| Object | Purpose |
| --- | --- |
| Cardholder | Person or business authorized to hold cards |
| Card | Physical or virtual card with status and controls |
| Authorization | Real-time card authorization request |
| Transaction | Posted card transaction |
| Spending controls | Limits by amount, category, geography, or time |

## Authorization Flow

Issuing systems must handle authorization decisions quickly and safely. If using real-time authorization, build low-latency, highly available decision logic and define fallback behavior.

Store authorization IDs and transaction IDs separately. An authorization is not always the final posted transaction.

## Card Controls

Use spending controls to reduce risk. Model who can create, activate, freeze, replace, and cancel cards. Audit all operator actions.

## Sensitive Data

Card data is sensitive. Do not log card numbers, CVC, or full card details. Use Stripe-hosted or SDK-provided surfaces for sensitive display where available.

## Testing

Test card creation, freeze/unfreeze, authorization approval, authorization decline, spending control rejection, transaction posting, refund/credit, and webhook retries.

## Common Mistakes

- Treating authorization approval as final accounting settlement.
- Missing low-latency requirements for real-time auth.
- Building card controls only in UI without server enforcement.
- Confusing Issuing transactions with customer payment charges.
