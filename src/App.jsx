import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import ConcertResults from './components/ConcertResults';
import './App.css';

const App = () => {
  const [concerts, setConcerts] = useState([]);
  const [filteredConcerts, setFilteredConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Ticketmaster API Configuration
  const TICKETMASTER_API_KEY = process.env.REACT_APP_TICKETMASTER_KEY;
  const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

  // Fetch concerts from Ticketmaster API
  const fetchConcerts = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        keyword: query || 'concert',
        size: 50,
        sort: 'date,asc', // API returns sorted by date ascending
      });

      const response = await fetch(`${TICKETMASTER_BASE_URL}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch concerts');

      const data = await response.json();
      const events = data._embedded?.events || [];
      setConcerts(events);
      setFilteredConcerts(events);
    } catch (err) {
      setError(err.message);
      setConcerts([]);
      setFilteredConcerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConcerts();
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchTerm(query);
    if (query.trim()) {
      fetchConcerts(query);
    }
  };

  // Handle clear
  const handleClear = () => {
    setSearchTerm('');
    fetchConcerts(); // Reset to default concerts
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Live Concert Tracker</h1>
        <p>Find concerts near you</p>
      </header>

      <SearchBar onSearch={handleSearch} onClear={handleClear} />
      <ConcertResults concerts={filteredConcerts} loading={loading} error={error} />
    </div>
  );
};

export default App;