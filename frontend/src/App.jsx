import React from "react";
import { useMemo, useState } from "react";
import EventCalendar from "./components/EventCalendar";
import { mockEvents } from "./data/events";
import {
  filterByGenre,
  getCalendarMap,
  getGenreOptions,
  searchEvents,
  sortByDateAscending
} from "./lib/events";

function App() {
  const [searchValue, setSearchValue] = useState("");
  const [genre, setGenre] = useState("All");

  const genreOptions = useMemo(() => getGenreOptions(mockEvents), []);

  const visibleEvents = useMemo(() => {
    const searched = searchEvents(mockEvents, searchValue);
    const byGenre = filterByGenre(searched, genre);
    return sortByDateAscending(byGenre);
  }, [searchValue, genre]);

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
          <button type="button" onClick={() => setSearchValue("")}>
            Clear
          </button>
        </div>

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
      </section>

      <main>
        <section aria-label="Upcoming concerts section">
          <h2>Upcoming Concerts</h2>
          <ul className="concert-list">
            {visibleEvents.map((event) => (
              <li className="concert-card" key={event.id}>
                <h3>{event.name}</h3>
                <p>
                  {event.date} | {event.genre}
                </p>
                <p>
                  {event.location} | {event.venue}
                </p>
                <a href={event.ticketLink}>Ticket Link</a>
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
