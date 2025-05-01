import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
//import { FaUser } from "react-icons/fa";
import { FaHome, FaShareAlt, FaCommentDots, FaHeart, FaUser, FaQuestion, FaCog } from "react-icons/fa";
import { auth } from "./firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import Recovery from "./components/Recovery";
import AddQuestion from "./components/AddQuestion";
import ReviewQuestion from "./components/ReviewQuestion";
import BuildProfile from "./components/BuildProfile";
import Settings from "./components/Settings";
import UserFeedback from "./components/UserFeedback"
import AdminFeedback from "./components/AdminFeedback";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import UserList from "./components/UserList";
import UserProfile from "./components/UserProfile";
import GuestLanding from "./components/GuestLanding";
import AnswerQuestion from "./components/AnswerQuestion";
import MatchesPage from "./components/MatchesPage";
import About from "./components/About";
import AdminViewMatches from "./components/AdminViewMatches";
import "./App.css";

// Bottom Navigation Component
const BottomNav = () => {
    const navigate = useNavigate();
    
    return (
/*
        <div className="bottom-nav">
            <button onClick={() => navigate('/build-profile')}><FaUser /></button>
        </div>
*/
        
        <div className="bottom-nav">
            <button onClick={() => navigate('/')}><FaHome /></button>
            <button onClick={() => navigate('/share')}><FaShareAlt /></button>
            <button onClick={() => navigate('/user-feedback')}><FaCommentDots /></button>
            <button onClick={() => navigate('/matches')}><FaHeart /></button>
            <button onClick={() => navigate('/build-profile')}><FaUser /></button>
            <button onClick={() => navigate('/add-question')}><FaQuestion /></button>
            <button onClick={() => navigate('/settings')}><FaCog /></button>
        </div>
        
    );
};

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

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
                    <Route path="/user-feedback" element={<UserFeedback/>}/>
                    <Route path="/admin-feedback" element={<AdminFeedback/>}/>
                    <Route path="/userlist" element={<UserList />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/guest-landing" element={<GuestLanding />} />
                    <Route path="/answer/:id" element={<AnswerQuestion />} />
                    <Route path="/matches" element={<MatchesPage />} />
                    <Route path="/about" element={<About />} />


                    {/* ✅ Routes for admin and user dashboards */}
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/user-dashboard" element={<UserDashboard />} />
                    <Route path="/admin-view-matches" element={<AdminViewMatches />} />
                </Routes>
                {user && <BottomNav />}
            </div>
        </Router>
    );
}

export default App;
