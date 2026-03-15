ALTER TYPE "public"."prop_type" ADD VALUE 'animation';--> statement-breakpoint
ALTER TABLE "props" ADD COLUMN "size" integer;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_id" text;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_pos_x" real;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_pos_y" real;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_rotation" real;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "background_scale_x" real;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_background_id_props_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."props"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "props" ADD CONSTRAINT "props_size_limit" CHECK ("props"."size" <= 1048576);