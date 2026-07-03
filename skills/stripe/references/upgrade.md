# Upgrading Stripe

Use this guide for upgrading Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook handlers.

## Version Model

Stripe API versions are date-based and can change request or response behavior. Backward-compatible changes include new resources, optional parameters, response fields, opaque string length changes, and new webhook event types. Breaking changes include field removals/renames, behavior changes, and removed endpoints or parameters.

Always review the API changelog and product-specific upgrade notes between the current and target versions.

## SDK Versioning

Dynamically typed server SDKs such as Node.js, Python, Ruby, and PHP can usually set an explicit API version in client configuration or per request.

Strongly typed SDKs such as Java, Go, and .NET are tied to generated types. Prefer upgrading the SDK to a version whose generated types match the target API version rather than forcing mismatched response shapes.

Stripe.js follows an evergreen major-release model. Versioned Stripe.js paths pair with corresponding API versions; do not assume the frontend can override that pairing.

Mobile SDKs generally follow platform versioning rules. Backend API versions remain compatible unless Stripe documentation says otherwise, but frontend/mobile SDK changes still require testing payment flows.

## Upgrade Checklist

1. Detect current API version in code, Dashboard, request headers, SDK config, and webhook endpoint settings.
2. Identify target version and whether the user intentionally pinned it.
3. Read the API changelog and product-specific upgrade guide for every version jump.
4. Update server SDK package versions.
5. Set explicit API version where the SDK model supports it.
6. Test requests with the target API version before changing account defaults.
7. Update webhook handlers for new event structures and unknown event tolerance.
8. Update Stripe.js and mobile SDKs if the target frontend path requires it.
9. Confirm database columns that store Stripe object IDs are case-sensitive and can hold at least 255 characters.
10. Run integration tests and test-mode flows before promoting live configuration.

## Testing Pattern

Use a request-level `Stripe-Version` header or SDK-specific override in test mode to compare current and target behavior. Do not upgrade the account default first.

## Review Checklist

- Current and target versions are explicit.
- SDK and API version pairing is coherent.
- Webhook endpoints are tested against target event payloads.
- Unknown event types are handled gracefully.
- Object ID storage is long enough and case-sensitive.
- Rollback path is documented for production rollout.
