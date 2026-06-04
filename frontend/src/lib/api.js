import { supabase } from "./supabase";

export async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, genre, date, location, venue, ticket_link, ticket_price, is_ada_compliant, zip_code");
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
    zipCode: row.zip_code,
  }));
}
