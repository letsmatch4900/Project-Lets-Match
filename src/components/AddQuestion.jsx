import React, { useState } from "react";
import { addDocument } from "../services/firestore"; 
import { auth } from "../firebase";  // Import Firebase auth for user tracking
import "./AddQuestion.css";

const AddQuestion = () => {
    const [question, setQuestion] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        // Get current user (if logged in)
        const user = auth.currentUser;
        const userId = user ? user.uid : "anonymous";

        // Add question to Firestore with status field
        await addDocument("questions", {
            text: question,
            status: "pending",  // Set default status
            submittedBy: userId,  // Track the user who submitted it
            createdAt: new Date()
        });

        setQuestion("");
        alert("Question added successfully!");
    };

    return (
        <div className="add-question-container">
            <h2>Add a Question</h2>
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
