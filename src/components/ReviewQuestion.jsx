import React, { useState, useEffect } from "react";
import { getDocuments, updateDocument, deleteDocument } from "../services/firestore"; // Your Firestore functions
import "./ReviewQuestion.css"; // Your CSS file

/**
 * ReviewQuestion - ADMIN ONLY COMPONENT
 * 
 * This component allows admins to review, approve, reject, and delete questions.
 * Unlike the user version, admins can delete approved questions.
 * Regular users should not have access to this component.
 */
export default function ReviewQuestion() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [editFields, setEditFields] = useState({});

  // Load questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      const fetchedQuestions = await getDocuments("questions");
      setQuestions(fetchedQuestions);
    };
    fetchQuestions();
  }, []);

  const handleSelectQuestion = (question) => {
    if (selectedQuestionId === question.id) {
      // If clicking the already selected question, close it
      setSelectedQuestionId(null);
      setEditFields({});
    } else {
      // Otherwise, select the question and initialize edit fields
      setSelectedQuestionId(question.id);
      setEditFields({
        question: question.question,
        answer: question.answer || ""
      });
    }
  };

  const handleUpdateStatus = async (questionId, status) => {
    const selectedQuestion = questions.find(q => q.id === questionId);
    if (!selectedQuestion) return;

    const updatedQuestion = {
      ...selectedQuestion,
      question: editFields.question,
      answer: editFields.answer,
      status,
    };

    await updateDocument("questions", questionId, updatedQuestion);

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? updatedQuestion : q))
    );

    alert(`Question ${status === "pending" ? "is kept pending" : `has been ${status}`}!`);

    setSelectedQuestionId(null);
    setEditFields({});
  };

  // Admin-only function - can delete any question regardless of status
  const handleDeleteQuestion = async (questionId) => {
    const selectedQuestion = questions.find(q => q.id === questionId);
    if (!selectedQuestion) return;

    await deleteDocument("questions", questionId);

    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    alert("Question has been deleted!");

    setSelectedQuestionId(null);
    setEditFields({});
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="review-questions-container">
      <h2>Review Questions</h2>

      {/* Questions List */}
      <div className="question-list">
      {questions.map((q) => (
        <div key={q.id} className="question-container">
          <button
            className={`question-item ${q.status} ${selectedQuestionId === q.id ? 'expanded' : ''}`}
            onClick={() => handleSelectQuestion(q)}
          >
            <div className="question-text">{q.question}</div>
            <div className="question-status">
              {q.status === "approved" && "✅ Approved"}
              {q.status === "pending" && "⏳ Pending"}
              {q.status === "rejected" && "❌ Rejected"}
            </div>
          </button>

          {/* Inline Edit Section */}
          {selectedQuestionId === q.id && (
            <div className="inline-edit-section">
              <div className="input-group">
                <label>Question:</label>
                <input
                  type="text"
                  value={editFields.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Answer:</label>
                <textarea
                  value={editFields.answer}
                  onChange={(e) => handleInputChange('answer', e.target.value)}
                  placeholder="Type your answer here..."
                  rows="4"
                />
              </div>

              <div className="button-group">
                <button onClick={() => handleUpdateStatus(q.id, "approved")} className="approve-btn">Approve</button>
                <button onClick={() => handleUpdateStatus(q.id, "rejected")} className="reject-btn">Reject</button>
                <button onClick={() => handleUpdateStatus(q.id, "pending")} className="pending-btn">Keep Pending</button>
                <button onClick={() => handleDeleteQuestion(q.id)} className="delete-btn">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
