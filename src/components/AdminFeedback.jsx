import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./AdminFeedback.css";

const AdminFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" for newest first, "asc" for oldest first
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedback = async () => {
      const snapshot = await getDocs(collection(db, "feedback"));
      const feedbackData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() 
      }));
      
      // Sort feedback based on current sort order
      const sortedFeedback = feedbackData.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return sortOrder === "desc" ? b.date - a.date : a.date - b.date;
      });
      
      setFeedbackList(sortedFeedback);
    };
    fetchFeedback();
  }, [sortOrder]); // Re-fetch when sort order changes

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === "desc" ? "asc" : "desc");
  };

  return (
    <div className="admin-feedback-container">
      <div className="admin-feedback-header">
        <h1>Let's Match </h1>
        <button onClick={() => navigate("/admin-dashboard")} className="admin-feedback-back-btn">
          Back to Dashboard
        </button>
      </div>

      <div className="admin-feedback-content">
        <div className="admin-feedback-title-section">
          <h2>User Feedback</h2>
          <button 
            onClick={toggleSortOrder} 
            className="admin-feedback-sort-btn"
          >
            Sort by: {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </button>
        </div>
        
        {feedbackList.length === 0 ? (
          <p className="admin-feedback-empty">No feedback submitted yet.</p>
        ) : (
          <table className="admin-feedback-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map((item) => (
                <tr key={item.id}>
                  <td>{item.userName || "Anonymous"}</td>
                  <td>{item.message}</td>
                  <td>{item.date?.toLocaleString() || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
