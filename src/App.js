import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage/HomePage";
import CatalogPage from "./pages/CatalogPage/CatalogPage";
import CartPage from "./pages/CartPage/CartPage";
import ShipDetailPage from "./pages/ShipDetailPage/ShipDetailPage";
import "./App.css";

function App() {
    const [searchTerm, setSearchTerm] = useState("");
    return (
        <Router>
            <div className="App">
                <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/catalog" element={<CatalogPage searchTerm={searchTerm} />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/ship/:id" element={<ShipDetailPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
