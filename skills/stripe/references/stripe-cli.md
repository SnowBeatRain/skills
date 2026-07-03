# Stripe CLI

Use this reference for local webhook forwarding, event simulation, account checks, and fast Stripe API debugging. The CLI is a development and diagnostic tool, not a production dependency.

## Basic Checks

```bash
stripe --version
stripe login
stripe config --list
```

Confirm which Stripe account the CLI is connected to before using it for debugging. If results disagree with Dashboard or app behavior, first check account and test/live mode.

## Webhook Forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a webhook signing secret for the forwarded endpoint. Use that value for the local process receiving the forwarded event. Do not mix it with Dashboard endpoint secrets.

## Trigger Standard Events

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

Triggered events are useful for handler shape and routing. They are not a substitute for a real app-created Checkout Session, PaymentIntent, Subscription, or Connect account test.

## Inspect and Debug

Use CLI output together with:

- Dashboard Events
- Workbench or request logs
- Webhook delivery logs
- local application logs containing Stripe request IDs and event IDs

If a CLI-triggered event works but a real flow fails, compare object IDs, account context, event type, API version, and live/test mode.

## Projects CLI

Stripe Projects has its own CLI plugin surface for provisioning third-party resources. Use `references/projects.md` for those commands and keep them separate from the general Stripe CLI workflow.

## Common Problems

| Symptom | Likely cause |
| --- | --- |
| Forwarding URL not reached | local server down, wrong route, HTTPS/proxy mismatch |
| Signature verification fails | wrong CLI signing secret or body parser changed raw body |
| Events appear in CLI but not app | wrong endpoint path, handler returns non-2xx, app logs hidden |
| Object not found | wrong test/live mode or connected account context |
| Trigger does not match app state | fixture event differs from objects your app creates |
