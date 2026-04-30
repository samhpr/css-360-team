import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../App";

// This file intentionally contains failing assertions to demonstrate the
// "red" step in TDD. Each test mirrors a real test but asserts an
// expectation that the current app does not satisfy.

describe("RED demo — intentionally failing UI tests", () => {
  test("front page shows a non-existent heading (fails)", () => {
    render(<App />);

    // There is no heading with this exact text — this should fail.
    expect(screen.getByRole("heading", { name: "No Such Heading" })).toBeInTheDocument();
  });

  test("calendar shows a bogus date (fails)", () => {
    render(<App />);

    // This date is not in the mock data — should fail.
    expect(screen.getByText("1999-12-31")).toBeInTheDocument();
  });

  test("clear button does not clear (fails)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByLabelText("Search concerts");
    const clearButton = screen.getAllByRole("button", { name: "Clear" })[0];

    await user.type(searchInput, "north");
    expect(searchInput).toHaveValue("north");

    // Intentionally assert the wrong behavior: expect it to STILL have value
    // which is false for the current app and will cause the test to fail.
    await user.click(clearButton);
    expect(searchInput).toHaveValue("north");
  });

  test("genre filter shows a genre that doesn't exist (fails)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const filter = screen.getByLabelText("Genre");
    await user.selectOptions(filter, "Alien Jazz");

    // No event will match this genre — expecting to find one will fail.
    expect(screen.getAllByText("Alien Jazz Extravaganza").length).toBeGreaterThan(0);
  });

  test("search partial match returns impossible event (fails)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByLabelText("Search concerts");
    await user.type(searchInput, "zzzz");

    expect(screen.getAllByText("Nonexistent Event").length).toBeGreaterThan(0);
  });

  test("accessibility check for a missing region (fails)", () => {
    render(<App />);

    // The app defines a region called "Concert calendar section" — this
    // asserts a different region name so it should fail.
    expect(screen.getByRole("region", { name: "Missing region" })).toBeInTheDocument();
  });
});
