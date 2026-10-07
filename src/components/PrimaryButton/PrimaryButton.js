import React from "react";
import "./PrimaryButton.css";

function PrimaryButton({ children, onClick, type = "button" }) {
    return (
        <button className="primary-button" type={type} onClick={onClick}>
            {children}
        </button>
    );
}

export default PrimaryButton;
