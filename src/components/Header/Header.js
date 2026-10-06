import React from "react";
import Navigation from "../Navigation/Navigation";
import SearchBar from "../SearchBar/SearchBar";
import "./Header.css";

function Header({ searchTerm, onSearchChange }) {
    return (
        <header className="header">
            <div className="logo">LOGO</div>
            <Navigation />
            <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        </header>
    );
}

export default Header;
