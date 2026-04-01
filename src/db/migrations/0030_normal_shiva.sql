ALTER TABLE "character_parts" ALTER COLUMN "part_role" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "character_parts" WHERE "part_role" LIKE 'leg-%';--> statement-breakpoint
DROP TYPE "public"."part_role";--> statement-breakpoint
CREATE TYPE "public"."part_role" AS ENUM('body', 'head', 'mouth', 'eye-left', 'eye-right', 'pupil-left', 'pupil-right', 'eye-brow-left', 'eye-brow-right', 'eye-closed-left', 'eye-closed-right', 'torso', 'arm-upper-left', 'arm-forearm-left', 'arm-hand-left', 'arm-upper-right', 'arm-forearm-right', 'arm-hand-right');--> statement-breakpoint
ALTER TABLE "character_parts" ALTER COLUMN "part_role" SET DATA TYPE "public"."part_role" USING "part_role"::"public"."part_role";