ALTER TABLE "users" ALTER COLUMN "subscription" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'standard'::text;--> statement-breakpoint
DROP TYPE "public"."subscription";--> statement-breakpoint
CREATE TYPE "public"."subscription" AS ENUM('standard', 'pro', 'advance');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'standard'::"public"."subscription";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DATA TYPE "public"."subscription" USING "subscription"::"public"."subscription";--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_repeat" boolean DEFAULT false NOT NULL;
