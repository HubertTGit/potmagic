CREATE TYPE "public"."ik_direction" AS ENUM('cw', 'ccw');--> statement-breakpoint
ALTER TABLE "characters_human" ADD COLUMN "ik_left_direction" "ik_direction" DEFAULT 'ccw' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters_human" ADD COLUMN "ik_right_direction" "ik_direction" DEFAULT 'cw' NOT NULL;