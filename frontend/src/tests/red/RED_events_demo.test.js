import { describe, expect, test } from "vitest";
import { mockEvents } from "../data/events";
import {
  filterByGenre,
  getCalendarMap,
  searchEvents,
  sortByDateAscending,
} from "../lib/events";

// These unit tests intentionally assert incorrect behavior to demonstrate
// failing unit tests (the "red" step) for the event utilities.

describe("RED demo — intentionally failing unit tests for event utilities", () => {
  test("sorts by date but asserts wrong first event (fails)", () => {
    const sorted = sortByDateAscending(mockEvents);
    // Intentionally expect a name that is not first
    expect(sorted[0].name).toBe("Northside Noise Fest");
  });

  test("search returns a non-matching term (fails)", () => {
    const results = searchEvents(mockEvents, "qwerty");
    // There are no matches for this term — expecting one will fail.
    expect(results.length).toBeGreaterThan(0);
  });

  test("filterByGenre returns Jazz but asserts empty (fails)", () => {
    const jazz = filterByGenre(mockEvents, "Jazz");
    // Jazz exists — but assert it's empty to force a failure
    expect(jazz).toHaveLength(0);
  });

  test("getCalendarMap contains an impossible date (fails)", () => {
    const map = getCalendarMap(mockEvents);
    expect(Object.keys(map)).toContain("1900-01-01");
  });
});
