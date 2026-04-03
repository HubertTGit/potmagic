CREATE INDEX "characters_animal_created_by_idx" ON "characters_animal" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "characters_animal_composite_prop_id_idx" ON "characters_animal" USING btree ("composite_prop_id");--> statement-breakpoint
CREATE INDEX "characters_human_created_by_idx" ON "characters_human" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "characters_human_composite_prop_id_idx" ON "characters_human" USING btree ("composite_prop_id");--> statement-breakpoint
CREATE INDEX "props_created_by_idx" ON "props" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "props_type_idx" ON "props" USING btree ("type");