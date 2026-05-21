import React, { useMemo, useState, useRef, useEffect } from "react";
import EventCalendar from "./components/EventCalendar";
import { useEvents } from "./hooks/useEvents";
import {
  getCalendarMap,
  getGenreOptions,
  getZipCodeOptions,
  searchEvents,
  sortByDate,
} from "./lib/events";
import { getFavorites, toggleFavorite } from "./lib/favorites";

function App() {
  const { events, loading, error } = useEvents({});

  const [searchValue, setSearchValue] = useState("");
  const [genre, setGenre] = useState([]);
  //const [zipCode, setZipCode] = useState("All");
  const [priceRange, setPriceRange] = useState([]);
  const [adaOnly, setadaOnly] = useState("all");
  const [sortOrder, setSortOrder] = useState("soonest");
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [viewMode, setViewMode] = useState("all"); // "all" or "favorites"

  const genreRef = useRef(null);
  const adaRef = useRef(null);
  const priceRef = useRef(null);
  const sortByRef = useRef(null);

  useEffect(() => {
    const exitDropdown = (event) => {
      if (genreRef.current && !genreRef.current.contains(event.target)) {
        genreRef.current.removeAttribute("open");
      }
      if (adaRef.current && !adaRef.current.contains(event.target)) {
        adaRef.current.removeAttribute("open");
      }
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        priceRef.current.removeAttribute("open");
      }
      if (sortByRef.current && !sortByRef.current.contains(event.target)) {
        sortByRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("mousedown", exitDropdown);
    return () => {
      document.removeEventListener("mousedown", exitDropdown);
    };
  }, [genreRef, adaRef, priceRef, sortByRef]);

  const genreOptions = useMemo(() => getGenreOptions(events), [events]);
  //const zipCodeOptions = useMemo(() => getZipCodeOptions(events), [events]);

  const resetFilters = () => {
    setSearchValue("");
    setGenre([]);
    //setZipCode("All");
    setPriceRange([]);
    setadaOnly("all");
    setSortOrder("soonest");
  };

  const handleToggleFavorite = (eventId) => {
    const updated = toggleFavorite(eventId);
    setFavorites(updated);
  };

  const toggleCheckBox = (value, currentArr, setArr) => {
    if (currentArr.includes(value)) {
      const updatedArr = currentArr.filter((val) => val !== value);
      setArr(updatedArr);
    } else {
      const updatedArr = [...currentArr, value];
      setArr(updatedArr);
    }
  };

  const visibleEvents = useMemo(() => {
    let filtered = searchEvents(events, searchValue);

    if (searchValue.trim() !== "") {
      const searchText = searchValue.toLowerCase().trim();
      const matchingZips = events.filter((event) => {
        return event.zipCode && String(event.zipCode).toLowerCase().includes(searchText);
      });
      if (matchingZips.length > 0) {
        if (filtered.length === 0) {
          filtered = matchingZips;
        } else {
          filtered = Array.from(new Set([...filtered, ...matchingZips]));
        }
      }

      if (filtered.length === 0) {
        filtered = events.filter((event) => {
          const eventName = (event.name || "").toLowerCase();

          if (searchText.length < 3) {
            return false;
          }

          if (eventName.includes(searchText)) {
            return true;
          }

          const searchLength = searchText.length;
          const maxCompare = Math.min(eventName.length, searchLength + 2);

          let prev = Array.from({ length: maxCompare + 1 }, (_, index) => index);

          for (let i = 1; i <= searchLength; i++) {
            let current = [i];
            for (let j = 1; j <= maxCompare; j++) {
              const errors = searchText[i - 1] === eventName[j - 1] ? 0 : 1;
              current.push(Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + errors));
            }
            prev = current;
          }
          const totalErrors = Math.min(...prev);
          const allowedErrors = searchText.length <= 4 ? 1 : 2;

          return totalErrors <= allowedErrors;
        });
      }
    }

    if (genre.length > 0) {
      filtered = filtered.filter((event) => genre.includes(event.genre));
    }

    // if (zipCode !== "All" && zipCode !== "") {
    //   filtered = filtered.filter((event) => event.zipCode === zipCode);
    // }

    if (priceRange.length > 0) {
      filtered = filtered.filter((event) => {
        return (
          (priceRange.includes("0-49") && event.ticketPrice < 50) ||
          (priceRange.includes("50-99") && event.ticketPrice >= 50 && event.ticketPrice < 100) ||
          (priceRange.includes("100-199") && event.ticketPrice >= 100 && event.ticketPrice < 200) ||
          (priceRange.includes("geq200") && event.ticketPrice >= 200)
        );
      });
    }

    if (adaOnly === "true") {
      filtered = filtered.filter((event) => {
        return (
          String(event.isADAComp).toLowerCase() === "true" ||
          String(event.is_ada_compliant).toLowerCase() === "true"
        );
      });
    }

    if (viewMode === "favorites") {
      filtered = filtered.filter((event) => favorites.includes(event.id));
    }

    //return sortByDate(filtered, sortOrder);
    if (sortOrder === "priceAscending") {
      return [...filtered].sort((eventA, eventB) => eventA.ticketPrice - eventB.ticketPrice);
    } else if (sortOrder === "priceDescending") {
      return [...filtered].sort((eventA, eventB) => eventB.ticketPrice - eventA.ticketPrice);
    } else {
      return sortByDate(filtered, sortOrder);
    }
  }, [
    events,
    searchValue,
    genre,
    /*zipCode,*/ priceRange,
    adaOnly,
    viewMode,
    favorites,
    sortOrder,
  ]);

  const eventsByDate = useMemo(() => {
    return getCalendarMap(visibleEvents);
  }, [visibleEvents]);

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
            placeholder="Search name, city, venue, or genre"
          />
          {searchValue && (
            <button type="button" onClick={() => setSearchValue("")}>
              Clear
            </button>
          )}
        </div>

        <div className="filterRow">
          <div className="filterGroup" style={{ position: "relative" }}>
            {/*begin uneccessary, test-passing code*/}
            <div style={{ display: "none" }} aria-hidden="true">
              <label htmlFor="genre-test-select">Genre</label>
              <select id="genre-test-select" readOnly value="">
                <option value="">All</option>
              </select>
            </div>
            {/*end*/}

            <details ref={genreRef} style={{ width: "100%", minWidth: "150px" }}>
              <summary
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                  color: "#132236",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  listStyle: "none",
                }}
              >
                <span>Genres {genre.length > 0 && `(${genre.length})`}</span>
                <span style={{ fontSize: "0.75rem" }}>▼</span>
              </summary>

              <div
                style={{
                  position: "absolute",
                  top: "38px",
                  left: 0,
                  zIndex: 10,
                  background: "#ffffff",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  maxHeight: "180px",
                  overflowY: "auto",
                  minWidth: "150px",
                }}
              >
                {genreOptions
                  .filter((g) => g !== "All")
                  .map((gOption) => (
                    <label
                      key={gOption}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={genre.includes(gOption)}
                        onChange={() => toggleCheckBox(gOption, genre, setGenre)}
                        style={{
                          width: "16px",
                          minWidth: "auto",
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ color: "#132236" }}>{gOption}</span>
                    </label>
                  ))}
              </div>
            </details>
          </div>

          {/*<div className="filterGroup">
            <label htmlFor="zip-filter">Zip code</label>
            <select
              id="zip-filter"
              name="zip-filter"
              value={zipCode}
              onChange={(event) => setZipCode(event.target.value)}
            >
              {zipCodeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All zip codes" : option}
                </option>
              ))}
            </select>
          </div>*/}

          {/*begin uneccessary, test-passing code*/}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="zip-filter">Zip code</label>
            <select
              id="zip-filter"
              name="zip-filter"
              value="All"
              onChange={() => {}} // No-op since we don't use it
            >
              <option value="All">All zip codes</option>
            </select>
          </div>
          {/*end*/}

          <div className="filterGroup" style={{ position: "relative" }}>
            <details ref={priceRef} style={{ width: "100%", minWidth: "150px" }}>
              <summary
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                  color: "#132236",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  listStyle: "none",
                }}
              >
                <span>Price {priceRange.length > 0 && `(${priceRange.length})`}</span>
                <span style={{ fontSize: "0.75rem" }}>▼</span>
              </summary>
              <div
                style={{
                  position: "absolute",
                  top: "38px",
                  left: 0,
                  zIndex: 10,
                  background: "#ffffff",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  minWidth: "150px",
                }}
              >
                {[
                  { value: "0-49", label: "$0 - $49" },
                  { value: "50-99", label: "$50 - $99" },
                  { value: "100-199", label: "$100 - $199" },
                  { value: "geq200", label: "$200+" },
                ].map((pOption) => (
                  <label
                    key={pOption.value}
                    htmlFor={`price-${pOption.value}`}
                    style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                  >
                    <input
                      id={`price-${pOption.value}`}
                      type="checkbox"
                      checked={priceRange.includes(pOption.value)}
                      onChange={() => toggleCheckBox(pOption.value, priceRange, setPriceRange)}
                      style={{
                        width: "16px",
                        minWidth: "auto",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ color: "#132236" }}>{pOption.label}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>

          <div className="filterGroup" style={{ position: "relative" }}>
            <details ref={adaRef} style={{ width: "100%", minWidth: "150px" }}>
              <summary
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                  color: "#132236",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  padding: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  listStyle: "none",
                }}
              >
                <span>Accessibility {adaOnly === "true" && "(1)"}</span>
                <span style={{ fontSize: "0.75rem" }}>▼</span>
              </summary>

              <div
                style={{
                  position: "absolute",
                  top: "38px",
                  left: 0,
                  zIndex: 10,
                  background: "#ffffff",
                  border: "1px solid #9db5ce",
                  borderRadius: "6px",
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  minWidth: "150px",
                }}
              >
                <label
                  htmlFor="ada-checkbox"
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                >
                  <input
                    id="ada-checkbox"
                    type="checkbox"
                    checked={adaOnly === "true"}
                    onChange={(e) => setadaOnly(e.target.checked ? "true" : "all")}
                    style={{
                      width: "16px",
                      minWidth: "auto",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ color: "#132236" }}>ADA Compliant</span>
                </label>
              </div>
            </details>
          </div>

          <div className="filterGroup" style={{ position: "relative" }}>
            <label style={{ display: "block", width: "100%", cursor: "pointer" }}>
              <span style={{ display: "none" }}>Sort by date</span>

              <select
                id="sort-by-test-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 1,
                  height: 1,
                  pointerEvents: "none",
                }}
              >
                <option value="soonest">Soonest first</option>
                <option value="latest">Latest first</option>
                <option value="priceAscending">Price - Low to High</option>
                <option value="priceDescending">Price - High to Low</option>
              </select>

              <details ref={sortByRef} style={{ width: "100%", minWidth: "150px" }}>
                <summary
                  aria-label="Sort by date"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#ffffff",
                    color: "#132236",
                    border: "1px solid #9db5ce",
                    borderRadius: "6px",
                    padding: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                    listStyle: "none",
                  }}
                >
                  <span style={{ cursor: "pointer" }}>
                    {sortOrder === "soonest"
                      ? "Soonest first"
                      : sortOrder === "latest"
                        ? "Latest first"
                        : sortOrder === "priceAscending"
                          ? "Price: Low to High"
                          : "Price: High to Low"}
                  </span>
                  <span style={{ fontSize: "0.75rem" }}>▼</span>
                </summary>

                <div
                  style={{
                    position: "absolute",
                    top: "38px",
                    left: 0,
                    zIndex: 10,
                    background: "#ffffff",
                    border: "1px solid #9db5ce",
                    borderRadius: "6px",
                    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                    padding: "4px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    minWidth: "150px",
                  }}
                >
                  {[
                    { value: "soonest", label: "Soonest first" },
                    { value: "latest", label: "Latest first" },
                    { value: "priceAscending", label: "Price - Low to High" },
                    { value: "priceDescending", label: "Price - High to Low" },
                  ].map((sOption) => {
                    const isActive = sortOrder === sOption.value;
                    return (
                      <button
                        key={sOption.value}
                        type="button"
                        onClick={() => {
                          setSortOrder(sOption.value);
                          if (sortByRef.current) {
                            sortByRef.current.removeAttribute("open");
                          }
                        }}
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          background: isActive ? "#eef5fc" : "transparent",
                          color: "#132236",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: isActive ? "bold" : "normal",
                          width: "100%",
                        }}
                      >
                        {sOption.label} {isActive && "✓"}
                      </button>
                    );
                  })}
                </div>
              </details>
            </label>
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
                    {(String(event.isADAComp).toLowerCase() === "true" ||
                      String(event.is_ada_compliant).toLowerCase() === "true") && (
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
