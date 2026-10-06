import React from "react";
import "./Footer.css";

function Footer() {
    return (
        <footer>
            <div className="footer-content">
                <div className="footer-logo">LOGO</div>
                <div className="socials">
                    <i className="fab fa-facebook"></i>
                    <i className="fab fa-twitter"></i>
                    <i className="fab fa-linkedin"></i>
                    <i className="fab fa-google-plus"></i>
                </div>
            </div>
            <p className="copyright">
                2025 IoT © Copyright all rights reserved
            </p>
        </footer>
    );
}

export default Footer;
