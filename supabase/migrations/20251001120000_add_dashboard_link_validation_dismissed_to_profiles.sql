-- Add column to store dashboard link validation dismissal per profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dashboard_link_validation_dismissed boolean DEFAULT false;

-- Backfill existing rows to false explicitly (no-op but explicit)
UPDATE public.profiles SET dashboard_link_validation_dismissed = false WHERE dashboard_link_validation_dismissed IS NULL;
