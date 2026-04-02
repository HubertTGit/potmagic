ALTER TABLE "props" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."prop_type";--> statement-breakpoint
CREATE TYPE "public"."prop_type" AS ENUM('background', 'character', 'animation', 'sound', 'rive', 'composite-human', 'composite-animal');--> statement-breakpoint
ALTER TABLE "props" ALTER COLUMN "type" SET DATA TYPE "public"."prop_type" USING "type"::"public"."prop_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'::text;--> statement-breakpoint
DROP TYPE "public"."subscription";--> statement-breakpoint
CREATE TYPE "public"."subscription" AS ENUM('free', 'pro', 'affiliate');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'::"public"."subscription";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" SET DATA TYPE "public"."subscription" USING "subscription"::"public"."subscription";