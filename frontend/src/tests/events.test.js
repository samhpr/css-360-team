import { describe, expect, test } from "vitest";
import { mockEvents } from "../data/events";
import {
  filterByGenre,
  getCalendarMap,
  searchEvents,
  sortByDateAscending
} from "../lib/events";

describe("event utilities", () => {
  test("sorts concert results by soonest date first", () => {
    const sorted = sortByDateAscending(mockEvents);

    expect(sorted[0].name).toBe("Jazz by the Lake");
    expect(sorted[1].name).toBe("Northside Noise Fest");
  });

  test("search returns partial and broad matches", () => {
    const byPartial = searchEvents(mockEvents, "north");
    const byLeadingChar = searchEvents(mockEvents, "j");

    expect(byPartial.map((event) => event.name)).toContain("Northside Noise Fest");
    expect(byLeadingChar.map((event) => event.name)).toContain("Jazz by the Lake");
  });

  test("filters events by selected genre", () => {
    const jazzOnly = filterByGenre(mockEvents, "Jazz");

    expect(jazzOnly).toHaveLength(1);
    expect(jazzOnly[0].genre).toBe("Jazz");
  });

  test("builds calendar map keyed by event date", () => {
    const map = getCalendarMap(mockEvents);

    expect(Object.keys(map)).toContain("2026-04-24");
    expect(map["2026-04-24"][0].name).toBe("Jazz by the Lake");
  });
});
