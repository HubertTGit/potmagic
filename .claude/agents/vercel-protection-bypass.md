---
name: vercel-protection-bypass
model: haiku
description: Reference agent for Vercel Protection Bypass for Automation — bypassing Deployment Protection for CI/CD, E2E tests, and webhooks using the x-vercel-protection-bypass header or query parameter.
---

# Vercel Protection Bypass for Automation

**Docs:** https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

## What it is

Allows automated tools (E2E tests, CI/CD pipelines, monitoring, third-party webhooks) to access protected Vercel deployments without triggering authentication challenges.

---

## What gets bypassed

- Password Protection
- Vercel Authentication
- Trusted IPs checks
- Vercel Firewall system mitigations
- Bot protection challenges

## What does NOT get bypassed

- Active DDoS mitigations (blocked IPs/subnets/patterns during an attack)
- Rate limits applied during detected attacks
- Security challenges triggered by attack patterns

---

## Setup

1. Go to **Project Settings → Deployment Protection** in the Vercel dashboard
2. Generate a bypass secret (you can create multiple per project for different tools, e.g. "CI/CD pipeline", "Playwright tests")
3. Vercel automatically sets `VERCEL_AUTOMATION_BYPASS_SECRET` as a system environment variable on your deployments

> ⚠️ Regenerating or deleting a secret invalidates all previous deployments. Redeploy after updating the secret.

---

## Using the Bypass

Pass the secret via **header** (recommended) or **query parameter**.

### Method 1: HTTP header (recommended)

```http
x-vercel-protection-bypass: <your-generated-secret>
```

### Method 2: Query parameter

For tools that cannot set custom headers (Slack, Stripe, GitHub webhooks, etc.):

```
https://your-deployment.vercel.app/api/endpoint?x-vercel-protection-bypass=<your-secret>
```

---

## In-Browser / Cookie-Based Bypass

For follow-up requests in browser-based E2E tests, set an additional header/param to persist the bypass as a cookie:

```http
x-vercel-set-bypass-cookie: true
```

For cross-origin / iframe contexts (sets `SameSite=None`):

```http
x-vercel-set-bypass-cookie: samesitenone
```

---

## Examples

### Playwright (`playwright.config.ts`)

```typescript
const config: PlaywrightTestConfig = {
  use: {
    extraHTTPHeaders: {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "true", // optional — persists bypass as cookie for in-browser tests
    },
  },
};
```

### Slack Bot Webhook URL

Slack's verification request cannot include custom headers — use the query param:

```json
{
  "settings": {
    "event_subscriptions": {
      "request_url": "https://your-app.vercel.app/api/slack/events?x-vercel-protection-bypass=your-secret"
    },
    "interactivity": {
      "request_url": "https://your-app.vercel.app/api/slack/interactions?x-vercel-protection-bypass=your-secret"
    }
  }
}
```

### Stripe / GitHub Webhooks

```bash
# Stripe webhook URL in dashboard
https://your-app.vercel.app/api/stripe-webhook?x-vercel-protection-bypass=your-secret

# GitHub webhook URL
https://your-app.vercel.app/api/github-webhook?x-vercel-protection-bypass=your-secret
```

---

## Environment Variables

| Variable                          | Purpose                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Auto-set system env var pointing to your chosen bypass secret. Use this in test configs — never hardcode the raw secret. |

When you have multiple secrets, you can choose which one maps to `VERCEL_AUTOMATION_BYPASS_SECRET` in project settings.

---

## Permissions

- Team members with at least **Member** role
- Project members with **Project Administrator** role
