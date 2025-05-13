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
  const [previewScore, setPreviewScore] = useState(5);

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
        answer: question.answer || "",
        labels: question.labels || {
          0: "",
          2.5: "",
          5: "",
          7.5: "",
          10: ""
        }
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
      labels: editFields.labels,
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

  // Handle label changes
  const handleLabelChange = (score, value) => {
    setEditFields(prev => ({
      ...prev,
      labels: {
        ...prev.labels,
        [score]: value
      }
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

              {/* Slider Labels Input */}
              <div className="label-inputs">
                <label>Slider Labels:</label>
                {[0, 2.5, 5, 7.5, 10].map(score => (
                  <div key={score} className="label-input">
                    <label>{score}:</label>
                    <input
                      type="text"
                      value={editFields.labels[score] || ""}
                      onChange={(e) => handleLabelChange(score, e.target.value)}
                      placeholder={`Label for ${score}`}
                    />
                  </div>
                ))}
              </div>

              {/* Preview Section */}
              <div className="preview-container">
                <h3>Preview:</h3>
                <div className="slider-box blue-theme">
                  <p>{editFields.question}</p>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={previewScore}
                    onChange={(e) => setPreviewScore(parseFloat(e.target.value))}
                  />
                  <div className="slider-numbers">
                    {[0, 2.5, 5, 7.5, 10].map((score) => (
                      <span key={score}>{score}</span>
                    ))}
                  </div>
                  <div className="slider-text-labels">
                    {[0, 2.5, 5, 7.5, 10].map((score) => (
                      <span key={score}>{editFields.labels[score] || ""}</span>
                    ))}
                  </div>
                  <p className="selected-score">Selected Score: {previewScore}</p>
                </div>
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
