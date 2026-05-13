const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchEvents() {
  const res = await fetch(`${API_BASE_URL}/api/events`);
  if (!res.ok) {
    throw new Error(`GET /api/events failed: ${res.status}`);
  }
  return res.json();
}
