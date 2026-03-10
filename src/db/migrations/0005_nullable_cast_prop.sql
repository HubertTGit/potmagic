-- Make cast.prop_id nullable so actors can be added without a character assigned.
-- Props are now global (story_id IS NULL) and assigned separately after casting.
ALTER TABLE "cast" DROP CONSTRAINT "cast_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "cast" ALTER COLUMN "prop_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "cast" ADD CONSTRAINT "cast_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;
