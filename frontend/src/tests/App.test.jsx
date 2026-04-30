import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../App";

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
    const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

    await user.type(searchInput, "north");
    expect(searchInput).toHaveValue("north");

    await user.click(clearButton);
    expect(searchInput).toHaveValue("");
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
});
