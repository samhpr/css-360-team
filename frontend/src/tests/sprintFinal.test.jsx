import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { mockEvents } from "../data/events";
import App from "../App";

vi.mock("../hooks/useEvents", () => ({
  useEvents: () => ({ events: mockEvents, loading: false, error: null }),
}));

describe("Sprint Final: New user stories (red tests)", () => {
  test("Story 1 — fuzzy search: misspellings return relevant results (e.g. 'jasz' -> Jazz)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByLabelText("Search concerts");
    await user.type(search, "jasz");

    // Expect jazz events to appear despite the typo — current app does not do fuzzy matching.
    expect(screen.getAllByText("Jazz by the Lake").length).toBeGreaterThan(0);
  });

  test("Story 1 — fuzzy search: omitted characters still return relevant results", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByLabelText("Search concerts");
    await user.type(search, "indie friday nigh");

    expect(screen.getAllByText("Indie Friday Night").length).toBeGreaterThan(0);
  });

  test("Story 2 — pagination: user can pick 10/25/50 results and 'show more' appears when overflow exists", async () => {
    render(<App />);

    const paginationSelect = screen.getByLabelText(/results per page/i);
    expect(paginationSelect).toBeInTheDocument();

    // Expect options to include 10,25,50
    expect(screen.getByRole("option", { name: "10" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "25" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50" })).toBeInTheDocument();

    // With more results than the page size, a "Show 10 more results" button should appear
    expect(screen.getByRole("button", { name: /show 10 more results/i })).toBeInTheDocument();
  });

  test("Story 3 — deployment: repo is connected to Vercel and env vars configured (integration smoke)", () => {
    // This integration depends on external deployment; assert environment variables exist in CI
    expect(process.env.VERCEL).toBeDefined();
    expect(process.env.VITE_SUPABASE_URL).toBeDefined();
    expect(process.env.VITE_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
  });

  test("Story 4 — data completeness: API mapping includes new columns like zipCode", async () => {
    // The app should expose zipCode on each rendered event; check mock data mapping
    render(<App />);
    // At least one event should have a zip code displayed via the filters/data model
    const zipSelect = screen.getByLabelText("Zip code");
    expect(zipSelect).toBeInTheDocument();
    // The options should include actual zip codes (not just 'All')
    const hasRealZip = Array.from(zipSelect.options).some((o) => o.value !== "All");
    expect(hasRealZip).toBe(true);
  });

  test("Story 5 — zip code filter: searchable dropdown (combobox) accepts typing to narrow options", async () => {
    const user = userEvent.setup();
    render(<App />);

    // The zip control should be a searchable combobox (not a plain select)
    const zipControl = screen.getByRole("combobox", { name: "Zip code" });
    await user.type(zipControl, "981");

    // After typing, the options should be filtered to matching zip prefixes
    expect(screen.getByText("98109")).toBeInTheDocument();
  });
});
