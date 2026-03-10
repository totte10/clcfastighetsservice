
-- Remove duplicate trigger
DROP TRIGGER IF EXISTS trg_sync_address_log ON public.address_time_logs;
