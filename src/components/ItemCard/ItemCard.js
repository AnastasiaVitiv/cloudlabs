import React from "react";
// import "./ItemCard.css";

function ItemCard({ item }) {
    return (
        <div className="item-card">
            <div className="item-image"></div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p><strong>Price:</strong> ${item.price}</p>
            <button className="view-more">View more</button>
        </div>
    );
}

export default ItemCard;
