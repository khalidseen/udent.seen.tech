-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_invoice_payments()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(clinic_id_param UUID)
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
$$;