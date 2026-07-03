# Stripe Identity Verification

Use this reference for Stripe Identity, VerificationSessions, document checks, liveness/selfie checks, PII handling, and the boundary between identity verification and regulated KYC.

## When to Use

Use Stripe Identity when the product needs to verify a person with document, selfie, or identity data flows supported by Stripe. For Connect onboarding requirements, first check whether Connect-hosted onboarding already satisfies the platform need.

## Verification Sessions

A VerificationSession tracks the customer-facing verification flow and result. Store the session ID, local user/account ID, status, required action, and reviewed outcome.

Use webhooks to update local state. Do not grant irreversible access solely because the frontend returned from a verification flow.

## Privacy

Identity flows can involve highly sensitive personal data. Minimize local storage, avoid logging raw payloads, and document why verification is required. Respect data retention, deletion, and access policies.

## Boundary with KYC and Compliance

Stripe Identity is not automatically a substitute for all KYC, AML, sanctions, age-gating, marketplace, or financial-services obligations. Confirm the compliance requirement and jurisdiction before presenting it as sufficient.

## Common Mistakes

- Storing identity document images locally without a compliance reason.
- Treating a started session as verified.
- Ignoring failed or requires-input outcomes.
- Confusing Connect onboarding requirements with standalone Identity sessions.
- Logging PII in webhook diagnostics.
