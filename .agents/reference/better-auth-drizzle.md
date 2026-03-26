---
model: haiku
---

# Better Auth — Drizzle ORM Adapter

> Source: https://www.better-auth.com/docs/adapters/drizzle

## Installation

```bash
pnpm add @better-auth/drizzle-adapter
```

## Basic Usage

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql" or "sqlite"
  }),
});
```

---

## Schema Generation & Migration

```bash
# Generate Better Auth schema
pnpm dlx auth@latest generate

# Generate Drizzle migration file
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate
```

---

## Experimental: Joins

Enables multi-table queries in a single round-trip. Available since v1.4.0.
Endpoints like `/get-session` and `/get-full-organization` see 2–3× speedups.

```ts
export const auth = betterAuth({
  experimental: { joins: true },
});
```

> Requires Drizzle relations to be defined in your schema. Run `pnpm dlx auth@latest generate` to get an up-to-date schema with relations, then pass each relation through the adapter's `schema` option.

---

## Modifying Table Names

If your Drizzle schema uses different table names (e.g. `users` instead of `user`), pass a `schema` map:

```ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { schema } from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users, // map Better Auth's "user" → your "users" table
    },
  }),
});
```

Alternatively, use `modelName` in the auth config:

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    modelName: "users",
  },
});
```

To automatically map all tables to their plural form:

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
});
```

---

## Modifying Field Names

Rename a column in the Drizzle schema without changing the property name — Better Auth continues to use the property name, your DB uses the column name:

```ts
export const user = pgTable("user", {
  email: text("email_address").notNull().unique(), // DB column = email_address
});
```

Or map it in the auth config `fields`:

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    fields: {
      email: "email_address",
    },
  },
});
```

---

## This Project's Setup

> See @SPEC.md for full data models, API endpoints, and project architecture.

- Drizzle is configured in `src/lib/auth.ts` with a PostgreSQL database
- Provider: `"pg"`
- Schema tables: `users`, `characters`, `stories`, `cast`
- Run `pnpm drizzle-kit generate && pnpm drizzle-kit migrate` after schema changes
