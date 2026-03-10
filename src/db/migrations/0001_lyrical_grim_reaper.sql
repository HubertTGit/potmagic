ALTER TABLE "cast" DROP CONSTRAINT "cast_story_user_unique";--> statement-breakpoint
ALTER TABLE "cast" ADD CONSTRAINT "cast_user_unique" UNIQUE("user_id");