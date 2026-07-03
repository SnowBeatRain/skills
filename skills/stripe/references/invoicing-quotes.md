# Stripe Invoicing, Quotes, and Credit Notes

Use this reference for standalone invoices, quotes, hosted invoice pages, credit notes, and B2B billing flows that are not just subscription checkout.

## Invoices

Invoices move through draft, open, finalized, paid, void, and uncollectible states. Do not treat invoice creation as payment completion.

Key design choices:

- automatic collection vs manual collection
- hosted invoice page vs custom collection flow
- payment terms and due dates
- automatic tax behavior
- invoice finalization timing
- email delivery and reminders

## Invoice Items

Invoice Items let you add one-off charges, adjustments, and usage outside a subscription item. Keep local records for why the charge exists and avoid creating duplicate invoice items on retries.

## Quotes

Use Quotes when a buyer needs a formal offer before accepting. A quote can become an invoice or subscription depending on configuration. Store quote status and acceptance time, and do not provision paid access until the resulting invoice/subscription/payment flow confirms success.

## Credit Notes

Use Credit Notes for post-invoice credits, corrections, and accounting-visible adjustments. Do not model accounting credits as only local negative rows if Stripe invoices are the customer-visible financial record.

## Webhooks

Handle relevant invoice events:

- `invoice.created`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.voided`
- `invoice.marked_uncollectible`

For quote-driven flows, also track quote acceptance and resulting invoice or subscription IDs.

## B2B Review Checklist

- Invoice numbering and customer-facing fields are configured.
- Tax behavior and customer tax IDs are handled.
- Payment terms match contract terms.
- Credit notes and void/uncollectible workflows are defined.
- Finance can reconcile invoice status against balance transactions and payouts.
