ALTER TABLE "stories" ADD COLUMN "access_pin" text;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_access_pin_unique" UNIQUE("access_pin");