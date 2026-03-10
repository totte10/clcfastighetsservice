
CREATE TABLE public.optimal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  datum_start DATE NOT NULL,
  datum_end DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.optimal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read optimal_entries" ON public.optimal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert optimal_entries" ON public.optimal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update optimal_entries" ON public.optimal_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete optimal_entries" ON public.optimal_entries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
