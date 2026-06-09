import os
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import (
    get_distinct_genres,
    get_distinct_zipcodes,
    get_event_by_id,
    init_db,
    query_events,
    upsert_events,
    get_ada_stats,
)
from models import EventResponse

load_dotenv()

TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY", "")
TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if TICKETMASTER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    TICKETMASTER_BASE_URL,
                    params={
                        "apikey": TICKETMASTER_API_KEY,
                        "city": "Seattle",
                        "radius": 25,
                        "unit": "miles",
                        "classificationName": "music",
                        "size": 50,
                        "sort": "date,asc",
                        "countryCode": "US",
                    },
                )

            raw = resp.json().get("_embedded", {}).get("events", [])

            if raw:
                upsert_events(_parse_tm_events(raw))
                print(f"Synced {len(raw)} events from Ticketmaster")

        except Exception as e:
            print(f"Ticketmaster sync failed: {e}")

    yield


app = FastAPI(
    title="Local Live API",
    description="Concert discovery API — Supabase + optional Ticketmaster sync",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _parse_tm_events(raw: list[dict]) -> list[dict]:
    parsed = []

    for e in raw:
        try:
            venue_info = e.get("_embedded", {}).get("venues", [{}])[0]

            classif = e.get("classifications", [{}])[0]
            genre = classif.get("genre", {}).get("name", "Other")
            if genre in ("Undefined", "Other", ""):
                genre = classif.get("segment", {}).get("name", "Other")

            price_ranges = e.get("priceRanges")

            ticket_price = None

            if isinstance(price_ranges, list):
                for pr in price_ranges:
                    if not isinstance(pr, dict):
                        continue

                    min_price = pr.get("min")

                    if isinstance(min_price, (int, float)) and min_price > 0:
                        ticket_price = int(min_price)
                        break

            city = venue_info.get("city", {}).get("name", "Unknown City")
            state = venue_info.get("state", {}).get("stateCode", "")
            location = f"{city}, {state}" if state else city

            date_str = e.get("dates", {}).get("start", {}).get("localDate", "")

            is_ada = False

            is_ada = False

            venue = venue_info or {}

            # 1. venue accessibility field (best available signal)
            if venue.get("accessibleSeatingDetail"):
                is_ada = True

            # 2. venue name heuristic (surprisingly useful in TM data)
            venue_name = (venue.get("name") or "").lower()
            if any(x in venue_name for x in ["center", "arena", "stadium", "theater"]):
                # not ADA by itself, but we use it to avoid false negatives
                is_ada = is_ada or False

            # 3. wheelchair/access flags sometimes appear here
            access = venue.get("accessibility") or {}
            if isinstance(access, dict):
                if any(access.values()):
                    is_ada = True

            # 4. last resort: event-level metadata
            if "wheelchair" in str(e).lower():
                is_ada = True

            parsed.append(
                {
                    "id": e["id"],
                    "name": e.get("name", "Unnamed Event"),
                    "genre": genre,
                    "date": date_str,
                    "location": location,
                    "venue": venue_info.get("name", "Unknown Venue"),
                    "zip_code": venue_info.get("postalCode", ""),
                    "ticket_link": e.get("url", "#"),
                    "ticket_price": ticket_price,
                    "is_ada_compliant": is_ada,
                }
            )

        except (KeyError, IndexError, TypeError):
            continue

    return parsed


@app.get("/api/events", response_model=list[EventResponse])
async def get_events(
    city: str = Query(default=None),
    genre: str = Query(default=None),
    keyword: str = Query(default=None),
    zip_code: str = Query(default=None),
    price_min: float = Query(default=None),
    price_max: float = Query(default=None),
    ada_only: bool = Query(default=False),
    sort: str = Query(default="soonest"),
    refresh: bool = Query(default=False),
    tm_city: str = Query(default="Seattle"),
    size: int = Query(default=50, ge=1, le=200),
):
    if refresh:
        if not TICKETMASTER_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="TICKETMASTER_API_KEY not configured.",
            )

        params = {
            "apikey": TICKETMASTER_API_KEY,
            "city": tm_city,
            "radius": 25,
            "unit": "miles",
            "classificationName": "music",
            "size": size,
            "sort": "date,asc",
            "countryCode": "US",
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

    return query_events(
        city=city,
        genre=genre,
        keyword=keyword,
        zip_code=zip_code,
        price_min=price_min,
        price_max=price_max,
        ada_only=ada_only,
        sort=sort,
    )

@app.get("/api/events/ada-stats")
async def ada_stats():
    return get_ada_stats()

@app.get("/api/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/api/genres")
async def get_genres():
    return {"genres": ["All"] + get_distinct_genres()}


@app.get("/api/zipcodes")
async def get_zipcodes():
    return {"zipcodes": get_distinct_zipcodes()}


@app.get("/health")
async def health():
    return {"status": "ok"}

