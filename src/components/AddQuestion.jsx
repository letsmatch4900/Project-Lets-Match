import React, { useState } from "react"; // Used to manage input field state
import { addDocument } from "../services/firestore"; // A function to add a document to Firestore, likely defined in ../services/firestore.
import { auth } from "../firebase";  // Import Firebase auth for user tracking
import "./AddQuestion.css"; // Provides styling for the component

//Defines a functional component AddQuestion
const AddQuestion = () => { 
    //Uses use state to manage the question input field
    const [question, setQuestion] = useState(""); 

    //This function handles form submission when the user submits a question.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        // Get current user (if logged in)
        // if a user is logged in, it assigns their uid, otherwise, it marks them as anonymous
        const user = auth.currentUser;
        const userId = user ? user.uid : "anonymous";

        // Add question to Firestore with status field
        await addDocument("questions", {
            text: question, // The actual question
            status: "pending",  // Set default status | indicating it hasn't been answered yet
            submittedBy: userId,  // Track the user who submitted it, store the userId or anonymous if not logged in
            createdAt: new Date() // Stores the timestamp of submission
        });

        setQuestion(""); // Clears the input field after submission
        alert("Question added successfully!"); // Shows an alert to confirm the question was added
    };

    // JSX Return (UI)
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
