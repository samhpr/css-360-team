-- Add zip_code column to events
-- Run this once in the Supabase SQL Editor

alter table public.events
  add column if not exists zip_code text;

-- Backfill mock data
update public.events set zip_code = '98109' where id = '1'; -- Seattle, WA
update public.events set zip_code = '98004' where id = '2'; -- Bellevue, WA
update public.events set zip_code = '98402' where id = '3'; -- Tacoma, WA
update public.events set zip_code = '98101' where id = '4'; -- Seattle, WA
update public.events set zip_code = '98052' where id = '5'; -- Redmond, WA
