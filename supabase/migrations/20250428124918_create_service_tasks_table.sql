CREATE TABLE public.service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT CHECK (request_type IN ('ROOM_SERVICE', 'DINING_BOOKING', 'SPA_BOOKING')),
  guest_phone_number TEXT NOT NULL,
  room_no TEXT,
  request_details TEXT NOT NULL,
  guest_name TEXT,
  guest_preferences_summary TEXT,
  status TEXT CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NEEDS_INFO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to TEXT,
  internal_notes TEXT,
  suggestion_text TEXT,
  notified_on_completion BOOLEAN NOT NULL DEFAULT FALSE
);
