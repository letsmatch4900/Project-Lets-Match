import React from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { FaHome, FaShareAlt, FaCommentDots, FaHeart, FaUser, FaQuestion, FaCog } from "react-icons/fa";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import Recovery from "./components/Recovery";
import AddQuestion from "./components/AddQuestion";
import ReviewQuestion from "./components/ReviewQuestion";
import BuildProfile from "./components/BuildProfile";
import Settings from "./components/Settings";
import AdminDashboard from "./components/AdminDashboard";   // ✅ Added import
import UserDashboard from "./components/UserDashboard";     // ✅ Added import
import "./App.css";

// Bottom Navigation Component
const BottomNav = () => {
    const navigate = useNavigate();
    
    return (
        <div className="bottom-nav">
            <button onClick={() => navigate('/')}><FaHome /></button>
            <button onClick={() => navigate('/share')}><FaShareAlt /></button>
            <button onClick={() => navigate('/feedback')}><FaCommentDots /></button>
            <button onClick={() => navigate('/matches')}><FaHeart /></button>
            <button onClick={() => navigate('/build-profile')}><FaUser /></button>
            <button onClick={() => navigate('/add-question')}><FaQuestion /></button>
            <button onClick={() => navigate('/settings')}><FaCog /></button>
        </div>
    );
};

function App() {
    return (
        <Router>
            <div className="app-container">
                <Routes>
                    <Route exact path="/" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/recovery" element={<Recovery />} />
                    <Route path="/add-question" element={<AddQuestion />} />
                    <Route path="/review-question" element={<ReviewQuestion />} />
                    <Route path="/build-profile" element={<BuildProfile />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* ✅ Routes for admin and user dashboards */}
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/user-dashboard" element={<UserDashboard />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    );
}

export default App;
