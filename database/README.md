# Local Live — Database (v0.5)

Local SQLite database that defines the event schema and seeds the same five mock events the frontend currently renders from `frontend/src/data/events.js`. Two parallel layers for now (frontend reads the JS array; this directory holds the canonical schema). When the project moves to Supabase, the same `schema.sql` runs on Postgres without changes and the frontend swaps to a Supabase client.

## Files

| File          | Purpose                                                                   |
|---------------|---------------------------------------------------------------------------|
| `schema.sql`  | `CREATE TABLE events (...)` — Postgres-compatible types                   |
| `seed.sql`    | `INSERT` statements; mirrors `frontend/src/data/events.js` exactly        |
| `queries.sql` | Demo queries that back the SCRUM-5 and SCRUM-7 user stories               |
| `setup.sh`    | One-shot script: drops/rebuilds `events.db`, seeds it, runs every query  |
| `events.db`   | Generated SQLite file (gitignored, rebuilt by `setup.sh`)                |

## Run it

From the repo root:

```bash
bash database/setup.sh
```

Each demo query is echoed before its result, so you can read the SQL and the output side by side. Re-run any time — the script drops `events.db` and rebuilds it.

To poke around interactively after the script runs:

```bash
sqlite3 database/events.db
sqlite> SELECT * FROM events WHERE genre = 'Jazz';
sqlite> .schema events
sqlite> .quit
```

## How the queries map to the user stories

| User story | DoD item                                          | Query in `queries.sql`                   |
|------------|---------------------------------------------------|------------------------------------------|
| SCRUM-5    | Cards show name, date, venue, ticket link         | "every card needs name, date, venue, …"  |
| SCRUM-5    | Sorted with the soonest show first                | same query, `ORDER BY date ASC`          |
| SCRUM-7    | Selecting a genre returns matching events         | `WHERE genre = 'Jazz'`                   |
| SCRUM-7    | "All" / clear-filters returns every event         | `SELECT * FROM events ORDER BY date ASC` |
| SCRUM-7    | Empty result when no events match                 | `WHERE genre = 'Polka'`                  |
| SCRUM-7    | Genre options are derived from the data           | `SELECT DISTINCT genre`                  |

The two bonus queries at the bottom of `queries.sql` cover fsinnott's v0.5 price-range and ADA-compliance filters — not in either DoD, but the schema already supports them.

## Migrating to Supabase

When we wire up Supabase, this is the path:

1. In the Supabase SQL editor, paste `schema.sql` and run it. Postgres accepts every type used here (`INTEGER`, `TEXT`, `DATE`, `BOOLEAN`).
2. Optionally seed the table with the contents of `seed.sql` for parity with local dev.
3. Replace `frontend/src/data/events.js` with a thin Supabase client that calls `supabase.from('events').select('*')`. The fields line up 1:1 with what the frontend already reads.

Nothing in the frontend's existing tests depends on Supabase being up — they import the JS array directly, which can stay until the cutover.
