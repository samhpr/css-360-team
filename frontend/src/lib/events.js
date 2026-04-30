import { mockEvents } from "../data/events";

export function sortByDateAscending(events) {
  return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function sortByDateDescending(events) {
  return [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function filterByGenre(events, genre) {
  if (!genre || genre === "All") {
    return events;
  }

  return events.filter((event) => event.genre === genre);
}

export function searchEvents(events, query) {
  if (!query.trim()) {
    return events;
  }

  const lowered = query.trim().toLowerCase();
  return events.filter((event) => {
    const fields = [event.name, event.location, event.venue, event.genre];
    return fields.some((field) => field.toLowerCase().includes(lowered));
  });
}

export function getCalendarMap(events) {
  return events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});
}

export function getGenreOptions(events) {
  const genres = Array.from(new Set(events.map((event) => event.genre)));
  return ["All", ...genres.sort((a, b) => a.localeCompare(b))];
}

// Async fetch stub — in future point this to a real API endpoint.
export async function fetchEvents() {
  // simulate fetch latency (no await needed) and return mock data
  return Promise.resolve(mockEvents);
}
