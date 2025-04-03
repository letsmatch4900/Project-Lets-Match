import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import "./Dashboard.css";

// Icon imports
import { FaHome, FaUser, FaQuestion, FaHeart, FaCommentDots, FaShareAlt, FaCog } from "react-icons/fa";

const Dashboard = () => {
   const [user, setUser] = useState(null);
   const [isCategoryOpen, setIsCategoryOpen] = useState(false);
   const navigate = useNavigate();
   const location = useLocation();

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

   const handleSignOut = async () => {
       try {
           await signOut(auth);
           navigate("/");
       } catch (error) {
           console.error("Error signing out:", error);
       }
   };

   const toggleCategory = () => {
       setIsCategoryOpen(!isCategoryOpen);
   };

   const handleNavClick = (path) => {
       navigate(path);
   };

   return (
       <div className="dashboard">
           <div className="top-bar">
               <div className="top-left">
                   <h1>Let's Match!</h1>
               </div>
               <div className="top-right">
                   {user ? (
                       <div className="user-info">
                           <span>Hello, {user.email}</span>
                           <button onClick={handleSignOut} className="log-out-btn">Log Out</button>
                       </div>
                   ) : (
                       <button onClick={handleNavigateToLogin} className="log-in-btn">Log In</button>
                   )}
               </div>
           </div>

           <div className="main-content">
               <h2>Home</h2>
               <div className="options">
                   <p>Welcome {user ? user.email || "User" : "Guest"}</p>

                   <div className="category-section">
                       <button onClick={toggleCategory} className="option-btn">
                           Category
                       </button>
                       <div className={`sub-options ${isCategoryOpen ? "open" : ""}`}>
                           <button className="sub-option-btn">Dating</button>
                           <button className="sub-option-btn">Jobs</button>
                       </div>
                   </div>

                   <button className="option-btn" onClick={() => navigate('/build-profile')}>Build my profile</button>
                   <button className="option-btn" onClick={() => navigate('/add-question')}>Add a question</button>
                   <button className="option-btn" onClick={() => navigate('/matches')}>My matches</button>
                   <button className="option-btn" onClick={() => navigate('/feedback')}>Feedback</button>
                   <button className="option-btn" onClick={() => navigate('/share')}>Share</button>
               </div>
           </div>

           {/* Always Visible Bottom Navigation */}
           <div className="bottom-nav">
               <button onClick={() => handleNavClick('/')}><FaHome /></button>
               <button onClick={() => handleNavClick('/share')}><FaShareAlt /></button>
               <button onClick={() => handleNavClick('/feedback')}><FaCommentDots /></button>
               <button onClick={() => handleNavClick('/matches')}><FaHeart /></button>
               <button onClick={() => handleNavClick('/build-profile')}><FaUser /></button>
               <button onClick={() => handleNavClick('/add-question')}><FaQuestion /></button>
               <button onClick={() => handleNavClick('/settings')}><FaCog /></button>
           </div>
       </div>
   );
};

export default Dashboard;
