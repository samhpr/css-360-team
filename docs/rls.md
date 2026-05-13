# Row Level Security

RLS is on for the `events` table in Supabase. Anyone can SELECT, but nobody can INSERT, UPDATE, or DELETE with the anon key. The backend uses the service-role key (in `backend/.env`) which is the only thing that can write. The policy is created by `database/supabase_schema.sql` when you set up the project.
