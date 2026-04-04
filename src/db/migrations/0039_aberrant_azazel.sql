ALTER TABLE "character_animal_parts" DROP CONSTRAINT "character_animal_parts_alt_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP CONSTRAINT "character_human_parts_alt_prop_id_props_id_fk";
--> statement-breakpoint
ALTER TABLE "character_animal_parts" ADD COLUMN "alt_image_url_2" text;--> statement-breakpoint
ALTER TABLE "character_human_parts" ADD COLUMN "alt_image_url_2" text;--> statement-breakpoint
ALTER TABLE "character_animal_parts" DROP COLUMN "alt_prop_id";--> statement-breakpoint
ALTER TABLE "character_human_parts" DROP COLUMN "alt_prop_id";