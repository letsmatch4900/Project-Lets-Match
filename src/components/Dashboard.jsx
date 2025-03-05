import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase";
import "./Dashboard.css";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [auth]);

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-logo">
                    <h1>Let's Match</h1>
                </div>
                <div className="navbar-auth">
                    {user ? (
                        <div className="user-info">
                            <span>Hello, {user.email}</span>
                            <button onClick={handleSignOut} className="sign-out-btn">
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleNavigateToLogin} className="log-in-btn">
                            Log In
                        </button>
                    )}
                </div>
            </nav>
            <main className="dashboard-content">
                {user ? (
                    <div className="welcome-message">
                        <h2>Dashboard</h2>
                        <p>You are logged in as {user.email}</p>
                    </div>
                ) : (
                    <div className="guest-message">
                        <h2>Welcome Guest Live Release 23</h2>
                        <p>Please Log In</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;