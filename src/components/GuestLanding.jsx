import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaHome, FaShareAlt, FaCommentDots } from "react-icons/fa";
import "./GuestLanding.css";

const GuestLanding = () => {
    const navigate = useNavigate();
    
    return (
        <div className="guest-landing">
            {/* Top Bar */}
            <div className="top-bar">
                <h1>Let's Match!</h1>
                <div className="top-right">
                    <FaUser className="user-icon" onClick={() => navigate("/login")} />
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <h2>Home</h2>
                <p>Welcome Guest</p>

                {/* Guest Options */}
                <div className="user-options">
                    <button className="option-btn" onClick={() => navigate("/login")}>
                        Login
                    </button>
                    <button className="option-btn" onClick={() => navigate("/register")}>
                        Register
                    </button>
                    <button className="option-btn" onClick={() => navigate("/about")}>
                        About
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button onClick={() => navigate("/")}>
                    <FaHome />
                </button>
                <button onClick={() => navigate("/share")}>
                    <FaShareAlt />
                </button>
                <button onClick={() => navigate("/feedback")}>
                    <FaCommentDots />
                </button>
            </div>
        </div>
    );
};

export default GuestLanding; 