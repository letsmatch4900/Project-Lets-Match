import React, { useState } from "react";
import { addDocument } from "../services/firestore";  //  Import Firestore function

const AddQuestion = () => {
    const [question, setQuestion] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        await addDocument("questions", {  //  Firestore: Add document to "questions" collection
            text: question,
            createdAt: new Date()
        });

        setQuestion("");
        alert("Question added!");
    };

    return (
        <div>
            <h2>Add a Question</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question"
                    required
                />
                <button type="submit">Submit Question</button>  {/* ✅ Clickable button */}
            </form>
        </div>
    );
};

export default AddQuestion;
