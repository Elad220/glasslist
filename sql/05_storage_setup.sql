-- Setup Storage for Shopping List Item Images

-- Create storage bucket for shopping list images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for shopping list images
-- Policy: Users can upload images for their own items
CREATE POLICY "Users can upload item images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'item-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view all images (public bucket)
CREATE POLICY "Anyone can view item images" ON storage.objects
FOR SELECT USING (bucket_id = 'item-images');

-- Policy: Users can update their own item images
CREATE POLICY "Users can update own item images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'item-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own item images
CREATE POLICY "Users can delete own item images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'item-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 