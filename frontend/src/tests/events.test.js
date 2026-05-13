import { describe, expect, test } from "vitest";
import { mockEvents } from "../data/events";
import {
  filterByGenre,
  filterByZipCode,
  getCalendarMap,
  getZipCodeOptions,
  searchEvents,
  sortByDate,
  sortByDateAscending
} from "../lib/events";

describe("event utilities", () => {
  test("sorts concert results by soonest date first", () => {
    const sorted = sortByDateAscending(mockEvents);

    expect(sorted[0].name).toBe("Jazz by the Lake");
    expect(sorted[1].name).toBe("Northside Noise Fest");
  });
  
  test("sortByDate with 'soonest' returns ascending order", () => {
  const sorted = sortByDate(mockEvents, "soonest");
  expect(sorted[0].name).toBe("Jazz by the Lake");
});

test("sortByDate with 'latest' returns descending order", () => {
  const sorted = sortByDate(mockEvents, "latest");
  expect(sorted[0].name).toBe("Sunset Beats");
});

test("sortByDate defaults to 'soonest' when no order is given", () => {
  const sorted = sortByDate(mockEvents);
  expect(sorted[0].name).toBe("Jazz by the Lake");
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

  test("filterByZipCode returns all events when zip is 'All'", () => {
  const result = filterByZipCode(mockEvents, "All");
  expect(result).toHaveLength(mockEvents.length);
});

test("filterByZipCode returns only events matching the given zip", () => {
  const result = filterByZipCode(mockEvents, "98103");
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe("Northside Noise Fest");
});

test("filterByZipCode returns empty array when no events match", () => {
  const result = filterByZipCode(mockEvents, "00000");
  expect(result).toHaveLength(0);
});

test("getZipCodeOptions returns 'All' plus sorted unique zip codes", () => {
  const options = getZipCodeOptions(mockEvents);
  expect(options[0]).toBe("All");
  expect(options).toContain("98004");
  expect(options).toContain("98103");
  // verify sort order (numeric strings sort lexically — 98004 < 98052 < 98101 < 98103 < 98402)
  const withoutAll = options.slice(1);
  const sortedCopy = [...withoutAll].sort();
  expect(withoutAll).toEqual(sortedCopy);
});
});
