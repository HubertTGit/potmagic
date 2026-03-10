-- Storage RLS policies for the props bucket.
-- Supabase Storage enforces RLS on storage.objects independently of application tables.
-- The signed-URL upload flow runs as the anon role (the signed token is not the user's
-- session JWT), so INSERT must be permitted for both anon and authenticated.

CREATE POLICY "props_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'props');
--> statement-breakpoint

CREATE POLICY "props_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'props');
--> statement-breakpoint

CREATE POLICY "props_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'props');
