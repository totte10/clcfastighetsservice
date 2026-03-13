
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text DEFAULT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can insert notifications (for reminders)
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System/triggers insert via security definer functions below

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function: create notification on new assignment
CREATE OR REPLACE FUNCTION public.notify_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _title text;
BEGIN
  _title := 'Nytt uppdrag tilldelat';
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'assignment',
    _title,
    'Du har tilldelats ett nytt ' || NEW.entry_type || '-uppdrag',
    '/' || CASE 
      WHEN NEW.entry_type = 'tidx' THEN 'tidx'
      WHEN NEW.entry_type = 'egna' THEN 'egna'
      WHEN NEW.entry_type = 'tmm' THEN 'tmm'
      WHEN NEW.entry_type = 'optimal' THEN 'optimal'
      WHEN NEW.entry_type = 'project' THEN 'projects'
      WHEN NEW.entry_type = 'area' THEN '/'
      ELSE '/'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_assignment
  AFTER INSERT ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_assignment();

-- Function: create notification on new chat message for all other users
CREATE OR REPLACE FUNCTION public.notify_on_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.id, 'chat', 'Nytt chattmeddelande', NEW.sender_name || ': ' || LEFT(NEW.content, 80), '/chat'
  FROM public.profiles p
  WHERE p.id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_chat
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_chat();
