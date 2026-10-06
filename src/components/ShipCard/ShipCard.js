import React from "react";
import { Link } from "react-router-dom";
import PrimaryButton from "../PrimaryButton/PrimaryButton";
import "./ShipCard.css";

function ShipCard({ ship }) {
    const logButtonClick = async (endpoint, params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `http://localhost:3005/api/${endpoint}?${queryString}`;
            await fetch(url);
            console.log(`Button click logged: ${endpoint}`);
        } catch (error) {
            console.error('Error logging button click:', error);
        }
    };

    const handleDetailsClick = () => {
        logButtonClick('log/ship-details', {
            shipId: ship.id,
            shipName: ship.name
        });
    };

    return (
        <div className="ship-card">
            <img src={ship.image} alt={ship.name} />
            <h3>{ship.name}</h3>
            <p><strong>Тонаж:</strong> {ship.tonnage} т</p>
            <p><strong>Пасажирів:</strong> {ship.passengers}</p>
            <p><strong>Капітан:</strong> {ship.captain}</p>
            <p><strong>Швидкість:</strong> {ship.speed} вузлів</p>
            <p><strong>Пробіг:</strong> {ship.mileage} км</p>
            <div className="card-buttons">
                <Link to={`/ship/${ship.id}`}>
                    <PrimaryButton onClick={handleDetailsClick}>Детальніше</PrimaryButton>
                </Link>
            </div>
        </div>
    );
}

export default ShipCard;