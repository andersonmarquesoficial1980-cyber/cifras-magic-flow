DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_plan'
  ) THEN
    CREATE TYPE public.user_plan AS ENUM ('musico', 'artista', 'maestro');
  END IF;
END
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.user_plan;

UPDATE public.profiles
SET plan = CASE
  WHEN role = 'premium' THEN 'artista'::public.user_plan
  WHEN role = 'admin' THEN 'maestro'::public.user_plan
  ELSE 'musico'::public.user_plan
END
WHERE plan IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'musico'::public.user_plan,
  ALTER COLUMN plan SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('free', 'premium', 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (new.id, new.email, 'free', 'musico');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
