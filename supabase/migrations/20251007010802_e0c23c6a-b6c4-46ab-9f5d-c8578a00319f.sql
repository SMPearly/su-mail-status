-- Set REPLICA IDENTITY FULL for realtime to work properly
ALTER TABLE public.mail_rooms REPLICA IDENTITY FULL;