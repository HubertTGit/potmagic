# Forgot Password — Design Document

**Date:** 2026-03-09

## Problem

The login page has no way for users to recover a forgotten password. We need a self-service reset flow.

## Approach

Use better-auth's built-in `forgetPassword` / `resetPassword` endpoints (no extra plugin required — already available via `emailAndPassword: { enabled: true }`), with Resend as the email transport.

---

## UI Design

### Login page (`src/routes/login.tsx`)

Add a third view state `'forgot'` alongside existing `'signin'` and `'register'`.

**Sign In view changes:**
- Add `"Forgot password?"` link below the password field
- Clicking it sets `view = 'forgot'`

**Forgot view:**
- Email field only
- "Send reset link" submit button (loading state while pending)
- "Back to sign in" text link
- On success: DaisyUI toast at bottom-right — `"Reset link sent to {email}"`
- Calls: `authClient.forgetPassword({ email, redirectTo: window.location.origin + '/reset-password' })`

### Reset password page (`src/routes/reset-password.tsx`) — new route

- Reads `token` query param from URL (`useSearch`)
- Shows new password + confirm password fields
- On submit: calls `authClient.resetPassword({ newPassword, token })`
- On success: redirects to `/login` with success toast
- On error (expired/invalid token): shows inline error message

---

## Backend

### `src/lib/auth.ts`

Add `sendResetPassword` callback to `emailAndPassword` config:

```ts
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ user, url }) => {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  },
},
```

### New package

```
pnpm add resend
```

### Env vars required

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key from resend.com dashboard |
| `FROM_EMAIL` | Verified sender address (e.g. `noreply@yourdomain.com`) |

---

## Auth Client

`authClient.forgetPassword()` and `authClient.resetPassword()` are already available from better-auth — no client-side changes to `auth-client.ts` needed.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/routes/login.tsx` | Add `'forgot'` view state, link, form, toast |
| `src/routes/reset-password.tsx` | Create new route |
| `src/lib/auth.ts` | Add `sendResetPassword` with Resend |
| `.env` (local) / deployment env | Add `RESEND_API_KEY`, `FROM_EMAIL` |

---

## Verification

1. `pnpm dev` — start dev server
2. Go to `/login` → click "Forgot password?" → verify email form appears
3. Submit a valid email → verify DaisyUI toast shows with the email address
4. Check Resend dashboard (or inbox) for reset email
5. Click link in email → verify `/reset-password?token=...` loads
6. Submit new password → verify redirect to `/login`
7. Sign in with new password — confirm it works
8. Try expired/invalid token URL — confirm error state shows
