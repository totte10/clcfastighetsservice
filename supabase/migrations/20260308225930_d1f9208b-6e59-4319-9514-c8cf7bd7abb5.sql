
CREATE TABLE public.address_time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('tidx', 'egna')),
  entry_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  hours numeric GENERATED ALWAYS AS (
    CASE WHEN end_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 
      ELSE NULL 
    END
  ) STORED,
  note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.address_time_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all logs (team visibility)
CREATE POLICY "Authenticated can read time logs" ON public.address_time_logs
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own logs
CREATE POLICY "Users can insert own time logs" ON public.address_time_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update own time logs" ON public.address_time_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete own time logs" ON public.address_time_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all time logs" ON public.address_time_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
