ALTER TABLE "cast" DROP CONSTRAINT "cast_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "scene_cast" ADD COLUMN "prop_id" text;--> statement-breakpoint
ALTER TABLE "scene_cast" ADD CONSTRAINT "scene_cast_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cast" DROP COLUMN "prop_id";