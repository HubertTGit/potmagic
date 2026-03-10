CREATE TABLE "scene_cast" (
  "id" text PRIMARY KEY NOT NULL,
  "scene_id" text NOT NULL,
  "cast_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scene_cast" ADD CONSTRAINT "scene_cast_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "scene_cast" ADD CONSTRAINT "scene_cast_cast_id_cast_id_fk" FOREIGN KEY ("cast_id") REFERENCES "public"."cast"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "scene_cast_scene_id_idx" ON "scene_cast" USING btree ("scene_id");
--> statement-breakpoint
ALTER TABLE "scene_cast" ADD CONSTRAINT "scene_cast_unique" UNIQUE("scene_id","cast_id");
