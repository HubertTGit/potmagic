ALTER TABLE "characters" DROP CONSTRAINT "characters_story_id_stories_id_fk";
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "story_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_stories_id_fk"
  FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id")
  ON DELETE set null ON UPDATE no action;
