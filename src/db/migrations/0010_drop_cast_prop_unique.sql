-- Allow the same prop to be assigned to actors across multiple stories
ALTER TABLE "cast" DROP CONSTRAINT IF EXISTS "cast_prop_id_unique";
