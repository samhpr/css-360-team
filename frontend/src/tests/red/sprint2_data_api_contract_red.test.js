import { describe, expect, test } from "vitest";
import * as eventsApi from "../../lib/events";

// Sprint 2 RED API/data contract specs (expected to fail until implemented).
// These tests define the backend/live-data contracts the team should satisfy.

describe("Sprint 2 RED — API/data/security contracts", () => {
  describe("User Story 3: Ticketmaster API integration", () => {
    test("module exposes fetchTicketmasterEvents and returns normalized event fields", async () => {
      expect(typeof eventsApi.fetchTicketmasterEvents).toBe("function");

      const events = await eventsApi.fetchTicketmasterEvents({ city: "Seattle" });
      expect(Array.isArray(events)).toBe(true);

      if (events.length > 0) {
        expect(events[0]).toHaveProperty("name");
        expect(events[0]).toHaveProperty("date");
        expect(events[0]).toHaveProperty("location");
        expect(events[0]).toHaveProperty("zipCode");
      }
    });
  });

  describe("User Story 4: calendar updates from API changes", () => {
    test("calendar map recomputes when live events are refreshed", async () => {
      expect(typeof eventsApi.fetchTicketmasterEvents).toBe("function");
      expect(typeof eventsApi.getCalendarMap).toBe("function");

      const firstPull = await eventsApi.fetchTicketmasterEvents({ city: "Seattle" });
      const firstMap = eventsApi.getCalendarMap(firstPull);

      const secondPull = await eventsApi.fetchTicketmasterEvents({ city: "Seattle" });
      const secondMap = eventsApi.getCalendarMap(secondPull);

      expect(firstMap).not.toBeNull();
      expect(secondMap).not.toBeNull();
    });
  });

  describe("User Story 7: live data replaces mock data", () => {
    test("fetchEvents supports live mode and does not require mockEvents", async () => {
      expect(typeof eventsApi.fetchEvents).toBe("function");
      const live = await eventsApi.fetchEvents({ source: "ticketmaster" });
      expect(Array.isArray(live)).toBe(true);
    });

    test("module exposes category + filter helpers for Ticketmaster event objects", () => {
      expect(typeof eventsApi.getCategoryOptions).toBe("function");
      expect(typeof eventsApi.filterByZipCode).toBe("function");
      expect(typeof eventsApi.filterBySelections).toBe("function");
    });
  });

  describe("User Story 10: users cannot add/edit concert data", () => {
    test("public write operations are blocked", async () => {
      expect(typeof eventsApi.insertConcert).toBe("function");
      expect(typeof eventsApi.updateConcert).toBe("function");

      await expect(
        eventsApi.insertConcert({ name: "Unauthorized write" }, { role: "public" })
      ).rejects.toThrow(/unauthorized|forbidden|permission/i);

      await expect(
        eventsApi.updateConcert("demo-id", { name: "Unauthorized update" }, { role: "public" })
      ).rejects.toThrow(/unauthorized|forbidden|permission/i);
    });
  });

  describe("User Story 11: Supabase-backed consistent data", () => {
    test("module exposes Supabase connection and database fetch function", async () => {
      expect(typeof eventsApi.getSupabaseClient).toBe("function");
      expect(typeof eventsApi.fetchConcertsFromDatabase).toBe("function");

      const dbEvents = await eventsApi.fetchConcertsFromDatabase();
      expect(Array.isArray(dbEvents)).toBe(true);
    });
  });

  describe("User Story 12: API red tests should become green", () => {
    test("live search helper works on API-returned event objects", async () => {
      expect(typeof eventsApi.fetchTicketmasterEvents).toBe("function");
      expect(typeof eventsApi.searchEvents).toBe("function");

      const events = await eventsApi.fetchTicketmasterEvents({ city: "Seattle" });
      const searched = eventsApi.searchEvents(events, "jazz");
      expect(Array.isArray(searched)).toBe(true);
    });
  });
});
