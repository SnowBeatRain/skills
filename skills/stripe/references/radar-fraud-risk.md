# Stripe Radar, Fraud, and Risk

Use this reference for fraud screening, Radar rules, reviews, risk signals, 3DS strategy, and delayed fulfillment decisions.

## Radar Role

Radar helps evaluate payment risk and apply rules or reviews. It does not replace tax compliance, KYC/AML obligations, identity verification, or the business's own fulfillment controls.

## Risk Workflow

High-risk payments should have an operational path:

1. payment created or confirmed
2. risk evaluation and rule outcome recorded
3. manual review or delayed fulfillment if needed
4. fulfillment only after local risk policy passes
5. dispute and refund outcomes fed back into operations

## Rules and Reviews

Radar rules can block, allow, require 3DS, or send payments to review depending on product and account capabilities. Keep rule changes controlled and documented; a rule can affect revenue and customer conversion immediately.

## 3DS and SCA

3DS is both an authentication and liability-shift tool where applicable. It is not a universal fraud solution. Test flows where authentication is required, fails, or is abandoned.

## Connect Risk

Platforms must define whether the platform or connected account owns fraud operations, disputes, fulfillment holds, and account remediation. A platform that controls checkout often needs platform-level monitoring even when connected accounts receive funds.

## Common Mistakes

- Fulfillment before asynchronous or risk-review completion.
- Treating a successful payment as proof the order is low risk.
- Letting client-submitted risk flags decide server behavior.
- Changing Radar rules without monitoring conversion and dispute impact.
- Assuming Radar covers identity, sanctions, tax, or regulatory compliance.
