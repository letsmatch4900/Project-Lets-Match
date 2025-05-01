import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
//import { FaUser } from "react-icons/fa";
import { FaHome, FaShareAlt, FaCommentDots, FaHeart, FaUser, FaQuestion, FaCog, FaClipboardList, FaUsers, FaChartBar } from "react-icons/fa";
import { auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import Recovery from "./components/Recovery";
import AddQuestion from "./components/AddQuestion";
import ReviewQuestion from "./components/ReviewQuestion";
import BuildProfile from "./components/BuildProfile";
import Settings from "./components/Settings";
import Share from "./components/Share";
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
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import "./App.css";

// User Bottom Navigation Component
const UserBottomNav = () => {
    const navigate = useNavigate();
    
    return (
        <div className="bottom-nav">
            <button onClick={() => navigate('/')}><FaHome /></button>
            <button onClick={() => navigate('/Share')}><FaShareAlt /></button>
            <button onClick={() => navigate('/user-feedback')}><FaCommentDots /></button>
            <button onClick={() => navigate('/matches')}><FaHeart /></button>
            <button onClick={() => navigate('/build-profile')}><FaUser /></button>
            <button onClick={() => navigate('/add-question')}><FaQuestion /></button>
            <button onClick={() => navigate('/settings')}><FaCog /></button>
        </div>
    );
};

// Admin Bottom Navigation Component
const AdminBottomNav = () => {
    const navigate = useNavigate();
    
    return (
        <div className="bottom-nav admin-bottom-nav">
            <button onClick={() => navigate('/admin-dashboard')}><FaHome /></button>
            <button onClick={() => navigate('/review-question')}><FaClipboardList /></button>
            <button onClick={() => navigate('/admin-feedback')}><FaCommentDots /></button>
            <button onClick={() => navigate('/admin-view-matches')}><FaUsers /></button>
            <button onClick={() => navigate('/settings')}><FaCog /></button>
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                // Check if user is admin
                try {
                    // Check the 'users' collection for role
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        setIsAdmin(userDocSnap.data().role === "admin");
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
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
                    <Route path="/build-profile" element={<BuildProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/share" element ={<Share/>}/>
                    <Route path="/user-feedback" element={<UserFeedback/>}/>
                    <Route path="/userlist" element={<UserList />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/guest-landing" element={<GuestLanding />} />
                    <Route path="/answer/:id" element={<AnswerQuestion />} />
                    <Route path="/matches" element={<MatchesPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/user-dashboard" element={<UserDashboard />} />

                    {/* Protected Admin Routes */}
                    <Route path="/review-question" element={
                        <ProtectedAdminRoute>
                            <ReviewQuestion />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin-feedback" element={
                        <ProtectedAdminRoute>
                            <AdminFeedback />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin-dashboard" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin-view-matches" element={
                        <ProtectedAdminRoute>
                            <AdminViewMatches />
                        </ProtectedAdminRoute>
                    } />
                </Routes>
                {user && (isAdmin ? <AdminBottomNav /> : <UserBottomNav />)}
            </div>
        </Router>
    );
}

export default App;
