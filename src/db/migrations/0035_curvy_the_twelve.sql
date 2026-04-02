CREATE TABLE "human_mouth_variation" (
	"id" text PRIMARY KEY NOT NULL,
	"prop_id" text NOT NULL,
	"variation_prop_id" text NOT NULL,
	"label" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "human_mouth_variation" ADD CONSTRAINT "human_mouth_variation_prop_id_props_id_fk" FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_mouth_variation" ADD CONSTRAINT "human_mouth_variation_variation_prop_id_props_id_fk" FOREIGN KEY ("variation_prop_id") REFERENCES "public"."props"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "human_mouth_variation_prop_id_idx" ON "human_mouth_variation" USING btree ("prop_id");