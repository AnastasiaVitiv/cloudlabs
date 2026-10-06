import React, { useState, useEffect } from "react";
import axios from "axios";
import { shipsApi } from "../../api/shipsApi";
import ShipList from "../../components/ShipList/ShipList";
import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import Loader from "../../components/Loader/Loader";
import "./HomePage.css";

function HomePage() {
    const [ships, setShips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleShipsCount, setVisibleShipsCount] = useState(3);

    useEffect(() => {
        const fetchShips = async () => {
            try {
                setLoading(true);
                const response = await shipsApi.getShips();
                setShips(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchShips();
    }, []);
    
    const logButtonClick = async (endpoint, params = {}) => {
        try {
            const url = `http://localhost:3005/api/${endpoint}`;
            const response = await axios.get(url, { params });
            console.log(`Button click logged: ${endpoint}`, response.status);
        } catch (error) {
            console.error('Error logging button click:', error);
        }
    };

    const visibleShips = ships.slice(0, visibleShipsCount);
    const hasMoreShips = visibleShipsCount < ships.length;

    const loadMoreShips = () => {
        logButtonClick('log/home-view-more', {
            currentCount: visibleShipsCount,
            totalCount: ships.length
        });
        setVisibleShipsCount(prev => prev + 3);
    };

    if (loading) {
        return (
            <div className="home-page">
                <Loader text="Завантаження кораблів..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-page">
                <div className="error-message">
                    <h2>Помилка завантаження</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="home-page">
            <section className="hero">
                <img src="/images/160208.jpg" alt="Main visual" />
                <div className="hero-text">
                    <h1>Список кораблів</h1>
                    <p>
                        Ласкаво просимо до нашої колекції кораблів! Тут ви знайдете
                        різноманітні судна — від величних круїзних лайнерів до швидких
                        військових кораблів. Досліджуйте характеристики кожного корабля,
                        включаючи тоннаж, кількість пасажирів, капітана, швидкість і пробіг.
                    </p>
                </div>
            </section>
            <section className="featured-ships">
                <ShipList ships={visibleShips} />
                <div className="home-page-buttons">
                    {hasMoreShips && (
                        <PrimaryButton onClick={loadMoreShips}>
                            View more 
                        </PrimaryButton>
                    )}
                </div>
            </section>
        </div>
    );
}

export default HomePage;