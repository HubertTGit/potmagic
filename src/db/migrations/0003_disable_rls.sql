-- Disable RLS on all app tables.
-- All DB access goes through server functions that enforce auth at the
-- application layer (requireDirector / getSessionOrThrow), so Postgres
-- row-level security is redundant and blocks server-side inserts.
ALTER TABLE "props"         DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stories"       DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cast"          DISABLE ROW LEVEL SECURITY; -- cast is a reserved keyword, must be quoted
--> statement-breakpoint
ALTER TABLE "scenes"        DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users"         DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sessions"      DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "accounts"      DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "verifications" DISABLE ROW LEVEL SECURITY;
