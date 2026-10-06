import React from "react";
import "./SearchBar.css";

function SearchBar({ searchTerm, onSearchChange }) {
    return (
        <div className="search-bar">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Пошук кораблів..."
                className="search-input"
            />
            <button className="search-button">Пошук</button>
        </div>
    );
}

export default SearchBar;
