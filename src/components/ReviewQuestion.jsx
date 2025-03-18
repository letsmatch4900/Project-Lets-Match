import React, { useState, useEffect } from "react";
import { getDocuments, updateDocument, deleteDocument } from "../services/firestore"; // Import Firestore functions
import "./ReviewQuestion.css";  // Ensure you have styles for the UI

const ReviewQuestion = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [editedText, setEditedText] = useState("");

    // Fetch questions from Firestore
    useEffect(() => {
        const fetchQuestions = async () => {
            const fetchedQuestions = await getDocuments("questions");
            setQuestions(fetchedQuestions);
        };
        fetchQuestions();
    }, []);

    // Function to select a question for editing
    const handleSelectQuestion = (question) => {
        setSelectedQuestion(question);
        setEditedText(question.text);  // Load the current question text into the input field
    };

    // ✅ Function to update question status with alert()
    const handleUpdateStatus = async (status) => {
        if (!selectedQuestion) return;

        const updatedQuestion = {
            ...selectedQuestion,
            text: editedText,
            status: status,
        };

        await updateDocument("questions", selectedQuestion.id, updatedQuestion);

        // Update state
        setQuestions((prev) => 
            prev.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q))
        );

        // ✅ Show alert notification
        alert(`Question has been ${status}!`);

        // Reset selection
        setSelectedQuestion(null);
        setEditedText("");
    };

    // ✅ Function to delete a question with alert()
    const handleDeleteQuestion = async () => {
        if (!selectedQuestion) return;

        await deleteDocument("questions", selectedQuestion.id);

        // Remove question from state
        setQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));

        // ✅ Show alert notification
        alert("Question has been deleted!");

        // Reset selection
        setSelectedQuestion(null);
        setEditedText("");
    };

    return (
        <div className="review-questions-container">
            <h2>Review Questions</h2>

            {/* List Questions */}
            <div className="question-list">
                {questions.map((q) => (
                    <button key={q.id} className="question-item" onClick={() => handleSelectQuestion(q)}>
                        {q.text}
                    </button>
                ))}
            </div>

            {/* Edit Section */}
            {selectedQuestion && (
                <div className="edit-section">
                    <h3>Edit Question</h3>
                    <input
                        type="text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                    />

                    <div className="button-group">
                        <button onClick={() => handleUpdateStatus("approved")} className="approve-btn">Approve</button>
                        <button onClick={() => handleUpdateStatus("rejected")} className="reject-btn">Reject</button>
                        <button onClick={() => handleUpdateStatus("pending")} className="pending-btn">Keep Pending</button>
                        <button onClick={handleDeleteQuestion} className="delete-btn">Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewQuestion;
