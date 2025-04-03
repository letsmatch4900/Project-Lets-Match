import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
