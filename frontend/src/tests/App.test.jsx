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

  test("zip code dropdown shows placeholder when nothing is selected", () => {
    render(<App />);
    // react-select renders the placeholder as visible text when no value is set
    expect(screen.getByText("All zip codes")).toBeInTheDocument();
  });

  test("selecting a zip code filters the concert list", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Open the dropdown by clicking the combobox
    const zipInput = screen.getByLabelText("Zip code");
    await user.click(zipInput);

    // Click the option (react-select renders options as divs after opening)
    const option = await screen.findByText("98103");
    await user.click(option);

    expect(screen.getAllByText("Northside Noise Fest").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Jazz by the Lake").length).toBe(0);
  });

  test("Reset Filters clears the zip code dropdown", async () => {
    const user = userEvent.setup();
    render(<App />);

    const zipInput = screen.getByLabelText("Zip code");
    await user.click(zipInput);
    const option = await screen.findByText("98103");
    await user.click(option);

    const resetButtons = screen.getAllByRole("button", { name: /reset filters/i });
    await user.click(resetButtons[0]);

    // After reset, the placeholder is visible again
    expect(screen.getByText("All zip codes")).toBeInTheDocument();
  });

  test("typing in the zip dropdown narrows visible options", async () => {
    const user = userEvent.setup();
    render(<App />);

    const zipInput = screen.getByLabelText("Zip code");
    await user.click(zipInput);
    await user.type(zipInput, "981");

    // 98103 and 98101 start with 981 — both should be visible
    expect(await screen.findByText("98103")).toBeInTheDocument();
    expect(await screen.findByText("98101")).toBeInTheDocument();
    // 98004 does NOT start with 981, should not appear
    expect(screen.queryByText("98004")).not.toBeInTheDocument();
  });

  test("favorite button is initially unfilled (☆) for all concerts", () => {
    render(<App />);
    const favoriteButtons = screen.getAllByRole("button", { name: /^Favorite / });
    expect(favoriteButtons.length).toBeGreaterThan(0);
    favoriteButtons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-pressed", "false");
    });
  });

  test("clicking a favorite button toggles its state", async () => {
    const user = userEvent.setup();
    render(<App />);

    const favoriteBtn = screen.getAllByRole("button", { name: /^Favorite / })[0];
    expect(favoriteBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(favoriteBtn);

    const unfavoriteBtn = screen.getAllByRole("button", { name: /^Unfavorite / })[0];
    expect(unfavoriteBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("'Favorites' view shows only favorited concerts", async () => {
    const user = userEvent.setup();
    render(<App />);

    const firstFavBtn = screen.getAllByRole("button", { name: /^Favorite / })[0];
    await user.click(firstFavBtn);

    const favoritesTab = screen.getByRole("button", { name: /^★ Favorites/ });
    await user.click(favoritesTab);

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards).toHaveLength(1);
  });

  test("'Favorites' view shows empty-state message when nothing is favorited", async () => {
    const user = userEvent.setup();
    render(<App />);

    const favoritesTab = screen.getByRole("button", { name: /^★ Favorites/ });
    await user.click(favoritesTab);

    expect(screen.getByText(/No favorites yet/)).toBeInTheDocument();
  });

  test("favorites count in tab updates when favoriting", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /Favorites \(0\)/ })).toBeInTheDocument();

    const firstFavBtn = screen.getAllByRole("button", { name: /^Favorite / })[0];
    await user.click(firstFavBtn);

    expect(screen.getByRole("button", { name: /Favorites \(1\)/ })).toBeInTheDocument();
  });
});