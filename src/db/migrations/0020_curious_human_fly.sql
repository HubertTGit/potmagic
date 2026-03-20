ALTER TABLE "props" DROP CONSTRAINT "props_size_limit";--> statement-breakpoint
ALTER TABLE "props" ADD CONSTRAINT "props_size_limit" CHECK ("props"."size" <= 5242880);