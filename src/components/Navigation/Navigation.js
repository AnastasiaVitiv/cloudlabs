import React from "react";
import { Link } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
    const logNavigation = async (pageName) => {
        try {
            await fetch(`http://localhost:3005/api/log/navigation?page=${pageName}`);
            console.log(`Navigation to ${pageName} logged`);
        } catch (error) {
            console.error('Error logging navigation:', error);
        }
    };

    const handleNavigationClick = (pageName) => {
        logNavigation(pageName);
    };

    return (
        <nav className="nav">
            <Link to="/" onClick={() => handleNavigationClick('home')}>Home</Link>
            <Link to="/catalog" onClick={() => handleNavigationClick('catalog')}>Catalog</Link>
            <Link to="/cart" onClick={() => handleNavigationClick('cart')}>Cart</Link>
        </nav>
    );
}

export default Navigation;