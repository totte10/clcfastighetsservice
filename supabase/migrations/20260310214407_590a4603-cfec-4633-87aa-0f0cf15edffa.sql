
ALTER TABLE public.optimal_entries ADD COLUMN foretag TEXT NOT NULL DEFAULT '';
ALTER TABLE public.optimal_entries ADD COLUMN typ TEXT NOT NULL DEFAULT 'maskinsopning';

ALTER TABLE public.tmm_entries ADD COLUMN foretag TEXT NOT NULL DEFAULT '';
ALTER TABLE public.tmm_entries ADD COLUMN typ TEXT NOT NULL DEFAULT 'maskinsopning';
