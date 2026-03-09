---
model: haiku
---

# Better Auth — Basic Usage Reference

> Source: https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/basic-usage.mdx

## Server Setup

### Enable Email & Password

```typescript
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true
    }
})
```

### Add Social Providers

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    emailAndPassword: { enabled: true },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }
    }
})
```

---

## Client Setup

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000", // your API base URL
});
```

With plugins:

```typescript
import { createAuthClient } from "better-auth/react";
import { somePlugin } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [somePlugin()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## Sign Up (Email/Password)

`POST /sign-up/email`

```typescript
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signUp.email({
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password1234",       // min 8, max 128 chars by default
    image?: "https://example.com/image.png",
    callbackURL?: "/dashboard"
}, {
    onRequest: (ctx) => {
        // show loading
    },
    onSuccess: (ctx) => {
        // redirect to dashboard or sign in page
    },
    onError: (ctx) => {
        alert(ctx.error.message);
    },
});
```

> Users are automatically signed in after successful sign-up by default (`autoSignIn: true`).

---

## Sign In (Email/Password)

`POST /sign-in/email`

```typescript
const { data, error } = await authClient.signIn.email({
    email: "john.doe@example.com",
    password: "password1234",
    rememberMe: true,               // false = sign out when browser closes
    callbackURL?: "/dashboard",
}, {
    onError: (ctx) => {
        if (ctx.error.status === 403) {
            alert("Please verify your email address");
        }
        alert(ctx.error.message);
    },
});
```

---

## Sign In (Social Provider)

```typescript
import { authClient } from "@/lib/auth-client";

await authClient.signIn.social({
    provider: "github",           // e.g. "github", "google", "apple"
    callbackURL: "/dashboard",
    errorCallbackURL: "/error",
    newUserCallbackURL: "/welcome",
    disableRedirect: false,       // set true to suppress automatic redirect
});
```

---

## Sign Out

```typescript
await authClient.signOut();
```

With redirect after sign-out:

```typescript
import { authClient } from "@/lib/auth-client"

await authClient.signOut({
    fetchOptions: {
        onSuccess: () => {
            router.push("/login"); // redirect to login page
        },
    },
});
```

---

## Email Verification

### Server config

```typescript
import { betterAuth } from "better-auth";
import { sendEmail } from "./email";

export const auth = betterAuth({
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            void sendEmail({  // avoid await to prevent timing attacks
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${url}`,
            });
        },
    },
});
```

> **Warning:** Avoid `await`-ing email sending to prevent timing attacks. On serverless, use `waitUntil` or similar.

### Require email verification before sign-in

```typescript
export const auth = betterAuth({
    emailAndPassword: {
        requireEmailVerification: true,
        onExistingUserSignUp: async ({ user }, request) => {
            // Notify existing user when someone tries to register with their email
            void sendEmail({ to: user.email, subject: "Sign-up attempt with your email", text: "..." });
        },
    },
});
```

When `requireEmailVerification: true`, sign-up returns a success response even for existing emails (enumeration protection).

### Trigger verification manually (client)

```typescript
import { authClient } from "@/lib/auth-client"

await authClient.sendVerificationEmail({
    email: "user@email.com",
    callbackURL: "/",
});
```

---

## Password Reset

### Server config

```typescript
export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            void sendEmail({
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            });
        },
        onPasswordReset: async ({ user }, request) => {
            console.log(`Password for ${user.email} has been reset.`);
        },
    },
});
```

### Request reset (client)

`POST /request-password-reset`

```typescript
// email: address to send reset link to
// redirectTo: page where user lands — receives ?token=... on success or ?error=INVALID_TOKEN
await authClient.requestPasswordReset({
    email: "john.doe@example.com",
    redirectTo: "https://example.com/reset-password",
});
```

### Complete reset (client)

`POST /reset-password`

```typescript
const token = new URLSearchParams(window.location.search).get("token");

const { data, error } = await authClient.resetPassword({
    newPassword: "password1234",
    token,  // from URL query param
});
```

---

## Change Password

`POST /change-password` (requires session)

```typescript
await authClient.changePassword({
    newPassword: "newpassword1234",
    currentPassword: "oldpassword1234",
    revokeOtherSessions: true,  // invalidate all other active sessions
});
```

> A user's password is stored in the `account` table (not `user`), with `providerId: "credential"`.

---

## `emailAndPassword` Configuration Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Enable email/password auth |
| `disableSignUp` | boolean | `false` | Disable sign-up |
| `minPasswordLength` | number | `8` | Minimum password length |
| `maxPasswordLength` | number | `128` | Maximum password length |
| `autoSignIn` | boolean | `true` | Auto sign-in after sign-up. `false` enables enumeration protection |
| `requireEmailVerification` | boolean | `false` | Require email verification before sign-in. Enables enumeration protection |
| `revokeSessionsOnPasswordReset` | boolean | `false` | Revoke all sessions on password reset |
| `resetPasswordTokenExpiresIn` | number | `3600` | Reset token TTL in seconds |
| `sendResetPassword` | function | — | Send password reset email |
| `onPasswordReset` | function | — | Callback after successful password reset |
| `onExistingUserSignUp` | function | — | Callback when existing email is used for sign-up (enumeration protection active) |
| `customSyntheticUser` | function | — | Build fake sign-up response for enumeration protection when plugins add user fields |
| `password.hash` | function | — | Custom password hashing function (default: scrypt) |
| `password.verify` | function | — | Custom password verification function |

### Custom password hashing (Argon2 example)

```typescript
// password.ts
import { hash, verify, type Options } from "@node-rs/argon2";

const opts: Options = { memoryCost: 65536, timeCost: 3, parallelism: 4, outputLen: 32, algorithm: 2 };

export const hashPassword = (password: string) => hash(password, opts);
export const verifyPassword = ({ password, hash }: { password: string; hash: string }) =>
    verify(hash, password, opts);

// auth.ts
export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        password: { hash: hashPassword, verify: verifyPassword },
    },
});
```

---

## Session (React)

### Hook (reactive)

```tsx
import { authClient } from "@/lib/auth-client";

export function UserProfile() {
    const {
        data: session,
        isPending,   // loading state
        error,       // error object
        refetch      // refetch the session
    } = authClient.useSession();

    if (isPending) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!session) return <div>Not logged in</div>;

    return (
        <div>
            <p>Welcome, {session.user.name}!</p>
            <p>Email: {session.user.email}</p>
            <button onClick={() => authClient.signOut()}>Sign Out</button>
        </div>
    );
}
```

---

## Plugins

Plugins extend both the server auth instance and the client. Pass them in the `plugins` array on each side:

**Server:**
```typescript
import { betterAuth } from "better-auth";
import { somePlugin } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [somePlugin()]
});
```

**Client:**
```typescript
import { createAuthClient } from "better-auth/client";
import { somePluginClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [somePluginClient()]
});
```

Common plugins: `twoFactor`, `username`, `magicLink`, `passkey`, `organization`, `admin`.

---

## This Project's Auth Setup

> See @SPEC.md for full product specification, data models, and API endpoints.

- Server config: `src/lib/auth.ts` — mounted at `/api/auth/*` via Hono
- Client config: `src/lib/auth-client.ts`
- Users have a custom `role` field (`actor` | `director`)
- Route guards use TanStack Router `beforeLoad`
- Database: SQLite via Drizzle ORM adapter
