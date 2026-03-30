ALTER TABLE "characters" DROP CONSTRAINT "characters_story_id_stories_id_fk";
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "story_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "character_parts" ADD COLUMN "pivot_x" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "character_parts" ADD COLUMN "pivot_y" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "character_parts" ADD COLUMN "pos_x" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "character_parts" ADD COLUMN "pos_y" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_parts" DROP COLUMN "anchor_x";--> statement-breakpoint
ALTER TABLE "character_parts" DROP COLUMN "anchor_y";--> statement-breakpoint
ALTER TABLE "character_parts" DROP COLUMN "offset_x";--> statement-breakpoint
ALTER TABLE "character_parts" DROP COLUMN "offset_y";