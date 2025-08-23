-- Make invoice_id nullable in payments table to allow standalone payments
ALTER TABLE public.payments 
ALTER COLUMN invoice_id DROP NOT NULL;