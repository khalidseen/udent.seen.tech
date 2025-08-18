-- Create service_prices table for managing treatment costs
CREATE TABLE public.service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL DEFAULT 'general',
  base_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled'))
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card')),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Enable RLS
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_prices
CREATE POLICY "Users can view their clinic service prices" ON public.service_prices
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create service prices for their clinic" ON public.service_prices
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic service prices" ON public.service_prices
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic service prices" ON public.service_prices
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for invoices
CREATE POLICY "Users can view their clinic invoices" ON public.invoices
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create invoices for their clinic" ON public.invoices
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic invoices" ON public.invoices
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic invoices" ON public.invoices
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view invoice items for their clinic invoices" ON public.invoice_items
FOR SELECT USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = (SELECT id FROM get_current_user_profile())));

CREATE POLICY "Users can create invoice items for their clinic invoices" ON public.invoice_items
FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = (SELECT id FROM get_current_user_profile())));

CREATE POLICY "Users can update invoice items for their clinic invoices" ON public.invoice_items
FOR UPDATE USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = (SELECT id FROM get_current_user_profile())));

CREATE POLICY "Users can delete invoice items for their clinic invoices" ON public.invoice_items
FOR DELETE USING (invoice_id IN (SELECT id FROM public.invoices WHERE clinic_id = (SELECT id FROM get_current_user_profile())));

-- Create RLS policies for payments
CREATE POLICY "Users can view their clinic payments" ON public.payments
FOR SELECT USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can create payments for their clinic" ON public.payments
FOR INSERT WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic payments" ON public.payments
FOR UPDATE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic payments" ON public.payments
FOR DELETE USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create function to update invoice totals
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice totals when invoice items change
  UPDATE public.invoices SET
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM public.invoice_items
      WHERE invoice_id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
        ELSE NEW.invoice_id
      END
    ),
    updated_at = now()
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
    ELSE NEW.invoice_id
  END;

  -- Update total_amount and balance_due
  UPDATE public.invoices SET
    total_amount = subtotal - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0),
    balance_due = subtotal - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0) - COALESCE(paid_amount, 0),
    updated_at = now()
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
    ELSE NEW.invoice_id
  END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create function to update invoice payment totals
CREATE OR REPLACE FUNCTION public.update_invoice_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Update paid_amount when payments change
  UPDATE public.invoices SET
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE invoice_id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
        ELSE NEW.invoice_id
      END
      AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
    ELSE NEW.invoice_id
  END;

  -- Update balance_due and status
  UPDATE public.invoices SET
    balance_due = total_amount - paid_amount,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'pending'
      ELSE status
    END,
    updated_at = now()
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.invoice_id
    ELSE NEW.invoice_id
  END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_totals();

CREATE TRIGGER update_invoice_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_payments();

CREATE TRIGGER update_service_prices_updated_at
  BEFORE UPDATE ON public.service_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number(clinic_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-[0-9]{4}-[0-9]+$' 
      THEN (regexp_split_to_array(invoice_number, '-'))[3]::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices 
  WHERE clinic_id = clinic_id_param
  AND invoice_number LIKE 'INV-' || year_suffix || '-%';
  
  RETURN 'INV-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;