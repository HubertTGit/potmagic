ALTER TABLE "props" DROP CONSTRAINT "props_story_id_stories_id_fk";
--> statement-breakpoint
ALTER TABLE "props" ALTER COLUMN "story_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "props" ADD CONSTRAINT "props_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE set null ON UPDATE no action;