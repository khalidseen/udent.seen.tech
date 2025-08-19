-- Create RLS policies for medical images storage
CREATE POLICY "Authenticated users can upload medical images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'medical-images' AND
  auth.role() = 'authenticated' AND
  -- Allow uploads in clinic-specific folders: clinic_id/...
  (storage.foldername(name))[1]::uuid = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their clinic medical images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'medical-images' AND
  auth.role() = 'authenticated' AND
  -- Allow access to clinic-specific folders
  (storage.foldername(name))[1]::uuid = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their clinic medical images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'medical-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1]::uuid = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their clinic medical images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'medical-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1]::uuid = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);