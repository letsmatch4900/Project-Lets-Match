import React from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "./UserDashboard.css";

const UserDashboard = () => {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");  // Redirect to homepage after logout
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="user-dashboard">
            {/* Top Bar */}
            <div className="top-bar">
                <h1>Let's Match!</h1>
                <div className="top-right">
                    <span>Welcome </span> {/* This should be dynamically fetched */}
                    <button onClick={handleSignOut} className="log-out-btn">
                        Log Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <h2>Home</h2>
                <p>Welcome </p>

                {/* User Specific Buttons */}
                <div className="user-options">
                    <button className="option-btn" onClick={() => navigate("/category")}>
                        Category
                    </button>
                    <button className="option-btn" onClick={() => navigate("/build-profile")}>
                        Build my profile
                    </button>
                    <button className="option-btn" onClick={() => navigate("/add-question")}>
                        Add a question
                    </button>
                    <button className="option-btn" onClick={() => navigate("/my-matches")}>
                        My matches
                    </button>
                    <button className="option-btn" onClick={() => navigate("/feedback")}>
                        Feedback
                    </button>
                    <button className="option-btn" onClick={() => navigate("/share")}>
                        Share
                    </button>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="footer-nav">
                <button onClick={() => navigate("/home")}>Home</button>
                <button onClick={() => navigate("/about")}>About</button>
            </div>
        </div>
    );
};

export default UserDashboard;
