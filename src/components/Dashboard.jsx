import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import "./Dashboard.css"; // Ensure this CSS file exists

const auth = getAuth();
const db = getFirestore();

const Dashboard = () => {
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const docRef = doc(db, "roles", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRole(docSnap.data().role);
                } else {
                    setRole("user");
                }
            } else {
                setRole(null);
            }
        });
    }, []);

    if (role === "admin") {
        return <AdminDashboard />;
    } else if (role === "user") {
        return <UserDashboard />;
    }

    return (
        <div className="welcome-page">
            <div className="welcome-container">
                <h1>Let's Match!</h1>
                <button onClick={() => navigate("/login")} className="log-in-btn">
                    Log In
                </button>
            </div>
            <p className="login-message">Welcome! Please log in to continue.</p>
        </div>
    );
};

export default Dashboard;
