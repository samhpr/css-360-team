import React, { useState, useEffect } from 'react';
import './ConcertResults.css';

const ConcertResults = ({ concerts, loading, error }) => {
  const [sortOrder, setSortOrder] = useState('soonest');
  const [sortedConcerts, setSortedConcerts] = useState(concerts);

  // Sort concerts whenever concerts or sortOrder changes
  useEffect(() => {
    const sorted = [...concerts].sort((a, b) => {
      const dateA = new Date(a.dates.start.dateTime || a.dates.start.localDate);
      const dateB = new Date(b.dates.start.dateTime || b.dates.start.localDate);

      if (sortOrder === 'soonest') {
        return dateA - dateB; // Ascending: soonest first
      } else {
        return dateB - dateA; // Descending: latest first
      }
    });

    setSortedConcerts(sorted);
  }, [concerts, sortOrder]);

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  if (loading) return <div className="loading">Loading concerts...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (concerts.length === 0) return <div className="no-results">No concerts found. Try a different search.</div>;

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Concert Results</h2>
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={handleSortChange}
            className="sort-button"
            aria-label="Sort concerts by date"
          >
            <option value="soonest">Soonest first</option>
            <option value="latest">Latest first</option>
          </select>
        </div>
      </div>

      <div className="concerts-list">
        {sortedConcerts.map((concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>
    </div>
  );
};

// Individual Concert Card Component
const ConcertCard = ({ concert }) => {
  const eventDate = new Date(concert.dates.start.dateTime || concert.dates.start.localDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = concert.dates.start.dateTime 
    ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Time TBA';

  return (
    <div className="concert-card">
      {concert.images && concert.images[0] && (
        <img src={concert.images[0].url} alt={concert.name} className="concert-image" />
      )}
      <div className="concert-info">
        <h3 className="concert-name">{concert.name}</h3>
        <p className="concert-date">📅 {formattedDate} at {formattedTime}</p>
        <p className="concert-venue">📍 {concert._embedded?.venues[0]?.name || 'Venue TBA'}</p>
        {concert.priceRanges && (
          <p className="concert-price">
            💰 ${concert.priceRanges[0].min} - ${concert.priceRanges[0].max}
          </p>
        )}
        <a href={concert.url} target="_blank" rel="noopener noreferrer" className="ticket-button">
          Get Tickets
        </a>
      </div>
    </div>
  );
};

export default ConcertResults;