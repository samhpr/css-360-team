import { describe, expect, test, beforeEach } from "vitest";
import {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
} from "../lib/favorites";

describe("favorites helper", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("getFavorites returns empty array when nothing is stored", () => {
    expect(getFavorites()).toEqual([]);
  });

  test("addFavorite stores the id", () => {
    addFavorite(1);
    expect(getFavorites()).toContain(1);
  });

  test("addFavorite does not duplicate existing ids", () => {
    addFavorite(1);
    addFavorite(1);
    expect(getFavorites()).toEqual([1]);
  });

  test("isFavorite returns true when an id is favorited", () => {
    addFavorite(2);
    expect(isFavorite(2)).toBe(true);
  });

  test("isFavorite returns false for non-favorited ids", () => {
    expect(isFavorite(99)).toBe(false);
  });

  test("removeFavorite drops the id", () => {
    addFavorite(3);
    removeFavorite(3);
    expect(getFavorites()).not.toContain(3);
  });

  test("toggleFavorite adds when missing, removes when present", () => {
    toggleFavorite(4);
    expect(isFavorite(4)).toBe(true);
    toggleFavorite(4);
    expect(isFavorite(4)).toBe(false);
  });

  test("getFavorites returns empty array when localStorage has malformed data", () => {
    window.localStorage.setItem("local-live:favorites", "not-json");
    expect(getFavorites()).toEqual([]);
  });

  test("favorites persist via localStorage (read-back)", () => {
    addFavorite(5);
    addFavorite(6);
    // Simulating a fresh page load: just re-read what's stored.
    expect(getFavorites()).toEqual([5, 6]);
  });
});
