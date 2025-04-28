CREATE TABLE public.user_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);
