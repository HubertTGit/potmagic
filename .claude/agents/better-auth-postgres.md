---
model: haiku
---

# Better Auth — PostgreSQL Integration

> Source: https://www.better-auth.com/docs/integrations/postgresql

PostgreSQL is a powerful, open-source relational database management system known for its advanced features, extensibility, and support for complex queries and large datasets.

---

## Example Usage

Make sure you have PostgreSQL installed and configured, then connect it to Better Auth:

```ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: "postgres://user:password@localhost:5432/database",
  }),
});
```

> For more information, see Kysely's [PostgresDialect](https://kysely-org.github.io/kysely-apidoc/classes/PostgresDialect.html) docs.

---

## Schema Generation & Migration

The Better Auth CLI allows you to generate or migrate your database schema based on your Better Auth configuration and plugins.

| | PostgreSQL |
|---|---|
| Schema Generation | ✅ Supported |
| Schema Migration | ✅ Supported |

```bash
# Apply migrations
npx auth@latest migrate

# Generate schema files
npx auth@latest generate
```

---

## Joins (Experimental)

Database joins allow Better Auth to fetch related data from multiple tables in a single query. Endpoints like `/get-session` and `/get-full-organization` see 2–3× performance improvements.

The Kysely PostgreSQL dialect supports joins since v1.4.0:

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  experimental: { joins: true },
});
```

> You may need to run migrations after enabling this feature.

---

## Use a Non-Default Schema

In most cases the default schema is `public`. To use a non-default schema (e.g., `auth`):

### Option 1: Set search_path in connection string (Recommended)

```ts
export const auth = betterAuth({
  database: new Pool({
    connectionString: "postgres://user:password@localhost:5432/database?options=-c search_path=auth",
  }),
});
```

URL-encode if needed: `?options=-c%20search_path%3Dauth`.

### Option 2: Set search_path via Pool options

```ts
export const auth = betterAuth({
  database: new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "password",
    database: "my-db",
    options: "-c search_path=auth",
  }),
});
```

### Option 3: Set default schema for the database user

```sql
ALTER USER your_user SET search_path TO auth;
```

### Prerequisites

1. **Create the schema:**
   ```sql
   CREATE SCHEMA IF NOT EXISTS auth;
   ```

2. **Grant permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON SCHEMA auth TO your_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO your_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO your_user;
   ```

### How It Works

The Better Auth CLI migration system automatically detects your configured `search_path`:

- `npx auth migrate` inspects only tables in your configured schema
- Tables in other schemas (e.g., `public`) are ignored, preventing conflicts
- All new tables are created in your specified schema

### Troubleshooting

- **"relation does not exist"** — the schema doesn't exist or the user lacks permissions; create the schema and grant permissions as above.
- **Verify schema:** run `SHOW search_path;` — your custom schema should appear first.

---

## Additional Information

PostgreSQL is supported under the hood via the [Kysely](https://kysely.dev/) adapter. Any database supported by Kysely is also supported by Better Auth.

---

## This Project's Setup

> See @SPEC.md for full data models, API endpoints, and project architecture.

- Drizzle is configured in `src/lib/auth.ts` with a PostgreSQL database
- Provider: `"pg"`
- Schema tables: `users`, `characters`, `stories`, `cast`
- Run `pnpm drizzle-kit generate && pnpm drizzle-kit migrate` after schema changes
