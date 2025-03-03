import React, { useState } from "react";
import { addDocument } from "../services/firestore";
import "./AddQuestion.css";  // ✅ Import CSS file

const AddQuestion = () => {
    const [question, setQuestion] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        await addDocument("questions", {
            text: question,
            createdAt: new Date()
        });

        setQuestion("");
        alert("Question added!");
    };

    return (
        <div className="add-question-container">  {/* ✅ Apply CSS class */}
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
