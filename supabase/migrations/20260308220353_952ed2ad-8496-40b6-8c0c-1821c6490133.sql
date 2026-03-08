
-- Create tidx_entries table
CREATE TABLE public.tidx_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  omrade TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  datum_planerat TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'done')),
  ansvarig TEXT NOT NULL DEFAULT '',
  kommentar TEXT NOT NULL DEFAULT '',
  timmar_maskin NUMERIC NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create egna_entries table
CREATE TABLE public.egna_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  datum_planerat TEXT NOT NULL DEFAULT '',
  blow_status TEXT NOT NULL DEFAULT 'pending' CHECK (blow_status IN ('pending', 'in-progress', 'done')),
  sweep_status TEXT NOT NULL DEFAULT 'pending' CHECK (sweep_status IN ('pending', 'in-progress', 'done')),
  ansvarig TEXT NOT NULL DEFAULT '',
  kommentar TEXT NOT NULL DEFAULT '',
  timmar NUMERIC NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tidx_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egna_entries ENABLE ROW LEVEL SECURITY;

-- Policies for tidx_entries
CREATE POLICY "Anyone can read tidx_entries" ON public.tidx_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tidx_entries" ON public.tidx_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tidx_entries" ON public.tidx_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tidx_entries" ON public.tidx_entries FOR DELETE USING (true);

-- Policies for egna_entries
CREATE POLICY "Anyone can read egna_entries" ON public.egna_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert egna_entries" ON public.egna_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update egna_entries" ON public.egna_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete egna_entries" ON public.egna_entries FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_tidx_entries_updated_at
  BEFORE UPDATE ON public.tidx_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_egna_entries_updated_at
  BEFORE UPDATE ON public.egna_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
