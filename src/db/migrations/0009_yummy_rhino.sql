ALTER TABLE "cast" DROP CONSTRAINT "cast_user_unique";--> statement-breakpoint
ALTER TABLE "cast" ADD CONSTRAINT "cast_user_story_unique" UNIQUE("user_id","story_id");