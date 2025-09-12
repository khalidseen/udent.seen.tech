-- Add columns for annotated images to medical_images table
ALTER TABLE public.medical_images 
ADD COLUMN annotated_image_path text,
ADD COLUMN annotation_data jsonb,
ADD COLUMN has_annotations boolean DEFAULT false;