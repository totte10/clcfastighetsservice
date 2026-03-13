
CREATE TABLE public.voice_channel_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT '',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false
);

ALTER TABLE public.voice_channel_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read voice participants"
  ON public.voice_channel_participants FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert own voice presence"
  ON public.voice_channel_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice presence"
  ON public.voice_channel_participants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice presence"
  ON public.voice_channel_participants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.voice_channel_participants
  ADD CONSTRAINT unique_user_voice UNIQUE (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_channel_participants;
