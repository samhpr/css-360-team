"""Data access layer backed by Supabase (Postgres).
The frontend never talks to Supabase directly — it goes through this backend,
which holds the service-role key. RLS on the `events` table blocks writes from
the anon key, so the only writer is this module.
"""
from __future__ import annotations
import os
from functools import lru_cache
from supabase import Client, create_client
 

def get_ada_stats():
    rows = _client().table("events").select("is_ada_compliant").execute().data or []

    total = len(rows)
    ada_true = sum(1 for r in rows if r.get("is_ada_compliant") is True)

    return {
        "total": total,
        "adaTrue": ada_true,
        "adaFalse": total - ada_true
    }

def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"{name} is not set. Copy backend/.env.example to backend/.env and fill it in."
        )
    return value
 
 
@lru_cache(maxsize=1)
def _client() -> Client:
    url = _require_env("SUPABASE_URL")
    key = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)
 
 
def _row_to_dict(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "genre": row["genre"],
        "date": row["date"],
        "location": row["location"],
        "venue": row["venue"],
        "zipCode": row.get("zip_code", ""),
        "ticketLink": row["ticket_link"],
        "ticketPrice": row["ticket_price"],
        "is_ada_compliant": bool(row.get("is_ada_compliant") or row.get("isADAComp")),
    }
 
 
def query_events(
    city: str | None = None,
    genre: str | None = None,
    keyword: str | None = None,
    zip_code: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    ada_only: bool = False,
    sort: str = "soonest",
) -> list[dict]:
    q = _client().table("events").select("*")
 
    if city:
        q = q.ilike("location", f"%{city}%")
    if genre and genre.lower() not in ("all", ""):
        q = q.ilike("genre", f"%{genre}%")
    if keyword:
        term = f"%{keyword}%"
        q = q.or_(
            ",".join(
                [
                    f"name.ilike.{term}",
                    f"venue.ilike.{term}",
                    f"location.ilike.{term}",
                    f"genre.ilike.{term}",
                ]
            )
        )
    if zip_code:
        q = q.eq("zip_code", zip_code)
    if price_min is not None:
        q = q.gte("ticket_price", price_min)
    if price_max is not None:
        q = q.lte("ticket_price", price_max)
    if ada_only:
        q = q.eq("is_ada_compliant", True)
 
    q = q.order("date", desc=(sort != "soonest"))
    rows = q.execute().data or []
    return [_row_to_dict(r) for r in rows]
 
 
def get_event_by_id(event_id: str) -> dict | None:
    res = _client().table("events").select("*").eq("id", event_id).limit(1).execute()
    rows = res.data or []
    return _row_to_dict(rows[0]) if rows else None
 
 
def upsert_events(events: list[dict]) -> None:
    """Insert or replace events — used when syncing from Ticketmaster."""

    if not events:
        return

    cleaned = []

    for e in events:
        cleaned.append({
            "id": e.get("id"),
            "name": e.get("name"),
            "genre": e.get("genre"),
            "date": e.get("date"),
            "location": e.get("location"),
            "venue": e.get("venue"),
            "zip_code": e.get("zip_code"),
            "ticket_link": e.get("ticket_link"),
            "ticket_price": e.get("ticket_price"), 
            "is_ada_compliant": e.get("is_ada_compliant", False),
        })

    _client().table("events").upsert(cleaned, on_conflict="id").execute()
 
 
def get_distinct_genres() -> list[str]:
    rows = _client().table("events").select("genre").execute().data or []
    return sorted({r["genre"] for r in rows if r.get("genre")})
 
 
def get_distinct_zipcodes() -> list[str]:
    """Return all zip codes that have at least one event, sorted numerically."""
    rows = _client().table("events").select("zip_code").execute().data or []
    unique = sorted(
        {r["zip_code"] for r in rows if r.get("zip_code")},
        key=lambda z: (z.isdigit(), z),   # numeric zips first, then alpha
    )
    return unique
 
 
def init_db() -> None:
    """Verify connectivity at startup. The schema is managed in Supabase, not here."""
    _client().table("events").select("id").limit(1).execute()
