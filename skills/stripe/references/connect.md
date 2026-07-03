# Stripe Connect

## Core Rule

Use Accounts v2 for new Connect platform work. Do not create connected accounts with legacy `type` values such as `standard`, `express`, or `custom`; model the account through v2 configuration dimensions instead.

Before live payments, check v2 capability status rather than deprecated v1 fields:

| Account role | Check | Do not use |
| --- | --- | --- |
| SaaS merchant account for direct charges | `configuration.merchant.capabilities.card_payments.status === 'active'` | `charges_enabled` |
| Marketplace recipient account for transfers | `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'` | `payouts_enabled`, `charges_enabled` |

Track capability changes through account webhooks and re-check before payment or transfer operations.

## Account Configuration Dimensions

Configure connected accounts with independent dimensions:

| Dimension | Field | Meaning |
| --- | --- | --- |
| Dashboard access | `dashboard` | Stripe-hosted dashboard access level |
| Fee collection | `defaults.responsibilities.fees_collector` | Who Stripe bills for fees |
| Negative balance liability | `defaults.responsibilities.losses_collector` | Who absorbs unresolved negative balances |

Dashboard defaults:

- Marketplace: `dashboard: "express"`.
- SaaS platform where sellers run their own business: `dashboard: "full"`.
- Full white-label: `dashboard: "none"` only when explicitly requested and the platform can build onboarding remediation, disputes, refunds, payouts, and account management.

Always recommend the `notification_banner` embedded component for connected account dashboards because it surfaces evolving requirements and account health issues.

## Business Model Mapping

| Business model | Dashboard | Fees | Losses | Charge pattern |
| --- | --- | --- | --- | --- |
| Marketplace or on-demand services | `express` | `application` | `application` | Destination charges |
| SaaS platform with payments | `full` | `stripe` | `stripe` | Direct charges |
| E-commerce enabler | `full` | `stripe` | `stripe` | Direct charges |
| Crowdfunding or hold-and-release | `express` | `application` | `application` | Separate charges and transfers |
| Multi-seller cart | `express` | `application` | `application` | Separate charges and transfers |
| Advanced white-label commerce | `none` | `application` | `application` | Destination or direct, depending on merchant-of-record design |

First decide who owns the customer relationship:

- If sellers own their storefront, brand, customer relationship, and accept payments through their own business, use SaaS/direct charges.
- If the platform aggregates sellers and the buyer checks out through the platform, use marketplace/destination charges.
- If one payment must be split across multiple sellers or funds must be held and released later, use separate charges and transfers.

## Charge Pattern Rules

- Direct charges: charge is created on the connected account; connected account is merchant of record; platform fee can use `application_fee_amount`.
- Destination charges: platform is merchant of record and funds auto-transfer after payment success; platform fee can use `application_fee_amount`.
- Separate charges and transfers: platform controls transfer timing; collect fees by transferring less than the charge amount. Do not use `application_fee_amount`.

## Capability Requests

Marketplace recipient accounts usually need recipient configuration with `stripe_transfers` on `stripe_balance`. Do not request merchant/card payment capabilities unless the account must be merchant of record.

SaaS merchant accounts need merchant configuration and card payment capabilities for direct charges.

## Embedded Components and Onboarding

Default to Stripe-hosted or embedded onboarding. Avoid API-only onboarding unless the platform is prepared to build all remediation and compliance UX.

Baseline embedded components:

- `account_onboarding`
- `notification_banner`
- `account_management`

Add payments, disputes, payouts, reporting, or reconciliation components based on product needs.

## Blocked or Risky Combinations

Never recommend:

- `losses_collector: "stripe"` with destination charges or separate charges and transfers.
- `application_fee_amount` with separate charges and transfers.
- Express dashboard with `losses_collector: "stripe"`.
- `dashboard: "none"` as a default.
- Destination charges for hold-and-release.
- v1 Customer objects to bill connected accounts in v2 subscription platforms.

Use caution with `dashboard: "full"` for destination or separate charges because functionality is limited; prefer `express` for those marketplace patterns.

## Review Checklist

- Accounts v2, not legacy account `type` creation.
- v2 capability checks, not `charges_enabled`/`payouts_enabled`.
- Dashboard, fee, and loss responsibility align with business model.
- Charge pattern matches merchant-of-record and payout timing.
- Webhooks and embedded account health UI are included.
