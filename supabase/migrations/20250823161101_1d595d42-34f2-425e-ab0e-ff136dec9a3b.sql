-- Ensure medical-images bucket is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-images', 'medical-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Medical images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload medical images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their clinic medical images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their clinic medical images" ON storage.objects;

-- Create new storage policies for medical images
CREATE POLICY "Medical images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-images');

CREATE POLICY "Authenticated users can upload medical images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their clinic medical images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their clinic medical images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);