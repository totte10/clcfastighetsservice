
-- 1. Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;

-- 2. Update handle_new_user to store username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$;

-- 3. Project assignments table
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL,
  entry_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_type, entry_id, user_id)
);
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read assignments" ON public.project_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert assignments" ON public.project_assignments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update assignments" ON public.project_assignments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete assignments" ON public.project_assignments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 4. Project images with metadata
CREATE TABLE IF NOT EXISTS public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL,
  entry_id uuid NOT NULL,
  image_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  uploader_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read project images" ON public.project_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload images" ON public.project_images FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Admins can delete images" ON public.project_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own images" ON public.project_images FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- 5. Helper function for assignment check
CREATE OR REPLACE FUNCTION public.is_assigned_to(_user_id uuid, _entry_type text, _entry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE user_id = _user_id AND entry_type = _entry_type AND entry_id = _entry_id
  )
$$;

-- 6. Open up profiles for authenticated read (workers need to see names)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- 7. Update RLS on entry tables: workers see only assigned entries

-- tidx_entries
DROP POLICY IF EXISTS "Anyone can read tidx_entries" ON public.tidx_entries;
CREATE POLICY "Users can read tidx_entries" ON public.tidx_entries FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'tidx', id)
);
DROP POLICY IF EXISTS "Anyone can insert tidx_entries" ON public.tidx_entries;
CREATE POLICY "Authenticated can insert tidx_entries" ON public.tidx_entries FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update tidx_entries" ON public.tidx_entries;
CREATE POLICY "Authenticated can update tidx_entries" ON public.tidx_entries FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can delete tidx_entries" ON public.tidx_entries;
CREATE POLICY "Admins can delete tidx_entries" ON public.tidx_entries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- egna_entries
DROP POLICY IF EXISTS "Anyone can read egna_entries" ON public.egna_entries;
CREATE POLICY "Users can read egna_entries" ON public.egna_entries FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'egna', id)
);
DROP POLICY IF EXISTS "Anyone can insert egna_entries" ON public.egna_entries;
CREATE POLICY "Authenticated can insert egna_entries" ON public.egna_entries FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update egna_entries" ON public.egna_entries;
CREATE POLICY "Authenticated can update egna_entries" ON public.egna_entries FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can delete egna_entries" ON public.egna_entries;
CREATE POLICY "Admins can delete egna_entries" ON public.egna_entries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- tmm_entries
DROP POLICY IF EXISTS "Authenticated can read tmm_entries" ON public.tmm_entries;
CREATE POLICY "Users can read tmm_entries" ON public.tmm_entries FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'tmm', id)
);

-- optimal_entries
DROP POLICY IF EXISTS "Authenticated can read optimal_entries" ON public.optimal_entries;
CREATE POLICY "Users can read optimal_entries" ON public.optimal_entries FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'optimal', id)
);

-- projects
DROP POLICY IF EXISTS "Authenticated can read projects" ON public.projects;
CREATE POLICY "Users can read projects" ON public.projects FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'project', id)
);

-- areas
DROP POLICY IF EXISTS "Anyone can read areas" ON public.areas;
CREATE POLICY "Users can read areas" ON public.areas FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR is_assigned_to(auth.uid(), 'area', id)
);
DROP POLICY IF EXISTS "Anyone can insert areas" ON public.areas;
CREATE POLICY "Authenticated can insert areas" ON public.areas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update areas" ON public.areas;
CREATE POLICY "Authenticated can update areas" ON public.areas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can delete areas" ON public.areas;
CREATE POLICY "Admins can delete areas" ON public.areas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
