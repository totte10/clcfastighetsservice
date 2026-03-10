
-- Drop the unnecessary calc trigger since hours is a generated column
DROP TRIGGER IF EXISTS trg_calc_address_log_hours ON public.address_time_logs;
DROP FUNCTION IF EXISTS public.calc_address_log_hours();
