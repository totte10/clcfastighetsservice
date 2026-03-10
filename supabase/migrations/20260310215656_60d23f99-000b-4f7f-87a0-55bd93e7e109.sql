
-- Auto-calculate hours when end_time is set on address_time_logs
CREATE OR REPLACE FUNCTION public.calc_address_log_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.hours := ROUND(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0, 2);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach hours calc trigger (runs BEFORE so it sets hours before sync trigger)
DROP TRIGGER IF EXISTS trg_calc_address_log_hours ON public.address_time_logs;
CREATE TRIGGER trg_calc_address_log_hours
  BEFORE INSERT OR UPDATE ON public.address_time_logs
  FOR EACH ROW EXECUTE FUNCTION public.calc_address_log_hours();

-- Attach sync trigger (runs AFTER so hours are already calculated)
DROP TRIGGER IF EXISTS trg_sync_address_log ON public.address_time_logs;
CREATE TRIGGER trg_sync_address_log
  AFTER INSERT OR UPDATE OR DELETE ON public.address_time_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_address_log_to_time_entries();
