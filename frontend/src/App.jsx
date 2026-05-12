import React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import EventCalendar from "./components/EventCalendar";
import { getCalendarMap } from "./lib/events";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function App() {
  const [searchValue, setSearchValue] = useState("");
  const [genre, setGenre]             = useState("All");
  const [priceRange, setPriceRange]   = useState("all");
  const [adaOnly, setAdaOnly]         = useState("all");
  const [sortOrder, setSortOrder]     = useState("soonest");

  const [events, setEvents]           = useState([]);
  const [genreOptions, setGenreOptions] = useState(["All"]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // Load genre list once on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/genres`)
      .then((r) => r.json())
      .then((data) => setGenreOptions(data.genres ?? ["All"]))
      .catch(() => {});
  }, []);

  // Fetch events whenever any filter changes
  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ sort: sortOrder });

    if (searchValue) params.set("keyword", searchValue);
    if (genre !== "All") params.set("genre", genre);
    if (adaOnly === "true") params.set("ada_only", "true");

    if (priceRange === "0-49")    { params.set("price_max", "49"); }
    if (priceRange === "50-99")   { params.set("price_min", "50");  params.set("price_max", "99"); }
    if (priceRange === "100-199") { params.set("price_min", "100"); params.set("price_max", "199"); }
    if (priceRange === "geq200")  { params.set("price_min", "200"); }

    fetch(`${API_BASE}/api/events?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((data) => setEvents(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchValue, genre, priceRange, adaOnly, sortOrder]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const resetFilters = () => {
    setSearchValue("");
    setGenre("All");
    setPriceRange("all");
    setAdaOnly("all");
    setSortOrder("soonest");
  };

  const eventsByDate = useMemo(() => getCalendarMap(events), [events]);

  return (
    <div className="app-shell">
      <header>
        <h1>Local Live</h1>
        <p className="subtitle">Find nearby concerts happening soon.</p>
        <button
          type="button"
          className="sync-button"
          onClick={() => {
            setLoading(true);
            fetch(`${API_BASE}/api/events?refresh=true&tm_city=Seattle`)
              .then((r) => r.json())
              .then((data) => setEvents(data))
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          disabled={loading}
        >
          {loading ? "Syncing…" : "🔄 Sync Live Concerts"}
        </button>
      </header>

      <section className="controls" aria-label="Search and filter controls">
        <label htmlFor="search">Search concerts</label>
        <div className="search-row">
          <input
            id="search"
            name="search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search name, city, venue, genre"
          />
          {searchValue && (
            <button type="button" onClick={() => setSearchValue("")}>
              Clear
            </button>
          )}
        </div>

        <div className="filterRow">
          <div className="filterGroup">
            <label htmlFor="genre-filter">Genre</label>
            <select
              id="genre-filter"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genreOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="price-filter">Price</label>
            <select
              id="price-filter"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="all">Any</option>
              <option value="0-49">$0 – $49</option>
              <option value="50-99">$50 – $99</option>
              <option value="100-199">$100 – $199</option>
              <option value="geq200">$200+</option>
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="ada-filter">ADA Compliance</label>
            <select
              id="ada-filter"
              value={adaOnly}
              onChange={(e) => setAdaOnly(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">ADA Compliant</option>
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="sort-filter">Sort by date</label>
            <select
              id="sort-filter"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="soonest">Soonest first</option>
              <option value="latest">Latest first</option>
            </select>
          </div>

          <div className="filterGroup" style={{ flex: "none", minWidth: "auto", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="link-button"
              onClick={resetFilters}
              style={{ paddingBottom: "8px" }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <main>
        <section aria-label="Upcoming concerts section">
          <h2>Upcoming Concerts</h2>

          {loading && <p className="status-msg">Loading concerts…</p>}
          {error   && <p className="status-msg error">Error: {error}</p>}

          {!loading && !error && events.length === 0 && (
            <div className="noResults">
              <p>
                No concerts match the selected filters.{" "}
                <button type="button" className="link-button" onClick={resetFilters}>
                  Reset Filters
                </button>
              </p>
            </div>
          )}

          <ul className="concert-list">
            {events.map((event) => (
              <li className="concert-card" key={event.id}>
                <h3>{event.name}</h3>
                <p>{event.date} | {event.genre}</p>
                <p>
                  {event.location} | {event.venue}
                  {event.isADAComp && (
                    <span
                      title="ADA Compliant"
                      aria-label="ADA Compliant Venue"
                      style={{ color: "#005eb8", marginLeft: "6px" }}
                    >
                      {"♿\uFE0E"}
                    </span>
                  )}
                </p>
                <a href={event.ticketLink}>Ticket Link</a> | ${event.ticketPrice}
              </li>
            ))}
          </ul>
        </section>

        <EventCalendar eventsByDate={eventsByDate} />
      </main>
    </div>
  );
}

export default App;