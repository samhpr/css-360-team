from contextlib import asynccontextmanager
import os
 
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import (
    get_distinct_genres,
    get_event_by_id,
    init_db,
    query_events,
    upsert_events,
)
from models import EventResponse
 
load_dotenv()
 
TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY", "")
TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"
 
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Auto-sync from Ticketmaster on startup
    if TICKETMASTER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(TICKETMASTER_BASE_URL, params={
                    "apikey": TICKETMASTER_API_KEY,
                    "city": "Seattle",
                    "radius": 25,
                    "unit": "miles",
                    "classificationName": "music",
                    "size": 50,
                    "sort": "date,asc",
                    "countryCode": "US",
                })
            raw = resp.json().get("_embedded", {}).get("events", [])
            if raw:
                upsert_events(_parse_tm_events(raw))
                print(f"Synced {len(raw)} events from Ticketmaster")
        except Exception as e:
            print(f"Ticketmaster sync failed: {e}")
    yield
 
 
app = FastAPI(
    title="Local Live API",
    description="Concert discovery API — SQLite + optional Ticketmaster sync",
    version="1.0.0",
    lifespan=lifespan,
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # CRA
        "http://localhost:5173",   # Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
# ---------------------------------------------------------------------------
# Ticketmaster helpers
# ---------------------------------------------------------------------------
 
def _parse_tm_events(raw: list[dict]) -> list[dict]:
    """Normalise Ticketmaster payload into our DB schema."""
    parsed = []
    for e in raw:
        try:
            venue_info = e.get("_embedded", {}).get("venues", [{}])[0]
            classif    = e.get("classifications", [{}])[0]
            genre      = classif.get("genre", {}).get("name", "Other")
            if genre in ("Undefined", "Other", ""):
                genre = classif.get("segment", {}).get("name", "Other")
 
            price_ranges = e.get("priceRanges", [])
            ticket_price = int(price_ranges[0].get("min", 0)) if price_ranges else 0
 
            city     = venue_info.get("city",  {}).get("name", "Unknown City")
            state    = venue_info.get("state", {}).get("stateCode", "")
            location = f"{city}, {state}" if state else city
 
            date_str = e.get("dates", {}).get("start", {}).get("localDate", "")
 
            ada_detail = venue_info.get("accessibleSeatingDetail", "")
            is_ada     = bool(ada_detail)
 
            parsed.append({
                "id":               e["id"],
                "name":             e.get("name", "Unnamed Event"),
                "genre":            genre,
                "date":             date_str,
                "location":         location,
                "venue":            venue_info.get("name", "Unknown Venue"),
                "ticket_link":      e.get("url", "#"),
                "ticket_price":     ticket_price,
                "is_ada_compliant": is_ada,
            })
        except (KeyError, IndexError, TypeError):
            continue
    return parsed
 
 
# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
 
@app.get("/api/events", response_model=list[EventResponse])
async def get_events(
    city:      str   = Query(default=None,      description="Filter by city (partial match)"),
    genre:     str   = Query(default=None,      description="Filter by genre"),
    keyword:   str   = Query(default=None,      description="Search name / venue / location / genre"),
    price_min: float = Query(default=None,      description="Minimum ticket price"),
    price_max: float = Query(default=None,      description="Maximum ticket price"),
    ada_only:  bool  = Query(default=False,     description="ADA compliant venues only"),
    sort:      str   = Query(default="soonest", description="soonest | latest"),
    # Ticketmaster live-sync params
    refresh:   bool  = Query(default=False,     description="Pull fresh data from Ticketmaster"),
    tm_city:   str   = Query(default="Seattle", description="City to query when refreshing"),
    size:      int   = Query(default=50, ge=1, le=200),
):
    # ── Optional live sync ──────────────────────────────────────────────────
    if refresh:
        if not TICKETMASTER_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="TICKETMASTER_API_KEY not configured. Add it to your .env file.",
            )
        params = {
            "apikey":             TICKETMASTER_API_KEY,
            "city":               tm_city,
            "radius":             25,
            "unit":               "miles",
            "classificationName": "music",
            "size":               size,
            "sort":               "date,asc",
            "countryCode":        "US",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(TICKETMASTER_BASE_URL, params=params)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Ticketmaster returned HTTP {resp.status_code}",
            )
        raw = resp.json().get("_embedded", {}).get("events", [])
        if raw:
            upsert_events(_parse_tm_events(raw))
 
    # ── Query DB (seeded or freshly synced) ─────────────────────────────────
    return query_events(
        city=city,
        genre=genre,
        keyword=keyword,
        price_min=price_min,
        price_max=price_max,
        ada_only=ada_only,
        sort=sort,
    )
 
 
@app.get("/api/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
 
 
@app.get("/api/genres")
async def get_genres():
    """Distinct genres in the DB — used to populate the frontend genre filter."""
    return {"genres": ["All"] + get_distinct_genres()}
 
 
@app.get("/health")
async def health():
    return {"status": "ok"}