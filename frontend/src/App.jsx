import React from "react";
import { useMemo, useState } from "react";
import EventCalendar from "./components/EventCalendar";
import { mockEvents } from "./data/events";
import {
  filterByGenre,
  getCalendarMap,
  getGenreOptions,
  searchEvents,
  sortByDate
} from "./lib/events";

function App() {
  const [searchValue, setSearchValue] = useState("");
  const [genre, setGenre] = useState("All");
  const [priceRange, setPriceRange] = useState('all');
  const [adaOnly, setadaOnly] = useState('all');
  const [sortOrder, setSortOrder] = useState("soonest");

  const genreOptions = useMemo(() => getGenreOptions(mockEvents), []);

  const resetFilters = () => {
    setSearchValue("");
    setGenre("All");
    setPriceRange("all");
    setadaOnly("all");
    setSortOrder("soonest");
  };

  const visibleEvents = useMemo(() => {
    const searched = searchEvents(mockEvents, searchValue);
    const byGenre = filterByGenre(searched, genre);

    // sorts ticket prices into categories
    const byPrice = (() => {
      if (priceRange === 'all') return byGenre;
      return byGenre.filter(event => {
        if (priceRange === '0-49')
          return (event.ticketPrice < 50);
        if (priceRange === '50-99')
          return ((event.ticketPrice >= 50) && (event.ticketPrice < 100));
        if (priceRange === '100-199')
          return ((event.ticketPrice >= 100) && (event.ticketPrice < 200));
        if (priceRange === 'geq200')
          return (event.ticketPrice >= 200);
        return true;
      });
    })();

    // sorts concerts by ada compliance
    const byADAComp = (() => {
      if (adaOnly === 'all') return byPrice;
      return byPrice.filter(event => event.isADAComp === true);
    })();

    return sortByDate(byADAComp, sortOrder);
  }, [searchValue, genre, priceRange, adaOnly, sortOrder]);

  const eventsByDate = useMemo(() => getCalendarMap(visibleEvents), [visibleEvents]);

  return (
    // site title
    <div className="app-shell">
      <header>
        <h1>Local Live</h1>
        <p className="subtitle">Find nearby concerts happening soon.</p>
      </header>

      {/* container for search bar and filters: */}
      <section className="controls" aria-label="Search and filter controls">
        <label htmlFor="search">Search concerts</label>
        {/* search bar */}
        <div className="search-row">
          <input
            id="search"
            name="search"
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search name, city, venue, genre"
          />
          {/* clear button only renders when search has text */}
          {searchValue && (
            <button type="button" onClick={() => setSearchValue("")}>
              Clear
            </button>
          )}
        </div>

        {/* filter bar */}
        <div className="filterRow">
          {/* genre filter */}
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

          {/* price filter */}
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

          {/* ada filter */}
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

          {/* sort filter */}
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

          {/* button to reset filters */}
          <div className="filterGroup" style={{ flex: 'none', minWidth: "auto", justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="link-button"
              onClick={resetFilters}
              style={{ paddingBottom: '8px' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <main>
        <section aria-label="Upcoming concerts section">
          <h2>Upcoming Concerts</h2>
          {/* if filters exclude all concerts, informs user and offers another reset filters button */}
          {visibleEvents.length === 0 && (
            <div className="noResults">
              <p>No concerts match the selected filters.{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={resetFilters}
                >
                  Reset Filters.
                </button>
              </p>
            </div>
          )}

          <ul className="concert-list">
            {visibleEvents.map((event) => (
              <li className="concert-card" key={event.id}>
                <h3>{event.name}</h3>
                <p>
                  {event.date} | {event.genre}
                </p>
                <p>
                  {event.location} | {event.venue}
                  {event.isADAComp && (
                    <span
                      title="ADA Compliant"
                      aria-label="ADA Compliant Venue"
                      style={{ color: '#005eb8', marginLeft: '6px' }}
                    >
                      {'♿\uFE0E'}
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