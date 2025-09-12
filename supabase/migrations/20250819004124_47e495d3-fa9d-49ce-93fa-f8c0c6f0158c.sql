-- Create medical supplies/inventory tables
CREATE TABLE public.medical_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  brand TEXT,
  unit TEXT NOT NULL DEFAULT 'piece',
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 10,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  supplier_contact TEXT,
  expiry_date DATE,
  batch_number TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  supply_id UUID NOT NULL REFERENCES public.medical_supplies(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'purchase', 'usage', 'waste', 'adjustment'
  reference_id UUID, -- could link to purchase orders, treatments, etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  supplier_contact TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supply_id UUID REFERENCES public.medical_supplies(id),
  supply_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create medical images table for X-rays and other medical images
CREATE TABLE public.medical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL DEFAULT 'xray',
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  image_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tooth_number TEXT, -- for dental-specific images
  is_before_treatment BOOLEAN DEFAULT false,
  is_after_treatment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.medical_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medical_supplies
CREATE POLICY "Users can view their clinic supplies" ON public.medical_supplies
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create supplies for their clinic" ON public.medical_supplies
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic supplies" ON public.medical_supplies
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic supplies" ON public.medical_supplies
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view their clinic stock movements" ON public.stock_movements
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create stock movements for their clinic" ON public.stock_movements
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for purchase_orders
CREATE POLICY "Users can view their clinic purchase orders" ON public.purchase_orders
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create purchase orders for their clinic" ON public.purchase_orders
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic purchase orders" ON public.purchase_orders
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic purchase orders" ON public.purchase_orders
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for purchase_order_items
CREATE POLICY "Users can view purchase order items for their clinic" ON public.purchase_order_items
FOR SELECT USING (purchase_order_id IN (
  SELECT id FROM public.purchase_orders WHERE clinic_id = (SELECT id FROM get_current_user_profile())
));

CREATE POLICY "Users can create purchase order items for their clinic" ON public.purchase_order_items
FOR INSERT WITH CHECK (purchase_order_id IN (
  SELECT id FROM public.purchase_orders WHERE clinic_id = (SELECT id FROM get_current_user_profile())
));

CREATE POLICY "Users can update purchase order items for their clinic" ON public.purchase_order_items
FOR UPDATE USING (purchase_order_id IN (
  SELECT id FROM public.purchase_orders WHERE clinic_id = (SELECT id FROM get_current_user_profile())
));

CREATE POLICY "Users can delete purchase order items for their clinic" ON public.purchase_order_items
FOR DELETE USING (purchase_order_id IN (
  SELECT id FROM public.purchase_orders WHERE clinic_id = (SELECT id FROM get_current_user_profile())
));

-- Create RLS policies for medical_records
CREATE POLICY "Users can view their clinic medical records" ON public.medical_records
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create medical records for their clinic" ON public.medical_records
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic medical records" ON public.medical_records
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic medical records" ON public.medical_records
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for medical_images
CREATE POLICY "Users can view their clinic medical images" ON public.medical_images
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create medical images for their clinic" ON public.medical_images
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic medical images" ON public.medical_images
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic medical images" ON public.medical_images
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_medical_supplies_updated_at
BEFORE UPDATE ON public.medical_supplies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_images_updated_at
BEFORE UPDATE ON public.medical_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically generate purchase order numbers
CREATE OR REPLACE FUNCTION public.generate_purchase_order_number(clinic_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN order_number ~ '^PO-[0-9]{4}-[0-9]+$' 
      THEN (regexp_split_to_array(order_number, '-'))[3]::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.purchase_orders 
  WHERE clinic_id = clinic_id_param
  AND order_number LIKE 'PO-' || year_suffix || '-%';
  
  RETURN 'PO-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Create storage bucket for medical images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-images',
  'medical-images',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/dicom']
);

-- Create storage policies for medical images
CREATE POLICY "Users can view medical images for their clinic" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload medical images for their clinic" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update medical images for their clinic" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete medical images for their clinic" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);