CREATE TYPE "public"."subscription" AS ENUM('standard', 'pro', 'teams');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription" "subscription" DEFAULT 'standard' NOT NULL;