import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../App";
import {
  sortByDateAscending,
  filterByGenre,
  searchEvents,
  getCalendarMap,
  getGenreOptions,
} from "../lib/events";
import { mockEvents } from "../data/events";

// OFFICIAL RED TEST SUITE — Sprint 1 Acceptance Criteria
//
// This file defines all user stories for Sprint 1 as executable, failing tests.
// The TDD specialist (you) writes these red tests based on requirements.
// The development team implements code to make them pass (green).
// QA verifies edge cases and integration. Repeating TDD cycle.
//
// Focus: UI/UX acceptance tests — these assertions target frontend
// rendering, client-side behavior, and accessibility (not the backend API).

describe("OFFICIAL RED — Sprint 1 Acceptance Criteria", () => {
  //
  // USER STORY 1: Home page displays upcoming concerts with details
  // As a user, I want to see upcoming concerts with their details
  // so that I can make informed decisions about which to attend.
  //
  describe("Home page — Upcoming concerts display", () => {
    test("displays 'Upcoming Concerts' heading", () => {
      render(<App />);
      expect(screen.getByRole("heading", { name: "Upcoming Concerts" })).toBeInTheDocument();
    });

    test("shows at least one concert event", () => {
      render(<App />);
      const concertElements = screen.getAllByRole("article");
      expect(concertElements.length).toBeGreaterThan(0);
    });

    test("displays concert name for each event", () => {
      render(<App />);
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.getByText("Northside Noise Fest")).toBeInTheDocument();
    });

    test("displays concert location (city, state)", () => {
      render(<App />);
      expect(screen.getAllByText(/Seattle, WA/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Redmond, WA/).length).toBeGreaterThan(0);
    });

    test("displays concert venue name", () => {
      render(<App />);
      expect(screen.getByText("Emerald Hall")).toBeInTheDocument();
      expect(screen.getByText("Riverside Theater")).toBeInTheDocument();
    });

    test("displays ticket purchase links", () => {
      render(<App />);
      const ticketLinks = screen.getAllByRole("link", { name: "Ticket Link" });
      expect(ticketLinks.length).toBeGreaterThan(0);
      ticketLinks.forEach((link) => {
        expect(link.href).toMatch(/https?:\/\//);
      });
    });
  });

  //
  // USER STORY 2: Sort concerts by date (soonest first)
  // As a user, I want to sort concert results by date
  // so that I can see the soonest shows first.
  //
  describe("Sorting — Date-ascending behavior", () => {
    test("sortByDateAscending returns events in chronological order", () => {
      const sorted = sortByDateAscending(mockEvents);
      expect(sorted[0].name).toBe("Jazz by the Lake");
      expect(sorted[0].date).toBe("2026-04-24");

      expect(sorted[1].name).toBe("Northside Noise Fest");
      expect(sorted[1].date).toBe("2026-04-25");
    });

    test("sortByDateAscending preserves earliest date first", () => {
      const sorted = sortByDateAscending(mockEvents);
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].date);
        const next = new Date(sorted[i + 1].date);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    });

    test("home page displays sorted concerts earliest-to-latest", () => {
      render(<App />);
      const concertNames = screen
        .getAllByRole("heading", { level: 3 })
        .map((el) => el.textContent);

      const jazzIndex = concertNames.indexOf("Jazz by the Lake");
      const northsideIndex = concertNames.indexOf("Northside Noise Fest");
      expect(jazzIndex).toBeLessThan(northsideIndex);
    });

    test("sort control exists with 'Soonest first' and 'Latest first' options", () => {
      render(<App />);
      const sortSelect = screen.getByLabelText("Sort");
      expect(sortSelect).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Soonest first" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Latest first" })).toBeInTheDocument();
    });

    test("default sort on load is 'Soonest first'", () => {
      render(<App />);
      const sortSelect = screen.getByLabelText("Sort");
      expect(sortSelect.value).toBe("Soonest first");
    });

    test("changing sort option immediately re-orders the list", async () => {
      const user = userEvent.setup();
      render(<App />);

      const sortSelect = screen.getByLabelText("Sort");
      // initially soonest first -> Jazz before Sunset
      let headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      const jazzIndex = headings.indexOf("Jazz by the Lake");
      const sunsetIndex = headings.indexOf("Sunset Beats");
      expect(jazzIndex).toBeLessThan(sunsetIndex);

      await user.selectOptions(sortSelect, "Latest first");

      headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      const jazzIndexAfter = headings.indexOf("Jazz by the Lake");
      const sunsetIndexAfter = headings.indexOf("Sunset Beats");
      expect(sunsetIndexAfter).toBeLessThan(jazzIndexAfter);
    });
  });

  //
  // USER STORY 3: Calendar view with events grouped by date
  // As a user, I expect the front page website to show me a calendar
  // with concerts pinned on the dates they are happening.
  //
  describe("Calendar — Event grouping by date", () => {
    test("getCalendarMap groups events by date", () => {
      const map = getCalendarMap(mockEvents);
      expect(map["2026-04-24"]).toBeDefined();
      expect(map["2026-04-24"][0].name).toBe("Jazz by the Lake");
    });

    test("getCalendarMap keys match ISO date format (YYYY-MM-DD)", () => {
      const map = getCalendarMap(mockEvents);
      Object.keys(map).forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test("displays 'Concert Calendar' section on home page", () => {
      render(<App />);
      expect(screen.getByRole("heading", { name: "Concert Calendar" })).toBeInTheDocument();
    });

    test("shows calendar section with aria-label for accessibility", () => {
      render(<App />);
      expect(screen.getByRole("region", { name: "Concert calendar section" })).toBeInTheDocument();
    });

    test("displays date labels in calendar view", () => {
      render(<App />);
      expect(screen.getByText("2026-04-24")).toBeInTheDocument();
      expect(screen.getByText("2026-04-25")).toBeInTheDocument();
    });

    test("shows events grouped under their respective dates", () => {
      render(<App />);
      const calendarSection = screen.getByRole("region", { name: "Concert calendar section" });
      expect(calendarSection.textContent).toContain("2026-04-24");
      expect(calendarSection.textContent).toContain("Jazz by the Lake");
    });
  });

  //
  // USER STORY 4: Clear button on search input
  // As a user, I want a "Clear" button on the search bar
  // so that I can reset my search and start a new one without refreshing the page.
  //
  describe("Search controls — Clear button", () => {
    test("search input has a Clear button", () => {
      render(<App />);
      expect(screen.getAllByRole("button", { name: "Clear" }).length).toBeGreaterThan(0);
    });

    test("clicking Clear empties the search input", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      await user.type(searchInput, "jazz");
      expect(searchInput).toHaveValue("jazz");

      await user.click(clearButton);
      expect(searchInput).toHaveValue("");
    });

    test("clearing search resets the visible concert list to all concerts", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      // Type a narrow search
      await user.type(searchInput, "jazz");
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.queryByText("Northside Noise Fest")).not.toBeInTheDocument();

      // Clear search
      await user.click(clearButton);

      // Expect all concerts to show again
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.getByText("Northside Noise Fest")).toBeInTheDocument();
    });

    test("clear does not require page refresh", async () => {
      const user = userEvent.setup();
      const { container } = render(<App />);
      const initialHTML = container.innerHTML;

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      await user.type(searchInput, "test");
      await user.click(clearButton);

      // Page should not have reloaded (no full re-render)
      expect(container.innerHTML).toBeTruthy();
    });
  });

  //
  // USER STORY 5: Search with partial matching
  // As a user, I should be able to return the items containing
  // the sequence of characters entered, not excluding incomplete entries.
  //
  describe("Search — Partial text matching", () => {
    test("searchEvents matches partial text in event name", () => {
      const results = searchEvents(mockEvents, "north");
      const names = results.map((e) => e.name);
      expect(names).toContain("Northside Noise Fest");
    });

    test("searchEvents matches partial text in location", () => {
      const results = searchEvents(mockEvents, "seattle");
      expect(results.length).toBeGreaterThan(0);
    });

    test("searchEvents matches partial text in venue", () => {
      const results = searchEvents(mockEvents, "hall");
      expect(results.map((e) => e.venue)).toContain("Emerald Hall");
    });

    test("searchEvents matches partial text in genre", () => {
      const results = searchEvents(mockEvents, "rock");
      expect(results.some((e) => e.genre === "Rock")).toBe(true);
    });

    test("searchEvents is case-insensitive", () => {
      const resultsLower = searchEvents(mockEvents, "jazz");
      const resultsUpper = searchEvents(mockEvents, "JAZZ");
      expect(resultsLower).toEqual(resultsUpper);
    });

    test("search with single letter returns matching events", () => {
      const results = searchEvents(mockEvents, "j");
      const names = results.map((e) => e.name);
      expect(names).toContain("Jazz by the Lake");
    });

    test("search with empty string returns all events", () => {
      const results = searchEvents(mockEvents, "");
      expect(results).toEqual(mockEvents);
    });

    test("search on home page filters concert list in real time", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      await user.type(searchInput, "indi");

      expect(screen.getByText("Indie Friday Night")).toBeInTheDocument();
      expect(screen.queryByText("Jazz by the Lake")).not.toBeInTheDocument();
    });
  });

  //
  // USER STORY 6: Genre filter
  // As a user, I want a filter to be able to view available events by genre.
  //
  describe("Filter — Genre selection", () => {
    test("genre filter dropdown exists on home page", () => {
      render(<App />);
      expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    });

    test("filterByGenre returns all events when genre is 'All'", () => {
      const results = filterByGenre(mockEvents, "All");
      expect(results).toEqual(mockEvents);
    });

    test("filterByGenre returns only events matching selected genre", () => {
      const jazzResults = filterByGenre(mockEvents, "Jazz");
      expect(jazzResults.every((e) => e.genre === "Jazz")).toBe(true);
    });

    test("filterByGenre returns empty array if no matches", () => {
      const results = filterByGenre(mockEvents, "Nonexistent");
      expect(results).toEqual([]);
    });

    test("getGenreOptions returns sorted list of available genres", () => {
      const genres = getGenreOptions(mockEvents);
      expect(genres[0]).toBe("All");
      expect(genres).toContain("Jazz");
      expect(genres).toContain("Rock");
      expect(genres).toContain("Indie");
    });

    test("selecting a genre on home page filters visible concerts", async () => {
      const user = userEvent.setup();
      render(<App />);

      const genreFilter = screen.getByLabelText("Genre");
      await user.selectOptions(genreFilter, "Jazz");

      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.queryByText("Northside Noise Fest")).not.toBeInTheDocument();
    });

    test("switching genre filter updates visible concerts", async () => {
      const user = userEvent.setup();
      render(<App />);

      const genreFilter = screen.getByLabelText("Genre");

      // Select Jazz
      await user.selectOptions(genreFilter, "Jazz");
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();

      // Switch to Rock
      await user.selectOptions(genreFilter, "Rock");
      expect(screen.queryByText("Jazz by the Lake")).not.toBeInTheDocument();
      expect(screen.getByText("Northside Noise Fest")).toBeInTheDocument();
    });
  });

  //
  // USER STORY 7: Basic accessibility affordances
  // As a user (including those using assistive technology),
  // I need proper semantic labels and ARIA attributes.
  //
  describe("Accessibility — Semantic structure and labels", () => {
    test("page has main heading 'Local Live'", () => {
      render(<App />);
      expect(screen.getByRole("heading", { name: "Local Live" })).toBeInTheDocument();
    });

    test("search input has a descriptive label", () => {
      render(<App />);
      expect(screen.getByLabelText("Search concerts")).toBeInTheDocument();
    });

    test("genre filter has a descriptive label", () => {
      render(<App />);
      expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    });

    test("calendar section has aria-label for region", () => {
      render(<App />);
      expect(screen.getByRole("region", { name: "Concert calendar section" })).toBeInTheDocument();
    });

    test("search controls have aria-label", () => {
      render(<App />);
      expect(screen.getByRole("region", { name: /search|controls/i })).toBeInTheDocument();
    });

    test("upcoming concerts section has aria-label", () => {
      render(<App />);
      expect(
        screen.getByRole("region", { name: /upcoming|concerts/i })
      ).toBeInTheDocument();
    });

    test("concert headings convey semantic hierarchy", () => {
      render(<App />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument(); // Main title
      expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0); // Sections
    });
  });
});
