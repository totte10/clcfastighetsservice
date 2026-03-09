
-- Create user_time_entries table
CREATE TABLE public.user_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  end_time TIME,
  hours NUMERIC GENERATED ALWAYS AS (
    CASE WHEN end_time IS NOT NULL AND end_time > start_time 
      THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
      ELSE NULL
    END
  ) STORED,
  project TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_time_entries ENABLE ROW LEVEL SECURITY;

-- Users can read own entries
CREATE POLICY "Users can read own time entries"
  ON public.user_time_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own entries
CREATE POLICY "Users can insert own time entries"
  ON public.user_time_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own entries
CREATE POLICY "Users can update own time entries"
  ON public.user_time_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own entries
CREATE POLICY "Users can delete own time entries"
  ON public.user_time_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all time entries"
  ON public.user_time_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_user_time_entries_updated_at
  BEFORE UPDATE ON public.user_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_time_entries;
