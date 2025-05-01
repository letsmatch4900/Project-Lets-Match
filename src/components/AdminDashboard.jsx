import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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
            <div className="top-bar">
                <h1>Let's Match!</h1>
                <div className="top-right">
                    <span>Welcome, {user ? user.email : "Admin"}</span>
                    <button onClick={handleSignOut} className="log-out-btn">Log Out</button>
                </div>
            </div>
            <div className="main-content">
                <h2>Home</h2>
                <p>Welcome, {user ? user.email : "Admin"}</p>
                <button className="option-btn" onClick={() => navigate("/review-question")}>Review questions</button>
                <button className="option-btn" onClick={() => navigate("/admin-view-matches")}>User Profiles</button>
                <button className="option-btn" onClick={() => navigate("/admin-feedback")}>See feedback</button>
            </div>
        </div>
    );
};

export default AdminDashboard;
