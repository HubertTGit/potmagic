CREATE TYPE "public"."part_role" AS ENUM('body', 'head', 'jaw', 'eye-left', 'eye-right', 'pupil-left', 'pupil-right', 'eye-brow-left', 'eye-brow-right', 'eye-closed-left', 'eye-closed-right', 'arm-upper-left', 'arm-forearm-left', 'arm-hand-left', 'arm-upper-right', 'arm-forearm-right', 'arm-hand-right', 'leg-upper-left', 'leg-lower-left', 'leg-foot-left', 'leg-upper-right', 'leg-lower-right', 'leg-foot-right');--> statement-breakpoint
ALTER TYPE "public"."prop_type" ADD VALUE 'part';--> statement-breakpoint
ALTER TYPE "public"."prop_type" ADD VALUE 'composite';--> statement-breakpoint
CREATE TABLE "character_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"part_role" "part_role" NOT NULL,
	"prop_id" text NOT NULL,
	"alt_prop_id" text,
	"anchor_x" real DEFAULT 0.5 NOT NULL,
	"anchor_y" real DEFAULT 0.5 NOT NULL,
	"offset_x" real DEFAULT 0 NOT NULL,
	"offset_y" real DEFAULT 0 NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"rotation" real DEFAULT 0 NOT NULL,
	"image_url" text,
	"alt_image_url" text,
	CONSTRAINT "character_parts_unique" UNIQUE("character_id","part_role")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"composite_prop_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_parts" ADD CONSTRAINT "character_parts_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_parts" ADD CONSTRAINT "character_parts_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_parts" ADD CONSTRAINT "character_parts_alt_prop_id_props_id_fk" FOREIGN KEY ("alt_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_composite_prop_id_props_id_fk" FOREIGN KEY ("composite_prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "characters_story_id_idx" ON "characters" USING btree ("story_id");