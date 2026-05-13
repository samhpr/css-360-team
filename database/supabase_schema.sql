-- Local Live — Supabase schema
-- Run this once in the Supabase SQL Editor

create table if not exists public.events (
  id               text        primary key,
  name             text        not null,
  genre            text        not null,
  date             date        not null,
  location         text        not null,
  venue            text        not null,
  ticket_link      text        not null,
  ticket_price     integer     not null,
  is_ada_compliant boolean     not null default false
);

alter table public.events enable row level security;

drop policy if exists "Public read access" on public.events;
create policy "Public read access"
  on public.events
  for select
  to anon, authenticated
  using (true);

-- seed data
insert into public.events
  (id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant)
values
  ('1', 'Northside Noise Fest', 'Rock',       '2026-04-25', 'Seattle, WA',  'Emerald Hall',      'https://tickets.example.com/northside',   120, false),
  ('2', 'Jazz by the Lake',     'Jazz',       '2026-04-24', 'Bellevue, WA', 'Lakefront Arena',   'https://tickets.example.com/jazz-lake',    15, true),
  ('3', 'Sunset Beats',         'Electronic', '2026-05-02', 'Tacoma, WA',   'Pulse Club',        'https://tickets.example.com/sunset-beats', 55, false),
  ('4', 'Folk in the Park',     'Folk',       '2026-04-30', 'Seattle, WA',  'Green Stage',       'https://tickets.example.com/folk-park',    30, true),
  ('5', 'Indie Friday Night',   'Indie',      '2026-04-26', 'Redmond, WA',  'Riverside Theater', 'https://tickets.example.com/indie-friday', 80, true)
on conflict (id) do nothing;
