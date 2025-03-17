import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const navigate = useNavigate();
   

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Top Bar */}
            <div className="top-bar">
                <h1>Let's Match!</h1>
                <div className="top-right">
                    <span>Admin</span>
                    <button onClick={handleSignOut} className="log-out-btn">
                        Log Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <h2>Home</h2>
                <p>Welcome Adminstrator</p>

                {/* Admin-Specific Buttons */}
                <div className="admin-options">
                    <button className="option-btn">Category</button>
                    <button className="option-btn" onClick={() => navigate("/review-questions")}>
                        Review questions
                    </button>
                    <button className="option-btn" onClick={() => navigate("/view-matches")}>
                        View matches
                    </button>
                    <button className="option-btn" onClick={() => navigate("/see-feedback")}>
                        See feedback
                    </button>
                </div>
            </div>

            {/* Bottom Navigation (Optional) */}
            <div className="footer-nav">
                <button onClick={() => navigate("/home")}>🏠</button>
                <button onClick={() => navigate("/share")}>🔗</button>
                <button onClick={() => navigate("/settings")}>⚙️</button>
            </div>
        </div>
    );
};

export default AdminDashboard;
