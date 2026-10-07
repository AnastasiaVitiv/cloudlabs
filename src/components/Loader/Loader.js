import React from "react";
import "./Loader.css";

function Loader({ text = "Завантаження..." }) {
    return (
        <div className="loader-container">
            <div className="loader"></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
}

export default Loader;