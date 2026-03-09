
-- Add project_number to existing tables
ALTER TABLE public.tidx_entries ADD COLUMN project_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.egna_entries ADD COLUMN project_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.user_time_entries ADD COLUMN project_number TEXT NOT NULL DEFAULT '';

-- Create projects table for standalone projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_number TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-generate project numbers via a sequence
CREATE SEQUENCE public.project_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
    NEW.project_number := 'P-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.project_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Apply auto-generate trigger to all tables with project_number
CREATE TRIGGER auto_project_number_projects
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.generate_project_number();

CREATE TRIGGER auto_project_number_tidx
  BEFORE INSERT ON public.tidx_entries
  FOR EACH ROW EXECUTE FUNCTION public.generate_project_number();

CREATE TRIGGER auto_project_number_egna
  BEFORE INSERT ON public.egna_entries
  FOR EACH ROW EXECUTE FUNCTION public.generate_project_number();

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
