import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../../App";

// Sprint 2 RED acceptance specs (expected to fail until implemented).
// These tests encode the user stories and definitions of done.

describe("Sprint 2 RED — UI acceptance criteria", () => {
  describe("User Story 1: calendar with concerts on correct dates", () => {
    test("calendar entries include basic info: name, date, and location", () => {
      render(<App />);

      const calendar = screen.getByRole("region", { name: "Concert calendar section" });
      expect(within(calendar).getByText(/Jazz by the Lake/i)).toBeInTheDocument();
      expect(within(calendar).getByText(/2026-04-24/i)).toBeInTheDocument();
      expect(within(calendar).getByText(/Bellevue, WA/i)).toBeInTheDocument();
    });
  });

  describe("User Story 2: stable and accessible interface", () => {
    test("main controls can be tabbed through without crashing", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      expect(screen.getByRole("heading", { name: /local live/i })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: /search and filter controls/i })).toBeInTheDocument();
    });
  });

  describe("User Story 5: filter by city/zip code", () => {
    test("zip code filter exists and defaults to 'All zip codes'", () => {
      render(<App />);
      const zip = screen.getByLabelText(/zip code/i);
      expect(zip).toBeInTheDocument();
      expect(zip.value).toBe("All zip codes");
    });

    test("selecting a zip code immediately narrows results", async () => {
      const user = userEvent.setup();
      render(<App />);

      const zip = screen.getByLabelText(/zip code/i);
      await user.selectOptions(zip, "98101");

      const upcoming = screen.getByRole("region", { name: /upcoming concerts section/i });
      expect(within(upcoming).queryByText(/Redmond, WA/i)).not.toBeInTheDocument();
    });

    test("reset filters returns zip to 'All zip codes'", async () => {
      const user = userEvent.setup();
      render(<App />);

      const zip = screen.getByLabelText(/zip code/i);
      await user.selectOptions(zip, "98101");
      await user.click(screen.getByRole("button", { name: /reset filters/i }));

      expect(zip.value).toBe("All zip codes");
    });
  });

  describe("User Story 6: multi-select checkbox filters", () => {
    test("genre filter presents checkbox options", () => {
      render(<App />);
      const genreGroup = screen.getByRole("group", { name: /genre/i });
      const checkboxes = within(genreGroup).getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(1);
    });

    test("selecting multiple genres returns logical-OR matches", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("checkbox", { name: /jazz/i }));
      await user.click(screen.getByRole("checkbox", { name: /rock/i }));

      expect(screen.getByText(/Jazz by the Lake/i)).toBeInTheDocument();
      expect(screen.getByText(/Northside Noise Fest/i)).toBeInTheDocument();
    });
  });

  describe("User Story 8: favorites list", () => {
    test("concert cards have a favorite toggle", () => {
      render(<App />);
      const favoriteButtons = screen.getAllByRole("button", { name: /favorite/i });
      expect(favoriteButtons.length).toBeGreaterThan(0);
    });

    test("favorites view shows empty-state message when none are saved", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: /favorites/i }));
      expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
    });
  });

  describe("User Story 9 and 12: complete UI actions are functional", () => {
    test("search, calendar, and favorites actions are available in the same session", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText(/search concerts/i), "jazz");
      expect(screen.getByRole("region", { name: /concert calendar section/i })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /favorites/i }));
      expect(screen.getByRole("heading", { name: /favorites/i })).toBeInTheDocument();
    });
  });
});
