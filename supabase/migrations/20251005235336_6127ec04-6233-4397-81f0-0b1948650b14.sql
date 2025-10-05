-- Create mail_rooms table for public status tracking
CREATE TABLE public.mail_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'closed', 'unknown')),
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mail_rooms ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view mail room status"
  ON public.mail_rooms
  FOR SELECT
  USING (true);

-- Allow public updates
CREATE POLICY "Anyone can update mail room status"
  ON public.mail_rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public inserts
CREATE POLICY "Anyone can insert mail room status"
  ON public.mail_rooms
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_mail_rooms_name ON public.mail_rooms(name);
CREATE INDEX idx_mail_rooms_last_updated ON public.mail_rooms(last_updated);

-- Insert initial data for all mail rooms
INSERT INTO public.mail_rooms (name, status, last_updated) VALUES
  ('DellPlain Hall', 'unknown', now()),
  ('Ernie Davis Hall', 'unknown', now()),
  ('Oren Lyons Hall', 'unknown', now()),
  ('Shaw Hall', 'unknown', now()),
  ('Watson Hall', 'unknown', now()),
  ('Day Hall', 'unknown', now()),
  ('Flint Hall', 'unknown', now()),
  ('Booth Hall', 'unknown', now()),
  ('Haven Hall', 'unknown', now()),
  ('Milton Hall', 'unknown', now()),
  ('Orange Hall', 'unknown', now()),
  ('Walnut Hall', 'unknown', now()),
  ('Washington Arms Hall', 'unknown', now()),
  ('Boland Hall', 'unknown', now()),
  ('Brewster Hall', 'unknown', now()),
  ('Brockway Hall', 'unknown', now()),
  ('Lawrinson Hall', 'unknown', now()),
  ('Sadler Hall', 'unknown', now())
ON CONFLICT (name) DO NOTHING;