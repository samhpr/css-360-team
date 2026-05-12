import sqlite3
import os
 
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database", "events.db")

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn
 
 
def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id":             str(row["id"]),
        "name":           row["name"],
        "genre":          row["genre"],
        "date":           row["date"],
        "location":       row["location"],
        "venue":          row["venue"],
        "ticketLink":     row["ticket_link"],
        "ticketPrice":    row["ticket_price"],
        "isADAComp":      bool(row["is_ada_compliant"]),
    }
 
 
def query_events(
    city:      str   = None,
    genre:     str   = None,
    keyword:   str   = None,
    price_min: float = None,
    price_max: float = None,
    ada_only:  bool  = False,
    sort:      str   = "soonest",
) -> list[dict]:
    clauses: list[str] = ["1=1"]
    params:  list      = []
 
    if city:
        clauses.append("location LIKE ?")
        params.append(f"%{city}%")
    if genre and genre.lower() not in ("all", ""):
        clauses.append("genre LIKE ?")
        params.append(f"%{genre}%")
    if keyword:
        term = f"%{keyword}%"
        clauses.append("(name LIKE ? OR venue LIKE ? OR location LIKE ? OR genre LIKE ?)")
        params.extend([term, term, term, term])
    if price_min is not None:
        clauses.append("ticket_price >= ?")
        params.append(price_min)
    if price_max is not None:
        clauses.append("ticket_price <= ?")
        params.append(price_max)
    if ada_only:
        clauses.append("is_ada_compliant = 1")
 
    order = "ASC" if sort == "soonest" else "DESC"
    sql = f"SELECT * FROM events WHERE {' AND '.join(clauses)} ORDER BY date {order}"
 
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]
 
 
def get_event_by_id(event_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return _row_to_dict(row) if row else None
 
 
def upsert_events(events: list[dict]):
    """Insert or replace events — used when syncing from Ticketmaster."""
    with get_conn() as conn:
        conn.executemany("""
            INSERT INTO events
                (id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant)
            VALUES
                (:id, :name, :genre, :date, :location, :venue, :ticket_link, :ticket_price, :is_ada_compliant)
            ON CONFLICT(id) DO UPDATE SET
                name             = excluded.name,
                genre            = excluded.genre,
                date             = excluded.date,
                location         = excluded.location,
                venue            = excluded.venue,
                ticket_link      = excluded.ticket_link,
                ticket_price     = excluded.ticket_price,
                is_ada_compliant = excluded.is_ada_compliant
        """, events)
        conn.commit()
 
 
def get_distinct_genres() -> list[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT genre FROM events ORDER BY genre"
        ).fetchall()
    return [r["genre"] for r in rows]