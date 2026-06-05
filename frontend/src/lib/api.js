import { supabase } from "./supabase";
import { mockEvents } from "../data/events";

export async function fetchEvents() {
  if (!supabase) {
    return mockEvents;
  }

  const selectColumns =
    "id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant, zip_code";

  let response = await supabase.from("events").select(selectColumns);

  if (response.error && /zip_code/i.test(String(response.error.message))) {
    response = await supabase
      .from("events")
      .select(
        "id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant",
      );
  }

  const { data, error } = response;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    genre: row.genre,
    date: row.date,
    location: row.location,
    venue: row.venue,
    ticketLink: row.ticket_link,
    ticketPrice: row.ticket_price,
    isADAComp: row.is_ada_compliant,
    zipCode: row.zip_code || null,
  }));
}
