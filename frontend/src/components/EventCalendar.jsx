import React from "react";

function EventCalendar({ eventsByDate }) {
  const dates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <section className="calendar" aria-label="Concert calendar section">
      <h2>Concert Calendar</h2>
      <ul aria-label="Concert calendar">
        {dates.map((date) => (
          <li key={date}>
            <strong>{date}</strong>
            <ul>
              {eventsByDate[date].map((event) => (
                <li key={event.id}>{event.name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default EventCalendar;
