# Stripe Security

## Credential Handling

Never hardcode Stripe keys in source code, examples, frontend bundles, mobile apps, logs, analytics, or error pages. Use a secrets vault where available; environment variables are acceptable only when they are not committed.

Prefer restricted API keys with minimum permissions over broad secret keys whenever a workload can use them. Use a separate key per service, environment, and permission boundary. Add IP allowlists where supported.

If a key may have been exposed:

1. Roll or delete the exposed key immediately in the Dashboard.
2. Review Workbench or request logs for unfamiliar activity.
3. Contact Stripe support if suspicious activity appears.
4. Replace integrations with least-privilege restricted keys and rotate old credentials.

## Client and Mobile

Never place privileged keys in client-side or mobile code. Most clients should call the application's backend, which then calls Stripe. For scoped client access, use short-lived mechanisms such as ephemeral keys where Stripe supports them.

## Webhook Security

Always verify webhook signatures using the webhook signing secret. Treat unverified webhook requests as spoofable and unsafe. For defense in depth, allowlist Stripe public IPs when the infrastructure supports it.

Webhook handlers must be idempotent. Store processed event IDs or equivalent dedupe state so retries do not double-fulfill orders, issue duplicate credits, or repeat transfers.

## OAuth and Dashboard Access

For Connect OAuth and related Stripe OAuth flows, generate an unguessable `state` per request and verify it in the callback to prevent CSRF.

For Dashboard access, recommend passkeys or authenticator apps over SMS 2FA. Larger teams should consider SAML SSO and SCIM provisioning/deprovisioning.

## Connect Security

Connect liability depends on account configuration, dashboard access, charge pattern, and who handles disputes/negative balances. Use hosted or embedded onboarding where possible; custom onboarding means the platform handles sensitive PII and remediation UX.

For modern Connect design decisions, read `references/connect.md` before giving security or liability advice.

## Review Checklist

- No credentials in code, logs, screenshots, docs, or test fixtures.
- Restricted keys and IP allowlists are considered.
- Key rotation plan exists for suspected exposure.
- Webhook signature verification is mandatory.
- OAuth uses `state` validation.
- Connect account configuration matches liability and operational capacity.
