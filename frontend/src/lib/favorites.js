// localStorage-backed favorites. Stores an array of event IDs.
// Functions are defensive — if localStorage is missing, empty, or contains
// malformed data, they return safe defaults instead of throwing.

const STORAGE_KEY = "local-live:favorites";

export function getFavorites() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavorite(eventId) {
  return getFavorites().includes(eventId);
}

export function addFavorite(eventId) {
  const current = getFavorites();
  if (current.includes(eventId)) return current; // no duplicates
  const updated = [...current, eventId];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore — quota errors etc.
  }
  return updated;
}

export function removeFavorite(eventId) {
  const current = getFavorites();
  const updated = current.filter((id) => id !== eventId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function toggleFavorite(eventId) {
  return isFavorite(eventId) ? removeFavorite(eventId) : addFavorite(eventId);
}
