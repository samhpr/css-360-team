import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { mockEvents } from "../data/events";
import App from "../App";

// The useEvents hook fetches from the FastAPI backend at runtime.
// In tests we replace it with a synchronous fixture so the existing
// assertions can stay synchronous.
vi.mock("../hooks/useEvents", () => ({
  useEvents: () => ({ events: mockEvents, loading: false, error: null }),
}));

describe("Sprint 1 interface behavior", () => {
  test("front page shows upcoming concerts and required concert details", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Upcoming Concerts" })).toBeInTheDocument();
    expect(screen.getAllByText("Northside Noise Fest").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Seattle, WA/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Ticket Link" }).length).toBeGreaterThan(0);
  });

  test("calendar is visible with concerts pinned by date", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Concert Calendar", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("2026-04-24")).toBeInTheDocument();
    expect(screen.getAllByText("Jazz by the Lake").length).toBeGreaterThan(0);
  });

  test("clear button resets search input without page refresh", async () => {
    const user = userEvent.setup();
    render(<App />);
    const searchInput = screen.getByLabelText("Search concerts");

    await user.type(searchInput, "north");
    expect(searchInput).toHaveValue("north");

    const clearButton = screen.getByRole("button", { name: "Clear" });
    await user.click(clearButton);
    expect(searchInput).toHaveValue("");
  });
  test("clear button is hidden when search input is empty", () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  test("clear button appears when user types in search", async () => {
    const user = userEvent.setup();
    render(<App />);
    const searchInput = screen.getByLabelText("Search concerts");
    await user.type(searchInput, "j");
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  test("clear button hides again after clearing the input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const searchInput = screen.getByLabelText("Search concerts");
    await user.type(searchInput, "j");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  test("sort dropdown defaults to 'Soonest first'", () => {
    render(<App />);
    const sortSelect = screen.getByLabelText("Sort by date");
    expect(sortSelect).toHaveValue("soonest");
  });

  test("changing sort to 'Latest first' re-orders the concert list", async () => {
    const user = userEvent.setup();
    render(<App />);
    const sortSelect = screen.getByLabelText("Sort by date");
    await user.selectOptions(sortSelect, "latest");

    const concertHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(concertHeadings[0]).toHaveTextContent("Sunset Beats");
  });
  test("genre filter limits visible events", async () => {
    const user = userEvent.setup();
    render(<App />);

    const filter = screen.getByLabelText("Genre");
    await user.selectOptions(filter, "Jazz");

    expect(screen.getAllByText("Jazz by the Lake").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Northside Noise Fest").length).toBe(0);
  });

  test("search works with partial matching", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByLabelText("Search concerts");
    await user.type(searchInput, "indi");

    expect(screen.getAllByText("Indie Friday Night").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Jazz by the Lake").length).toBe(0);
  });

  test("base accessibility affordances are present", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Local Live" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search concerts")).toBeInTheDocument();
    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Concert calendar section" })).toBeInTheDocument();
  });

  test("zip code dropdown defaults to 'All zip codes'", () => {
    render(<App />);
    const zipSelect = screen.getByLabelText("Zip code");
    expect(zipSelect).toHaveValue("All");
  });

  test("selecting a zip code filters the concert list", async () => {
    const user = userEvent.setup();
    render(<App />);

    const zipSelect = screen.getByLabelText("Zip code");
    await user.selectOptions(zipSelect, "98103");

    expect(screen.getAllByText("Northside Noise Fest").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Jazz by the Lake").length).toBe(0);
  });

  test("Reset Filters returns zip code dropdown to 'All'", async () => {
    const user = userEvent.setup();
    render(<App />);

    const zipSelect = screen.getByLabelText("Zip code");
    await user.selectOptions(zipSelect, "98103");
    expect(zipSelect).toHaveValue("98103");

    // After filtering to a single event, the "Reset Filters" button in the visible
    // list is the one we want — but there's also one in the no-results message.
    // Use getAllByRole and grab the first matching reset button.
    const resetButtons = screen.getAllByRole("button", { name: /reset filters/i });
    await user.click(resetButtons[0]);

    expect(zipSelect).toHaveValue("All");
  });
});
