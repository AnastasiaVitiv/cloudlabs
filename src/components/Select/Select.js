import React from "react";
import "./Select.css";

function Select({ options, value, onChange, label }) {
    return (
        <div className="select-container">
            <select className="custom-select" value={value} onChange={onChange}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Select;