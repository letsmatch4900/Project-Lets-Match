import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase";
import "./Dashboard.css";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false); // State to toggle category options
    const navigate = useNavigate();

    // Fetch user on component mount
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleNavigateToLogin = () => {
        navigate('/login');
    };
    // Handle sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Toggle category options
    const toggleCategory = () => {
        setIsCategoryOpen(!isCategoryOpen);
    };

    return (
        <div className="dashboard">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-left">
                    <h1>Let's Match!</h1>
                </div>
                <div className="top-right">
                {user ? (
                        <div className="user-info">
                            <span>Hello, {user.email}</span>
                            <button onClick={handleSignOut} className="log-out-btn">
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleNavigateToLogin} className="log-in-btn">
                            Log In
                        </button>
                    )}
                </div>
            </div>
            {/* Main Content */}
            <div className="main-content">
                <h2>Home</h2>
                <div className="options">
                    <p>Welcome {user ? user.email || "User" : "Guest"}</p>

                    {/* Category Button and Sub-options */}
                    <div className="category-section">
                        <button onClick={toggleCategory} className="option-btn">
                            Category
                        </button>
                        <div className={`sub-options ${isCategoryOpen ? "open" : ""}`}>
                            <button className="sub-option-btn">Dating</button>
                            <button className="sub-option-btn">Jobs</button>
                        </div>
                    </div>

                    {/* Other Buttons */}
                    <button className="option-btn">Build my profile</button>
                    <button onClick={() => navigate("/add-question")} className="option-btn">Add a question</button>
                    <button onClick={() => navigate("/review-question")} className="option-btn">Review questions</button>
                    <button className="option-btn">My matches</button>
                    <button className="option-btn">Feedback</button>
                    <button onClick={() => navigate("/share")} className="option-btn">
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
