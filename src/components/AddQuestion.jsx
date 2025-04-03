import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDocument, getUserQuestions } from "../services/firestore";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./AddQuestion.css";

const AddQuestion = () => {
    const [question, setQuestion] = useState("");
    const [userQuestions, setUserQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    // Fetch the user's role (admin/user)
    const fetchUserRole = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
        } else {
            console.warn("User role not found.");
        }
    };

    // Fetch all questions submitted by the current user
    const fetchUserQuestions = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const questions = await getUserQuestions(user.uid);
            setUserQuestions(questions || []);
        } catch (error) {
            console.error("Error fetching user questions:", error);
            setUserQuestions([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUserRole();
        fetchUserQuestions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const user = auth.currentUser;
        const userId = user ? user.uid : "anonymous";

        await addDocument("questions", {
            text: question,
            status: "pending",
            submittedBy: userId,
            createdAt: new Date()
        });

        setQuestion("");
        fetchUserQuestions(); // Refresh the list after submission
        alert("Question added successfully!");
    };

    // Navigate back based on user role
    const handleBack = () => {
        if (userRole === "admin") {
            navigate("/admin-dashboard");
        } else {
            navigate("/user-dashboard");
        }
    };

    // Return the proper icon for question status
    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return "✅";
            case "rejected":
                return "❌";
            default:
                return "🕒";
        }
    };

    return (
        <div className="add-question-container">
            {/* Back button */}
            <button onClick={handleBack} className="back-button">
                ← Back to Dashboard
            </button>

            <h2>Add a Question</h2>

            {/* Show submitted questions */}
            {loading ? (
                <p>Loading your submitted questions...</p>
            ) : userQuestions.length === 0 ? (
                <p>You haven’t submitted any questions yet.</p>
            ) : (
                <div className="question-list">
                    {userQuestions.map((q, index) => (
                        <div key={index} className="question-item">
                            {q.text}
                            <span className="status-icon">{getStatusIcon(q.status)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Form to submit new question */}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question"
                    required
                />
                <button type="submit">Submit Question</button>
            </form>
        </div>
    );
};

export default AddQuestion;
