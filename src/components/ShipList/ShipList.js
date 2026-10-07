import React from "react";
import ShipCard from "../ShipCard/ShipCard";
import "./ShipList.css";

function ShipList({ ships = [] }) {
    if (!ships || ships.length === 0) {
        return <p className="no-ships">Кораблі не знайдено</p>;
    }
    return (
        <div className="ship-list">
            {ships.map((ship) => (
                <ShipCard key={ship.id} ship={ship} />
            ))}
        </div>
    );
}

export default ShipList;

