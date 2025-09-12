-- Create treatment_plans table
CREATE TABLE public.treatment_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  estimated_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  start_date date,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create treatment plans for their clinic" 
ON public.treatment_plans 
FOR INSERT 
WITH CHECK (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can view their clinic treatment plans" 
ON public.treatment_plans 
FOR SELECT 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic treatment plans" 
ON public.treatment_plans 
FOR UPDATE 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic treatment plans" 
ON public.treatment_plans 
FOR DELETE 
USING (clinic_id = ( SELECT get_current_user_profile.id FROM get_current_user_profile()));

-- Add treatment_plan_id to existing invoices table (optional - can link invoices to treatment plans)
ALTER TABLE public.invoices 
ADD COLUMN treatment_plan_id uuid;

-- Add treatment_plan_id to existing payments table 
ALTER TABLE public.payments 
ADD COLUMN treatment_plan_id uuid;

-- Create trigger for updated_at
CREATE TRIGGER update_treatment_plans_updated_at
BEFORE UPDATE ON public.treatment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();