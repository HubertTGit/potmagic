---
model: haiku
---

# Better Auth — SQLite Integration

> Source: https://www.better-auth.com/docs/adapters/sqlite

## Supported Drivers

### better-sqlite3 (Recommended)

```ts
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
});
```

### Node.js Built-in SQLite (Experimental)

Requires Node.js 22.5.0+. Still experimental — may change at any time.

```ts
import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";

export const auth = betterAuth({
  database: new DatabaseSync("database.sqlite"),
});
```

### Bun Built-in SQLite

Use `bunx --bun` for CLI commands to avoid `bun:sqlite` type errors (e.g. `bunx --bun auth@latest generate`).

```ts
import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
});
```

---

## Schema Generation & Migration

Both schema generation and migration are supported via the Better Auth CLI.

```bash
# Apply migrations
npx auth@latest migrate

# Generate schema files
npx auth@latest generate
```

---

## Experimental: Joins

Enables multi-table queries in a single round-trip. Endpoints like `/get-session` and `/get-full-organization` see 2–3× performance improvements.

Available since Better Auth v1.4.0 with the Kysely SQLite dialect.

```ts
export const auth = betterAuth({
  experimental: { joins: true },
});
```

> You may need to run migrations after enabling joins.

---

## Notes

> See @SPEC.md for full data models (`users`, `characters`, `stories`, `cast`) and project architecture.

- SQLite is powered internally by the [Kysely](https://kysely.dev/) adapter — any Kysely-supported database is also supported.
- This project uses `better-sqlite3` via Drizzle ORM (not Kysely directly) — see `src/lib/auth.ts`.
