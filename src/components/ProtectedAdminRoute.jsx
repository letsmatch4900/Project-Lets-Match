import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./ProtectedAdminRoute.css";

// This component wraps admin routes and redirects to dashboard if user is not an admin
const ProtectedAdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setAuthenticated(true);
        
        try {
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
        setAuthenticated(false);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // Show a loading state while checking authentication
    return <div className="loading">Loading...</div>;
  }

  if (!authenticated) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // If logged in but not admin, redirect to user dashboard
    return <Navigate to="/user-dashboard" replace />;
  }

  // If admin user, render the protected component
  return children;
};

export default ProtectedAdminRoute; 