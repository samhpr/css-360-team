import { describe, expect, test } from "vitest";

// Official 'red' tests describing the intended events service API.
// These tests are written as the acceptance criteria a TDD specialist
// would add before implementation. They will fail until the API is
// implemented in `src/lib/events` or a new service module.

// Focus: API contract tests — these are backend/API-focused (not UI).
// They exercise `fetchEvents()` and CRUD helpers and define the
// expected server behavior and response shapes for implementers.

import {
  fetchEvents,
  getEventById,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../lib/events";

describe("Official RED — Events service API contract", () => {
  test("fetchEvents returns an array of events (async)", async () => {
    const events = await fetchEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("id");
    expect(events[0]).toHaveProperty("name");
  });

  test("getEventById returns the correct event or null", async () => {
    const events = await fetchEvents();
    const first = events[0];
    const found = await getEventById(first.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(first.id);

    const missing = await getEventById("__not_an_id__");
    expect(missing).toBeNull();
  });

  test("addEvent persists a new event and returns it with an id", async () => {
    const newEvent = {
      name: "Test Event (RED)",
      date: "2030-01-01",
      genre: "Test",
      location: "Nowhere",
      venue: "Test Hall",
      ticketUrl: "https://example.com/tickets",
    };

    const created = await addEvent(newEvent);
    expect(created).toHaveProperty("id");
    expect(created.name).toBe(newEvent.name);

    // cleanup: remove the created item if deleteEvent exists
    if (typeof deleteEvent === "function") {
      await deleteEvent(created.id);
    }
  });

  test("updateEvent modifies an existing event and returns updated object", async () => {
    const events = await fetchEvents();
    const sample = events[0];
    const updates = { name: sample.name + " (edited)" };
    const updated = await updateEvent(sample.id, updates);
    expect(updated).toHaveProperty("id", sample.id);
    expect(updated.name).toBe(updates.name);
  });

  test("deleteEvent removes an event and subsequent getEventById returns null", async () => {
    // create a temporary event then delete it
    const temp = await addEvent({
      name: "Temp for delete",
      date: "2030-02-02",
      genre: "Test",
      location: "Nowhere",
      venue: "Temp Hall",
      ticketUrl: "https://example.com/tickets",
    });

    const deleted = await deleteEvent(temp.id);
    expect(deleted).toBe(true);
    const found = await getEventById(temp.id);
    expect(found).toBeNull();
  });
});
