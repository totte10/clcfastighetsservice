
-- Create areas table
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  blow_status TEXT NOT NULL DEFAULT 'pending' CHECK (blow_status IN ('pending', 'in-progress', 'done')),
  sweep_status TEXT NOT NULL DEFAULT 'pending' CHECK (sweep_status IN ('pending', 'in-progress', 'done')),
  images TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'clock' CHECK (type IN ('clock', 'manual')),
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  manual_start TIMESTAMP WITH TIME ZONE,
  manual_end TIMESTAMP WITH TIME ZONE,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active_clocks table for tracking who is clocked in
CREATE TABLE public.active_clocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL UNIQUE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_clocks ENABLE ROW LEVEL SECURITY;

-- Public access policies (team app, no auth required)
CREATE POLICY "Anyone can read areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert areas" ON public.areas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update areas" ON public.areas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete areas" ON public.areas FOR DELETE USING (true);

CREATE POLICY "Anyone can read time_entries" ON public.time_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert time_entries" ON public.time_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update time_entries" ON public.time_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete time_entries" ON public.time_entries FOR DELETE USING (true);

CREATE POLICY "Anyone can read active_clocks" ON public.active_clocks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert active_clocks" ON public.active_clocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update active_clocks" ON public.active_clocks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete active_clocks" ON public.active_clocks FOR DELETE USING (true);

-- Trigger for updated_at on areas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
