import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onClear }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchInput('');
    onClear();
  };

  return (
    <div className="search-bar-container">
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search concerts, venues, artists..."
          value={searchInput}
          onChange={handleChange}
          className="search-input"
          aria-label="Search concerts"
        />
        {searchInput && (
          <button
            onClick={handleClear}
            className="clear-button"
            aria-label="Clear search"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;