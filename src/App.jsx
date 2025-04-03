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
        <Route path="/Settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
 