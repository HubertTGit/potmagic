CREATE TYPE "public"."part_animal" AS ENUM('body', 'head', 'mouth', 'eye-left', 'eye-right', 'pupil-left', 'pupil-right', 'eye-brow-left', 'eye-brow-right', 'torso', 'arm-upper-left', 'arm-forearm-left', 'arm-hand-left', 'arm-upper-right', 'arm-forearm-right', 'arm-hand-right', 'neck', 'tail', 'leg-upper-left', 'leg-lower-left', 'foot-left', 'leg-upper-right', 'leg-lower-right', 'foot-right');--> statement-breakpoint
ALTER TYPE "public"."part_role" RENAME TO "part_human";--> statement-breakpoint
CREATE TABLE "character_animal_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"part_role" "part_animal" NOT NULL,
	"prop_id" text NOT NULL,
	"alt_prop_id" text,
	"pivot_x" real DEFAULT 0 NOT NULL,
	"pivot_y" real DEFAULT 0 NOT NULL,
	"pos_x" real DEFAULT 0 NOT NULL,
	"pos_y" real DEFAULT 0 NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"rotation" real DEFAULT 0 NOT NULL,
	"image_url" text,
	"alt_image_url" text,
	CONSTRAINT "character_animal_parts_unique" UNIQUE("character_id","part_role")
);
--> statement-breakpoint
CREATE TABLE "characters_animal" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"composite_prop_id" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_parts" RENAME TO "character_human_parts";--> statement-breakpoint
ALTER TABLE "characters" RENAME TO "characters_human";--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP CONSTRAINT "character_parts_unique";--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP CONSTRAINT "character_parts_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP CONSTRAINT "character_parts_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP CONSTRAINT "character_parts_alt_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "characters_human" DROP CONSTRAINT "characters_story_id_stories_id_fk";
--> statement-breakpoint
ALTER TABLE "characters_human" DROP CONSTRAINT "characters_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "characters_human" DROP CONSTRAINT "characters_composite_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "character_human_parts" ALTER COLUMN "part_role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."part_human";--> statement-breakpoint
CREATE TYPE "public"."part_human" AS ENUM('body', 'head', 'mouth', 'eye-left', 'eye-right', 'pupil-left', 'pupil-right', 'eye-brow-left', 'eye-brow-right', 'torso', 'arm-upper-left', 'arm-forearm-left', 'arm-hand-left', 'arm-upper-right', 'arm-forearm-right', 'arm-hand-right');--> statement-breakpoint
ALTER TABLE "character_human_parts" ALTER COLUMN "part_role" SET DATA TYPE "public"."part_human" USING "part_role"::"public"."part_human";--> statement-breakpoint
DROP INDEX "characters_story_id_idx";--> statement-breakpoint
ALTER TABLE "character_animal_parts" ADD CONSTRAINT "character_animal_parts_character_id_characters_animal_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters_animal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_animal_parts" ADD CONSTRAINT "character_animal_parts_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_animal_parts" ADD CONSTRAINT "character_animal_parts_alt_prop_id_props_id_fk" FOREIGN KEY ("alt_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_animal" ADD CONSTRAINT "characters_animal_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_animal" ADD CONSTRAINT "characters_animal_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_animal" ADD CONSTRAINT "characters_animal_composite_prop_id_props_id_fk" FOREIGN KEY ("composite_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "characters_animal_story_id_idx" ON "characters_animal" USING btree ("story_id");--> statement-breakpoint
ALTER TABLE "character_human_parts" ADD CONSTRAINT "character_human_parts_character_id_characters_human_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters_human"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_human_parts" ADD CONSTRAINT "character_human_parts_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_human_parts" ADD CONSTRAINT "character_human_parts_alt_prop_id_props_id_fk" FOREIGN KEY ("alt_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_human" ADD CONSTRAINT "characters_human_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_human" ADD CONSTRAINT "characters_human_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters_human" ADD CONSTRAINT "characters_human_composite_prop_id_props_id_fk" FOREIGN KEY ("composite_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "characters_human_story_id_idx" ON "characters_human" USING btree ("story_id");--> statement-breakpoint
ALTER TABLE "character_human_parts" ADD CONSTRAINT "character_human_parts_unique" UNIQUE("character_id","part_role");