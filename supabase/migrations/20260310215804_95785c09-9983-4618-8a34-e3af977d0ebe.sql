
CREATE OR REPLACE FUNCTION public.sync_address_log_to_time_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project text;
  _project_number text;
  _date date;
  _start time;
  _end time;
  _hours numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_time_entries WHERE source_log_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Only sync completed logs (with end_time)
  IF NEW.end_time IS NULL THEN
    DELETE FROM public.user_time_entries WHERE source_log_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Calculate hours inline (generated columns may not be available in triggers)
  _hours := ROUND(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0, 2);

  -- Determine project name from entry
  IF NEW.entry_type = 'tidx' THEN
    SELECT COALESCE(t.omrade || ' - ' || t.address, t.address), COALESCE(t.project_number, '')
    INTO _project, _project_number
    FROM public.tidx_entries t WHERE t.id = NEW.entry_id;
    _project := COALESCE('Tidx: ' || _project, 'Tidx sopning');
  ELSIF NEW.entry_type = 'egna' THEN
    SELECT COALESCE(e.address, ''), COALESCE(e.project_number, '')
    INTO _project, _project_number
    FROM public.egna_entries e WHERE e.id = NEW.entry_id;
    _project := COALESCE('Egna: ' || _project, 'Egna områden');
  ELSE
    _project := NEW.entry_type;
    _project_number := '';
  END IF;

  _date := (NEW.start_time AT TIME ZONE 'Europe/Stockholm')::date;
  _start := (NEW.start_time AT TIME ZONE 'Europe/Stockholm')::time;
  _end := (NEW.end_time AT TIME ZONE 'Europe/Stockholm')::time;

  INSERT INTO public.user_time_entries (user_id, date, start_time, end_time, hours, project, project_number, notes, source_log_id)
  VALUES (NEW.user_id, _date, _start, _end, _hours, _project, COALESCE(_project_number, ''), COALESCE(NEW.note, ''), NEW.id)
  ON CONFLICT (source_log_id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    hours = EXCLUDED.hours,
    project = EXCLUDED.project,
    project_number = EXCLUDED.project_number,
    notes = EXCLUDED.notes;

  RETURN NEW;
END;
$function$;
