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
  const [zipCode, setZipCode] = useState([]);
  const [zipSearchText, setZipSearchText] = useState("");
  const [priceRange, setPriceRange] = useState([]);
  const [adaOnly, setadaOnly] = useState("all");
  const [sortOrder, setSortOrder] = useState("soonest");
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [viewMode, setViewMode] = useState("all");

  const [displayCount, setDisplayCount] = useState(10);
  const [mult, setMult] = useState(1);

  const genreRef = useRef(null);
  const zipRef = useRef(null);
  const adaRef = useRef(null);
  const priceRef = useRef(null);
  const sortByRef = useRef(null);

  useEffect(() => {
    const exitDropdown = (event) => {
      if (genreRef.current && !genreRef.current.contains(event.target)) {
        genreRef.current.removeAttribute("open");
      }
      if (zipRef.current && !zipRef.current.contains(event.target)) {
        zipRef.current.removeAttribute("open");
        setZipSearchText("");
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
  }, [genreRef, zipRef, adaRef, priceRef, sortByRef]);

  useEffect(() => {
    setMult(1);
  }, [searchValue]);

  const genreOptions = useMemo(() => getGenreOptions(events), [events]);
  const zipCodeOptions = useMemo(() => getZipCodeOptions(events), [events]);

  const filteredZipOptions = useMemo(() => {
    return zipCodeOptions
      .filter((z) => z !== "All")
      .filter((zOption) =>
        String(zOption).toLowerCase().includes(zipSearchText.toLowerCase().trim()),
      );
  }, [zipCodeOptions, zipSearchText]);

  const resetFilters = () => {
    setSearchValue("");
    setGenre([]);
    setZipCode([]);
    setZipSearchText("");
    setPriceRange([]);
    setadaOnly("all");
    setSortOrder("soonest");
    setDisplayCount(10);
    setMult(1);
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

  const availableEvents = useMemo(() => {
    
    // ADD LATER: will only show upcoming events and hide events that have passed) //

    // const tempEvents = Array.isArray(events) ? events : [];
    // const today = new Date().toISOString().split('T')[0];
    // const currentEvents = tempEvents.filter(event => event && event.date && event.date >= today);

    // let filtered = searchEvents(currentEvents, searchValue);

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

    if (zipCode.length > 0) {
      filtered = filtered.filter((event) => zipCode.includes(event.zipCode));
    }

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

    if (sortOrder === "priceAscending") {
      return [...filtered].sort((eventA, eventB) => eventA.ticketPrice - eventB.ticketPrice);
    } else if (sortOrder === "priceDescending") {
      return [...filtered].sort((eventA, eventB) => eventB.ticketPrice - eventA.ticketPrice);
    } else {
      return sortByDate(filtered, sortOrder);
    }
  }, [events, searchValue, genre, zipCode, priceRange, adaOnly, viewMode, favorites, sortOrder]);

  const currentCount = displayCount * mult;

  const visibleEvents = useMemo(() => {
    return availableEvents.slice(0, currentCount);
  }, [availableEvents, currentCount]);

  const eventsByDate = useMemo(() => {
    return getCalendarMap(visibleEvents);
  }, [visibleEvents]);

  const changeDisplayCount = (event) => {
    setDisplayCount(Number(event.target.value));
    setMult(1);
  };

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
            placeholder="Search name, city, venue, zip code, or genre"
          />
          {searchValue && (
            <button type="button" onClick={() => setSearchValue("")}>
              Clear
            </button>
          )}
        </div>

        <div className="filterRow">
          <div className="filterGroup" style={{ position: "relative", minWidth: "150px" }}>
            <details ref={genreRef} style={{ width: "100%" }}>
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
                  width: "100%",
                  boxSizing: "border-box",
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
                        style={{ width: "16px", minWidth: "auto", cursor: "pointer" }}
                      />
                      <span style={{ color: "#132236" }}>{gOption}</span>
                    </label>
                  ))}
              </div>
            </details>
          </div>

          <div
            className="filterGroup"
            style={{ position: "relative", minWidth: "150px", width: "150px" }}
          >
            <details ref={zipRef} style={{ width: "100%" }}>
              <summary
                aria-label="Zip code"
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
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <span>Zip Codes {zipCode.length > 0 && `(${zipCode.length})`}</span>
                <span style={{ fontSize: "0.75rem" }}>▼</span>
              </summary>

              <div
                ref={(el) => {
                  if (el) {
                    el.style.setProperty("width", "165px", "important");
                    el.style.setProperty("max-width", "165px", "important");
                  }
                }}
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
                  maxHeight: "220px",
                  overflowY: "auto",
                  boxSizing: "border-box",
                }}
              >
                <input
                  ref={(el) => {
                    if (el) {
                      el.style.setProperty("width", "150px", "important");
                      el.style.setProperty("max-width", "150px", "important");
                      el.style.setProperty("min-width", "150px", "important");
                    }
                  }}
                  type="text"
                  placeholder="Type to filter..."
                  value={zipSearchText}
                  onChange={(e) => setZipSearchText(e.target.value)}
                  style={{
                    padding: "4px 6px",
                    border: "1px solid #9db5ce",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    marginBottom: "4px",
                    boxSizing: "border-box",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    overflowY: "auto",
                  }}
                >
                  {filteredZipOptions.map((zOption) => (
                    <label
                      key={zOption}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={zipCode.includes(zOption)}
                        onChange={() => toggleCheckBox(zOption, zipCode, setZipCode)}
                        style={{ width: "16px", minWidth: "auto", cursor: "pointer" }}
                      />
                      <span style={{ color: "#132236", fontSize: "0.9rem" }}>{zOption}</span>
                    </label>
                  ))}
                  {filteredZipOptions.length === 0 && (
                    <span style={{ color: "#7a8c9e", fontSize: "0.85rem", padding: "4px" }}>
                      No zips found
                    </span>
                  )}
                </div>
              </div>
            </details>
          </div>

          <div className="filterGroup" style={{ position: "relative", minWidth: "150px" }}>
            <details ref={priceRef} style={{ width: "100%" }}>
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
                  width: "100%",
                  boxSizing: "border-box",
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
                      style={{ width: "16px", minWidth: "auto", cursor: "pointer" }}
                    />
                    <span style={{ color: "#132236" }}>{pOption.label}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>

          <div className="filterGroup" style={{ position: "relative", minWidth: "150px" }}>
            <details ref={adaRef} style={{ width: "100%" }}>
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
                  width: "100%",
                  boxSizing: "border-box",
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
                    style={{ width: "16px", minWidth: "auto", cursor: "pointer" }}
                  />
                  <span style={{ color: "#132236" }}>ADA Compliant</span>
                </label>
              </div>
            </details>
          </div>

          <div className="filterGroup" style={{ position: "relative", minWidth: "150px" }}>
            <details ref={sortByRef} style={{ width: "100%" }}>
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
                <span>
                  Sort:{" "}
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
                  width: "100%",
                  boxSizing: "border-box",
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
          <div
            style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "1rem" }}
          >
            <h2 style={{ margin: 0 }}>Upcoming Concerts</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
                fontSize: "0.85rem",
                gap: "0.4rem",
              }}
            >
              <span style={{ color: "#005eb8" }}>Show groups of:</span>
              {[10, 25, 50].map((num, idx) => {
                const isActive = displayCount === num;
                return (
                  <React.Fragment key={num}>
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayCount(num);
                        setMult(1);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        font: "inherit",
                        cursor: "pointer",
                        color: "#005eb8",
                        fontWeight: isActive ? "bold" : "normal",
                        textDecoration: "none",
                      }}
                    >
                      {num}
                    </button>
                    {idx < 2 && <span style={{ color: "#9db5ce", margin: "0 0.1rem" }}>|</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

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
                    Reset Filters
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
          {!loading &&
            !error &&
            availableEvents.length > visibleEvents.length &&
            (() => {
              const remainingCount = availableEvents.length - visibleEvents.length;
              const nextAmountToShow = Math.min(displayCount, remainingCount);

              return (
                <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0" }}>
                  <button
                    type="button"
                    onClick={() => setMult((prev) => prev + 1)}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "#005eb8",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "normal",
                      cursor: "pointer",
                    }}
                  >
                    Show {nextAmountToShow} more {nextAmountToShow === 1 ? "result" : "results"}
                  </button>
                </div>
              );
            })()}
        </section>
        <EventCalendar eventsByDate={eventsByDate} />
      </main>
    </div>
  );
}

export default App;
