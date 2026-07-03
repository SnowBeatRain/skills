# Stripe Monitoring and Alerts

Use this reference for production metrics, alerts, degraded-mode behavior, and incident thresholds for Stripe integrations.

## Core Metrics

| Area | Metrics |
| --- | --- |
| Webhooks | delivery success rate, 4xx/5xx rate, processing latency, retry count, backlog, signature failures |
| Payments | success rate, decline rate, `requires_action` abandonment, async pending age, refund rate, dispute rate |
| Billing | invoice payment failure rate, dunning recovery, subscription cancellation spike, trial conversion, proration errors |
| Connect | capability inactive count, requirements due, transfer failures, payout failures, negative balance exposure |
| API | Stripe 4xx/5xx rate, 401/403 configuration errors, 429 rate limit, network timeout rate, latency |
| Operations | duplicate event prevented count, duplicate fulfillment blocked count, dead-letter queue size |

## Alert Priorities

| Priority | Trigger examples |
| --- | --- |
| P0 | live key exposure, webhook endpoint all failing, duplicate fulfillment, payment succeeded but no entitlement at scale |
| P1 | payment success rate drops sharply, invoice failures spike, API auth errors begin after deployment, Connect payouts fail broadly |
| P2 | one payment method degraded, dispute volume rises, onboarding remediation backlog grows |

## Webhook Alerts

Alert on sustained non-2xx deliveries, sudden signature verification failures, and event processing latency beyond the business SLA. A functioning payment integration can still fail operationally if webhooks are delayed.

## Payment and Billing Alerts

Segment by payment method, country, currency, and platform where useful. A regional payment method outage can be hidden in aggregate card success rates.

For Billing, monitor invoice payment failures and subscription state transitions. Failed invoices can become support and revenue problems before they become code errors.

## Connect Alerts

Platform integrations should monitor connected account requirements, inactive capabilities, disabled payouts, transfer failures, and dispute impact. Account remediation is an operational workflow, not just an API result.

## Degraded Mode

Define what the product does when Stripe or local webhook processing is degraded:

- pause high-risk fulfillment
- keep accepting orders but delay irreversible actions
- disable new paid signups temporarily
- queue webhook work for retry
- surface a support-safe status message

## Incident Notes

During incidents, preserve request IDs, event IDs, deployment IDs, account IDs, and a timeline of state changes. Use Stripe status page and Dashboard logs, but do not wait for external confirmation before protecting local fulfillment and transfer paths.
