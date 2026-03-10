
CREATE TABLE public.tmm_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  datum DATE NOT NULL,
  beskrivning TEXT NOT NULL DEFAULT '',
  ansvarig TEXT NOT NULL DEFAULT '',
  tid TEXT NOT NULL DEFAULT '',
  maskiner INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tmm_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tmm_entries" ON public.tmm_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tmm_entries" ON public.tmm_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tmm_entries" ON public.tmm_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete tmm_entries" ON public.tmm_entries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
