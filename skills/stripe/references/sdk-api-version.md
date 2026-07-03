# Stripe SDK and API Versioning

Use this reference for Stripe client initialization, API version pinning, SDK upgrades, runtime boundaries, retries, and environment isolation.

## Version Sources

Stripe behavior can be influenced by several version surfaces:

| Surface | Where it is set | Why it matters |
| --- | --- | --- |
| Account default API version | Dashboard / account settings | Default for requests without an override |
| SDK pinned version | Stripe client configuration, where supported | Keeps application requests stable across account upgrades |
| Per-request version | Request option or `Stripe-Version` header | Useful for upgrade testing, not a permanent patchwork by default |
| Webhook endpoint version | Webhook endpoint configuration | Controls webhook payload shape for that endpoint |
| SDK package version | package manager | Controls client types, generated methods, retry behavior, and supported API surfaces |

Check all of these before diagnosing a version mismatch.

## Client Initialization

Server-side code should create Stripe clients from environment-provided secret or restricted keys. Frontend and mobile code must use publishable keys and client secrets or SDK-specific ephemeral access patterns, never secret keys.

Preferred properties of a server client factory:

- centralizes key loading
- records intended API version
- configures timeout and retry policy
- supports test/live separation
- supports Connect account context per request
- avoids logging credentials or client secrets

## API Version Strategy

For existing projects, preserve pinned versions until an upgrade is intentionally tested. For new projects, check current official docs and SDK release notes, then choose a version explicitly where the SDK supports it.

Do not upgrade the account default API version first. Test request-level or client-level changes, update webhook endpoint versions deliberately, and run real test-mode flows.

## SDK Upgrades

Before upgrading SDK major versions:

1. Read Stripe SDK release notes and API changelog.
2. Identify removed methods, renamed parameters, enum changes, and typing changes.
3. Run unit, integration, and webhook fixture tests.
4. Verify live/test environment variables still point to the intended account.
5. Confirm webhook endpoint payload versions.

Typed SDKs can surface compile-time errors but still need runtime tests. Dynamic language SDKs can pass type checks while breaking on payload shape or null fields.

## Retries and Timeouts

Configure finite timeouts. Let SDK retry policies handle safe transient failures where appropriate, but pair retried mutation requests with idempotency keys.

Distinguish:

- card declines and validation errors: business result, not infrastructure failure
- rate limits: backoff and reduce request fanout
- network timeouts: retry with idempotency key for create/mutate operations
- Stripe 5xx: retry with backoff and alert if sustained

## Environment Isolation

Keep separate values for:

- test secret key
- live secret key
- restricted keys
- publishable keys
- webhook endpoint signing secrets
- product and price IDs
- Connect account IDs
- Customer Portal configuration

`No such object` often means the code mixed test/live mode, wrong connected account context, or stale object IDs.

## Code Review Checklist

- Secret key is loaded only on the server.
- API version is explicit or intentionally documented.
- SDK package version is compatible with the target API version.
- Create/refund/transfer operations use idempotency keys.
- Webhook endpoint version is reviewed separately from SDK version.
- Frontend uses publishable key and server-created client secrets only.
