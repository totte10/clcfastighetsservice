
-- Add images column to tidx_entries and egna_entries
ALTER TABLE public.tidx_entries ADD COLUMN images text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.egna_entries ADD COLUMN images text[] NOT NULL DEFAULT '{}'::text[];

-- Create storage bucket for entry images
INSERT INTO storage.buckets (id, name, public) VALUES ('entry-images', 'entry-images', true);

-- Allow anyone to upload to the bucket
CREATE POLICY "Anyone can upload entry images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'entry-images');
CREATE POLICY "Anyone can read entry images" ON storage.objects FOR SELECT USING (bucket_id = 'entry-images');
CREATE POLICY "Anyone can delete entry images" ON storage.objects FOR DELETE USING (bucket_id = 'entry-images');
