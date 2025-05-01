import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import "./UserFeedback.css";

const Feedback = () => {
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
        
        const q = query(collection(db, "feedback"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        setFeedbackList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    await addDoc(collection(db, "feedback"), {
      userId: user.uid,
      userName: userData?.name || user.email,
      message,
      date: new Date()
    });
    setMessage("");
    // Refresh list
    const q = query(collection(db, "feedback"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    setFeedbackList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>Let's Match!</h1>
        <button onClick={() => navigate("/user-dashboard")} className="feedback-back-btn">
          Back to Dashboard
        </button>
      </div>

      <div className="feedback-content">
        <h2>Feedback</h2>
        <p className="feedback-welcome">Hello, {userData?.name || "User"}!</p>

        <form onSubmit={handleSubmit} className="feedback-form">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="feedback-textarea"
            required
          />
          <button type="submit" className="feedback-submit-btn">
            Submit Feedback
          </button>
        </form>

        <div className="feedback-history">
          <h3>Your Previous Feedback</h3>
          {feedbackList.length === 0 ? (
            <p className="feedback-empty">No feedback submitted yet.</p>
          ) : (
            <ul className="feedback-list">
              {feedbackList.map((item) => (
                <li key={item.id} className="feedback-item">
                  <p>{item.message}</p>
                  <span>{item.date?.toDate().toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;