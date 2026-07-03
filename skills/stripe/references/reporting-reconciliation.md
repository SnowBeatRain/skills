# Stripe Reporting and Reconciliation

Use this reference for balance transactions, payouts, application fees, Connect reconciliation, finance reporting, and audit trails.

## Core Concept

Payment success is not the same as net funds received. Fees, refunds, disputes, currency conversion, application fees, transfers, and payout timing all affect reconciliation.

## Objects to Track

| Need | Stripe objects |
| --- | --- |
| customer paid | PaymentIntent, Charge, Checkout Session |
| invoice revenue | Invoice, Subscription, Customer |
| fees and net amount | Balance Transaction |
| platform fee | Application Fee, Application Fee Refund |
| seller payment | Transfer, Transfer Reversal |
| bank payout | Payout |
| dispute impact | Dispute, Balance Transaction |
| reports | Reports, Sigma where available |

## Balance Transactions

Balance Transactions are often the best source for gross, fee, net, currency, exchange rate, and reporting category. Do not calculate financial reports only from PaymentIntent amount.

## Connect Reconciliation

For Connect, reconcile platform balance and connected account balance separately. Destination charges, direct charges, and separate charges/transfers create different reporting shapes.

Track:

- charge ID
- transfer ID
- application fee ID
- refund ID
- transfer reversal ID
- payout ID
- connected account ID
- balance transaction IDs

## Payouts

Payout timing can lag payment success. Finance and support workflows should distinguish paid order, available balance, and bank payout completion.

## Common Mistakes

- Reporting revenue from successful payments without subtracting refunds and disputes.
- Ignoring Stripe fees or FX conversion.
- Treating payout date as transaction date.
- Losing application fee refunds in marketplace refunds.
- Mixing platform and connected-account balances.
