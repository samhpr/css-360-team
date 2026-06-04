import React, { useMemo, useState } from "react";
import EventCalendar from "./components/EventCalendar";
import { useEvents } from "./hooks/useEvents";
import {
  filterByGenre,
  filterByZipCode,
  getCalendarMap,
  getGenreOptions,
  getZipCodeOptions,
  searchEvents,
  sortByDate,
} from "./lib/events";
import { getFavorites, toggleFavorite } from "./lib/favorites";
import Select from "react-select";

function App() {
  const { events, loading, error } = useEvents();

  const [searchValue, setSearchValue] = useState("");
  const [genre, setGenre] = useState("All");
  const [priceRange, setPriceRange] = useState("all");
  const [adaOnly, setadaOnly] = useState("all");
  const [sortOrder, setSortOrder] = useState("soonest");
  const [zipCode, setZipCode] = useState("All");
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [viewMode, setViewMode] = useState("all"); // "all" or "favorites"

  const genreOptions = useMemo(() => getGenreOptions(events), [events]);
  const zipCodeOptions = useMemo(() => getZipCodeOptions(events), [events]);

  const resetFilters = () => {
    setSearchValue("");
    setGenre("All");
    setPriceRange("all");
    setadaOnly("all");
    setSortOrder("soonest");
    setZipCode("All");
  };

  const handleToggleFavorite = (eventId) => {
    const updated = toggleFavorite(eventId);
    setFavorites(updated);
  };

  const visibleEvents = useMemo(() => {
    const searched = searchEvents(events, searchValue);
    const byGenre = filterByGenre(searched, genre);
    const byZipCode = filterByZipCode(byGenre, zipCode);

    const byPrice = (() => {
      if (priceRange === "all") return byZipCode;
      return byZipCode.filter((event) => {
        if (priceRange === "0-49") return event.ticketPrice < 50;
        if (priceRange === "50-99") return event.ticketPrice >= 50 && event.ticketPrice < 100;
        if (priceRange === "100-199") return event.ticketPrice >= 100 && event.ticketPrice < 200;
        if (priceRange === "geq200") return event.ticketPrice >= 200;
        return true;
      });
    })();

    const byADAComp = (() => {
      if (adaOnly === "all") return byPrice;
      return byPrice.filter((event) => event.isADAComp === true);
    })();

    const byFavorites =
      viewMode === "favorites"
        ? byADAComp.filter((event) => favorites.includes(event.id))
        : byADAComp;

    return sortByDate(byFavorites, sortOrder);
  }, [events, searchValue, genre, priceRange, adaOnly, sortOrder, zipCode, viewMode, favorites]);

  const eventsByDate = useMemo(() => getCalendarMap(visibleEvents), [visibleEvents]);

  return (
    <div className="app-shell">
      <header>
        <h1>Local Live</h1>
        <p className="subtitle">Find nearby concerts happening soon.</p>
      </header>

      <section className="controls" aria-label="Search and filter controls">
        <label htmlFor="search">Search concerts</label>
        <div className="search-row">
          <input
            id="search"
            name="search"
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
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
              name="genre-filter"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
            >
              {genreOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="zip-filter">Zip code</label>
            <Select
              inputId="zip-filter"
              isSearchable
              isClearable
              placeholder="All zip codes"
              value={zipCode === "All" ? null : { value: zipCode, label: zipCode }}
              onChange={(selected) => setZipCode(selected ? selected.value : "All")}
              options={zipCodeOptions
                .filter((opt) => opt !== "All")
                .map((opt) => ({ value: opt, label: opt }))}
              aria-label="Zip code"
              classNamePrefix="zip-select"
            />
          </div>

          <div className="filterGroup">
            <label htmlFor="price-filter">Price</label>
            <select
              id="price-filter"
              name="price-filter"
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
            >
              <option value="all"> Any </option>
              <option value="0-49"> $0 - $49 </option>
              <option value="50-99"> $50 - 99 </option>
              <option value="100-199"> $100 - $199 </option>
              <option value="geq200"> $200+ </option>
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="ada-filter">ADA Compliance</label>
            <select
              id="ada-filter"
              name="ada-filter"
              value={adaOnly}
              onChange={(event) => setadaOnly(event.target.value)}
            >
              <option value="all"> All </option>
              <option value="true"> ADA Compliant </option>
            </select>
          </div>

          <div className="filterGroup">
            <label htmlFor="sort-filter">Sort by date</label>
            <select
              id="sort-filter"
              name="sort-filter"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="soonest">Soonest first</option>
              <option value="latest">Latest first</option>
            </select>
          </div>

          <div
            className="filterGroup"
            style={{ flex: "none", minWidth: "auto", justifyContent: "flex-end" }}
          >
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

      <section className="view-toggle" aria-label="View toggle">
        <button
          type="button"
          className={viewMode === "all" ? "view-tab active" : "view-tab"}
          onClick={() => setViewMode("all")}
          aria-pressed={viewMode === "all"}
        >
          All concerts
        </button>
        <button
          type="button"
          className={viewMode === "favorites" ? "view-tab active" : "view-tab"}
          onClick={() => setViewMode("favorites")}
          aria-pressed={viewMode === "favorites"}
        >
          ★ Favorites ({favorites.length})
        </button>
      </section>

      <main>
        <section aria-label="Upcoming concerts section">
          <h2>Upcoming Concerts</h2>

          {loading && <p>Loading concerts…</p>}
          {error && <p role="alert">Could not load concerts. Is the API running?</p>}

          {!loading &&
            !error &&
            visibleEvents.length === 0 &&
            viewMode === "favorites" &&
            favorites.length === 0 && (
              <div className="noResults">
                <p>No favorites yet — tap the ☆ on any concert to save it.</p>
              </div>
            )}

          {!loading &&
            !error &&
            visibleEvents.length === 0 &&
            !(viewMode === "favorites" && favorites.length === 0) && (
              <div className="noResults">
                <p>
                  No concerts match the selected filters.{" "}
                  <button type="button" className="link-button" onClick={resetFilters}>
                    Reset Filters.
                  </button>
                </p>
              </div>
            )}

          <ul className="concert-list">
            {visibleEvents.map((event) => {
              const isFav = favorites.includes(event.id);
              return (
                <li className="concert-card" key={event.id}>
                  <div className="card-header">
                    <h3>{event.name}</h3>
                    <button
                      type="button"
                      className={isFav ? "favorite-button favorited" : "favorite-button"}
                      onClick={() => handleToggleFavorite(event.id)}
                      aria-label={isFav ? `Unfavorite ${event.name}` : `Favorite ${event.name}`}
                      aria-pressed={isFav}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  </div>
                  <p>
                    {event.date} | {event.genre}
                  </p>
                  <p>
                    {event.location} | {event.venue}
                    {event.isADAComp && (
                      <span
                        title="ADA Compliant"
                        aria-label="ADA Compliant Venue"
                        style={{ color: "#005eb8", marginLeft: "6px" }}
                      >
                        {"♿︎"}
                      </span>
                    )}
                  </p>
                  <a href={event.ticketLink}>Ticket Link</a> | ${event.ticketPrice}
                </li>
              );
            })}
          </ul>
        </section>
        <EventCalendar eventsByDate={eventsByDate} />
      </main>
    </div>
  );
}

export default App;
