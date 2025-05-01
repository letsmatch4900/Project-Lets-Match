import React, { useState, useEffect } from "react";
import { getDocuments, updateDocument, deleteDocument } from "../services/firestore"; // Your Firestore functions
import "./ReviewQuestion.css"; // Your CSS file

export default function ReviewQuestion() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [answer, setAnswer] = useState("");

  // Load questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      const fetchedQuestions = await getDocuments("questions");
      setQuestions(fetchedQuestions);
    };
    fetchQuestions();
  }, []);

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setEditedText(question.question);
    setAnswer(question.answer || "");
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedQuestion) return;

    const updatedQuestion = {
      ...selectedQuestion,
      question: editedText,
      answer: answer,
      status,
    };

    await updateDocument("questions", selectedQuestion.id, updatedQuestion);

    setQuestions((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q))
    );

    alert(`Question ${status === "pending" ? "is kept pending" : `has been ${status}`}!`);

    setSelectedQuestion(null);
    setEditedText("");
    setAnswer("");
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    await deleteDocument("questions", selectedQuestion.id);

    setQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));

    alert("Question has been deleted!");

    setSelectedQuestion(null);
    setEditedText("");
    setAnswer("");
  };

  return (
    <div className="review-questions-container">
      <h2>Review Questions</h2>

      {/* Questions List */}
      <div className="question-list">
      {questions.map((q) => (
        <button
          key={q.id}
          className={`question-item ${q.status}`}
          onClick={() => handleSelectQuestion(q)}
        >
          <div className="question-text">{q.question}</div>
          <div className="question-status">
            {q.status === "approved" && "✅ Approved"}
            {q.status === "pending" && "⏳ Pending"}
            {q.status === "rejected" && "❌ Rejected"}
          </div>
        </button>
      ))}
    </div>


      {/* Edit Section */}
      {selectedQuestion && (
        <div className="edit-section">
          <h3>Edit Question</h3>
          <div className="input-group">
            <label>Question:</label>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Answer:</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows="4"
            />
          </div>

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
}
