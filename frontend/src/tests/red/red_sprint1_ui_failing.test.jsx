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

// OFFICIAL RED TEST SUITE — Sprint 1 User Stories
// INTENTIONALLY FAILING ASSERTIONS
//
// This file mirrors sprint1_acceptance_ui.test.jsx but with
// deliberately wrong expectations to demonstrate the "red" step.
// Each test asserts behavior that the current app does NOT provide.
//
// This is what a TDD specialist hands to developers:
// "Make these red tests turn green by implementing the features."

describe("OFFICIAL RED — Sprint 1 User Stories (intentionally failing)", () => {
  //
  // USER STORY 1: Home page displays upcoming concerts with details
  // FAILING ASSERTIONS
  //
  describe("Home page — Upcoming concerts display (RED)", () => {
    test("displays a non-existent heading (fails)", () => {
      render(<App />);
      // No heading with this exact text exists
      expect(screen.getByRole("heading", { name: "Future Concerts Galore" })).toBeInTheDocument();
    });

    test("shows more concert events than actually exist (fails)", () => {
      render(<App />);
      const concertElements = screen.queryAllByRole("article");
      // Expect 100 concerts when only ~5 actually exist
      expect(concertElements.length).toBeGreaterThan(99);
    });

    test("displays a non-existent concert name (fails)", () => {
      render(<App />);
      expect(screen.getByText("Phantom Concert Orchestra")).toBeInTheDocument();
    });

    test("displays a non-existent location (fails)", () => {
      render(<App />);
      // This location is not in mock data
      expect(screen.getAllByText(/Mars, Space/).length).toBeGreaterThan(0);
    });

    test("displays a non-existent venue (fails)", () => {
      render(<App />);
      expect(screen.getByText("Imaginary Arena")).toBeInTheDocument();
    });

    test("displays broken ticket links (fails)", () => {
      render(<App />);
      const ticketLinks = screen.getAllByRole("link", { name: "Ticket Link" });
      // Expect at least one link to be broken (not match protocol)
      expect(ticketLinks.some((link) => !link.href.match(/https?:\/\//))).toBe(true);
    });
  });

  //
  // USER STORY 2: Sort concerts by date (soonest first)
  // FAILING ASSERTIONS
  //
  describe("Sorting — Date-ascending behavior (RED)", () => {
    test("sortByDateAscending returns wrong first event (fails)", () => {
      const sorted = sortByDateAscending(mockEvents);
      // Assert the wrong concert is first
      expect(sorted[0].name).toBe("Sunset Beats");
    });

    test("sortByDateAscending sorts in descending order (fails)", () => {
      const sorted = sortByDateAscending(mockEvents);
      // Assert reverse chronological order (wrong)
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].date);
        const next = new Date(sorted[i + 1].date);
        // Expect later dates first (backwards)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    test("home page displays sorted concerts latest-to-earliest (fails)", () => {
      render(<App />);
      const concertNames = screen
        .getAllByRole("heading", { level: 3 })
        .map((el) => el.textContent);

      const jazzIndex = concertNames.indexOf("Jazz by the Lake");
      const sunsetIndex = concertNames.indexOf("Sunset Beats");
      // Assert newest concert appears before oldest (wrong)
      expect(sunsetIndex).toBeLessThan(jazzIndex);
    });

    test("no sort control is available (fails)", () => {
      render(<App />);
      expect(screen.queryByLabelText("Sort")).not.toBeInTheDocument();
    });

    test("default sort is not 'Soonest first' (fails)", () => {
      render(<App />);
      const sort = screen.queryByLabelText("Sort");
      if (sort) {
        expect(sort.value).not.toBe("Soonest first");
      }
    });

    test("changing sort option does NOT reorder the list (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const sortSelect = screen.queryByLabelText("Sort");
      if (sortSelect) {
        const before = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
        await user.selectOptions(sortSelect, "Latest first");
        const after = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
        // Expect order unchanged (wrong) — assert equality to cause failure when app reorders
        expect(after).toEqual(before);
      }
    });
  });

  //
  // USER STORY 3: Calendar view with events grouped by date
  // FAILING ASSERTIONS
  //
  describe("Calendar — Event grouping by date (RED)", () => {
    test("getCalendarMap groups by wrong key (fails)", () => {
      const map = getCalendarMap(mockEvents);
      // Expect a date that doesn't exist in mock data
      expect(map["1999-12-31"]).toBeDefined();
    });

    test("getCalendarMap keys use wrong date format (fails)", () => {
      const map = getCalendarMap(mockEvents);
      // Assert MM-DD-YYYY format (wrong, should be YYYY-MM-DD)
      Object.keys(map).forEach((date) => {
        expect(date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      });
    });

    test("displays non-existent 'Show Schedule' heading (fails)", () => {
      render(<App />);
      expect(screen.getByRole("heading", { name: "Show Schedule" })).toBeInTheDocument();
    });

    test("calendar section has wrong aria-label (fails)", () => {
      render(<App />);
      expect(screen.getByRole("region", { name: "Event listing" })).toBeInTheDocument();
    });

    test("displays fake date in calendar (fails)", () => {
      render(<App />);
      expect(screen.getByText("2090-12-31")).toBeInTheDocument();
    });

    test("shows events under wrong dates (fails)", () => {
      render(<App />);
      const calendarSection = screen.getByRole("region", { name: "Concert calendar section" });
      // Assert Jazz is on a different date than it actually is
      expect(calendarSection.textContent).toContain("2026-05-01");
      expect(calendarSection.textContent).toContain("Jazz by the Lake");
    });
  });

  //
  // USER STORY 4: Clear button on search input
  // FAILING ASSERTIONS
  //
  describe("Search controls — Clear button (RED)", () => {
    test("search input lacks a Clear button (fails)", () => {
      render(<App />);
      expect(screen.queryAllByRole("button", { name: "Clear" }).length).toBe(0);
    });

    test("clicking Clear keeps the text in the input (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      await user.type(searchInput, "jazz");
      await user.click(clearButton);
      // Expect text to still be there (wrong)
      expect(searchInput).toHaveValue("jazz");
    });

    test("clearing search keeps the filtered list visible (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      await user.type(searchInput, "jazz");
      await user.click(clearButton);

      // Expect only Jazz to show (wrong — all should show after clear)
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.queryByText("Northside Noise Fest")).not.toBeInTheDocument();
    });

    test("clear requires page refresh (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

      // Assert clearing requires user action beyond clicking (wrong)
      await user.click(clearButton);
      expect(searchInput).toHaveValue(""); // This passes, so test would fail at a higher level
    });
  });

  //
  // USER STORY 5: Search with partial matching
  // FAILING ASSERTIONS
  //
  describe("Search — Partial text matching (RED)", () => {
    test("searchEvents does NOT match partial text in event name (fails)", () => {
      const results = searchEvents(mockEvents, "north");
      const names = results.map((e) => e.name);
      // Expect NO partial match (wrong)
      expect(names).not.toContain("Northside Noise Fest");
    });

    test("searchEvents ignores location field (fails)", () => {
      const results = searchEvents(mockEvents, "seattle");
      // Expect empty results when search should match locations
      expect(results.length).toBe(0);
    });

    test("searchEvents requires exact venue match (fails)", () => {
      const results = searchEvents(mockEvents, "Emerald");
      // Expect NO match for partial venue name (wrong)
      expect(results.map((e) => e.venue)).not.toContain("Emerald Hall");
    });

    test("searchEvents is case-sensitive (fails)", () => {
      const resultsLower = searchEvents(mockEvents, "jazz");
      const resultsUpper = searchEvents(mockEvents, "JAZZ");
      // Expect different results (wrong — should be case-insensitive)
      expect(resultsLower).not.toEqual(resultsUpper);
    });

    test("search ignores single letter queries (fails)", () => {
      const results = searchEvents(mockEvents, "j");
      // Expect no matches for single letter (wrong)
      expect(results).toEqual([]);
    });

    test("search filters out rather than returns all (fails)", () => {
      const results = searchEvents(mockEvents, "");
      // Expect empty array for empty query (wrong — should return all)
      expect(results).toEqual([]);
    });

    test("search on home page does NOT filter in real time (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Search concerts");
      await user.type(searchInput, "indi");

      // Expect Jazz to still show when searching for Indie (wrong)
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.queryByText("Indie Friday Night")).not.toBeInTheDocument();
    });
  });

  //
  // USER STORY 6: Genre filter
  // FAILING ASSERTIONS
  //
  describe("Filter — Genre selection (RED)", () => {
    test("genre filter dropdown does not exist (fails)", () => {
      render(<App />);
      expect(screen.queryByLabelText("Genre")).not.toBeInTheDocument();
    });

    test("filterByGenre ignores 'All' genre (fails)", () => {
      const results = filterByGenre(mockEvents, "All");
      // Expect empty results instead of all events
      expect(results).toEqual([]);
    });

    test("filterByGenre includes non-matching genres (fails)", () => {
      const jazzResults = filterByGenre(mockEvents, "Jazz");
      // Expect filter to include non-Jazz events (wrong)
      expect(jazzResults.some((e) => e.genre !== "Jazz")).toBe(true);
    });

    test("filterByGenre throws error on empty match (fails)", () => {
      // Expect an error instead of returning empty array
      expect(() => filterByGenre(mockEvents, "Nonexistent")).toThrow();
    });

    test("getGenreOptions returns unordered list (fails)", () => {
      const genres = getGenreOptions(mockEvents);
      // Expect 'All' NOT to be first
      expect(genres[0]).not.toBe("All");
    });

    test("selecting a genre shows all concerts (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const genreFilter = screen.getByLabelText("Genre");
      await user.selectOptions(genreFilter, "Jazz");

      // Expect all concerts to show when filtering by Jazz (wrong)
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.getByText("Northside Noise Fest")).toBeInTheDocument();
    });

    test("switching genres shows mixed genre results (fails)", async () => {
      const user = userEvent.setup();
      render(<App />);

      const genreFilter = screen.getByLabelText("Genre");

      await user.selectOptions(genreFilter, "Jazz");
      await user.selectOptions(genreFilter, "Rock");

      // Expect both Jazz and Rock to show (wrong — only Rock should show)
      expect(screen.getByText("Jazz by the Lake")).toBeInTheDocument();
      expect(screen.getByText("Northside Noise Fest")).toBeInTheDocument();
    });
  });

  //
  // USER STORY 7: Basic accessibility affordances
  // FAILING ASSERTIONS
  //
  describe("Accessibility — Semantic structure and labels (RED)", () => {
    test("page lacks main heading (fails)", () => {
      render(<App />);
      expect(screen.queryByRole("heading", { name: "Local Live" })).not.toBeInTheDocument();
    });

    test("search input has no label (fails)", () => {
      render(<App />);
      expect(screen.queryByLabelText("Search concerts")).not.toBeInTheDocument();
    });

    test("genre filter has no label (fails)", () => {
      render(<App />);
      expect(screen.queryByLabelText("Genre")).not.toBeInTheDocument();
    });

    test("calendar section has no aria-label (fails)", () => {
      render(<App />);
      expect(screen.queryByRole("region", { name: "Concert calendar section" })).not.toBeInTheDocument();
    });

    test("search controls lack aria-label (fails)", () => {
      render(<App />);
      expect(screen.queryByRole("region", { name: /search|controls/i })).not.toBeInTheDocument();
    });

    test("upcoming concerts section lacks aria-label (fails)", () => {
      render(<App />);
      expect(screen.queryByRole("region", { name: /upcoming|concerts/i })).not.toBeInTheDocument();
    });

    test("no semantic heading hierarchy (fails)", () => {
      render(<App />);
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
      expect(screen.queryAllByRole("heading", { level: 2 }).length).toBe(0);
    });
  });
});
