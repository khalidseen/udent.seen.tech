-- Create medical-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-images', 'medical-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for medical images
CREATE POLICY IF NOT EXISTS "Medical images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload medical images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY IF NOT EXISTS "Users can update their clinic medical images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY IF NOT EXISTS "Users can delete their clinic medical images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
);