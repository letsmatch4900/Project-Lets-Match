import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import "./AddQuestion.css";

export default function AddQuestion() {
  const user = getAuth().currentUser;

  const [question, setQuestion] = useState("");
  const [labels, setLabels] = useState({ 0: "", 2.5: "", 5: "", 7.5: "", 10: "" });
  const [selectedScore, setSelectedScore] = useState(5);
  const [questionsList, setQuestionsList] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [editScore, setEditScore] = useState(5);
  const [editLabels, setEditLabels] = useState({});

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setQuestionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const handleFinalSubmit = async e => {
    e.preventDefault();
    if (!question.trim()) return;
    await addDoc(collection(db, "questions"), {
      question,
      labels,
      selectedScore,
      status: "pending",
      submittedBy: user.uid,
      createdAt: serverTimestamp(),
    });
    setQuestion("");
    setLabels({ 0: "", 2.5: "", 5: "", 7.5: "", 10: "" });
    setSelectedScore(5);
  };

  const handleDelete = async id => {
    await deleteDoc(doc(db, "questions", id));
  };


  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateDoc(doc(db, "questions", editingItem.id), {
        selectedScore: editScore,
        labels: editLabels,
      });
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving edit:", error);
      alert("Failed to update question.");
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const renderSliderNumbers = () => (
    <div className="slider-numbers">
      {[0, 2.5, 5, 7.5, 10].map((s, i) => <span key={i}>{s}</span>)}
    </div>
  );

  const renderLabelTexts = lbls => (
    <div className="slider-text-labels">
      {[0, 2.5, 5, 7.5, 10].map((s, i) => <span key={i}>{lbls[s] || ""}</span>)}
    </div>
  );

  return (
    <div className="add-question-container">
      <h2>Add a New Question</h2>
      <form onSubmit={handleFinalSubmit}>
        <label>Question:</label>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Enter your question"
          required
        />

        <div className="label-inputs">
          <p>Optional (Descriptions for Scores):</p>
          {[0, 2.5, 5, 7.5, 10].map(score => (
            <div key={score} className="label-input">
              <label>- {score}: </label>
              <input
                type="text"
                value={labels[score]}
                onChange={e =>
                  setLabels(prev => ({ ...prev, [score]: e.target.value }))
                }
                placeholder={`Enter text for ${score}`}
              />
            </div>
          ))}
        </div>

        <div className="preview-container">
          <p>Preview:</p>
          <div className="slider-box blue-theme">
            <p>{question}</p>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={selectedScore}
              onChange={e => setSelectedScore(parseFloat(e.target.value))}
            />
            {renderSliderNumbers()}
            {renderLabelTexts(labels)}
            <p className="selected-score">Selected Score: {selectedScore}</p>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit Question
        </button>
      </form>

      {/* EDIT POPUP */}
      {editingItem && (
        <div className="edit-popup">
          <h3>Edit Question</h3>
          <div className="edit-field">
            <label>Selected Score:</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={editScore}
              onChange={(e) => setEditScore(parseFloat(e.target.value))}
            />
            <div style={{ textAlign: "center" }}>{editScore}</div>
          </div>

          <div className="edit-labels">
            {[0, 2.5, 5, 7.5, 10].map((score) => (
              <div key={score} className="edit-label-item">
                <label>{score}</label>
                <input
                  type="text"
                  value={editLabels[score] || ""}
                  onChange={(e) =>
                    setEditLabels((prev) => ({ ...prev, [score]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="edit-buttons">
            <button onClick={handleSaveEdit} className="save-button">Save</button>
            <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}

      <div className="question-list">
        <h3>Submitted Questions</h3>
        {questionsList.length === 0 && <p>No questions submitted yet.</p>}
        {questionsList.map(item => (
          <div key={item.id} className="question-item">
            <div className="slider-box blue-theme">
              <p>{item.question}</p>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={item.selectedScore}
                disabled
              />
              {renderSliderNumbers()}
              {renderLabelTexts(item.labels || {})}
              <p className="selected-score">
                Selected Score: {item.selectedScore}
              </p>
              <p className="status-row">
                {item.status === "pending"
                  ? "⏳ Pending"
                  : item.status === "approved"
                  ? "✅ Approved"
                  : "❌ Rejected"}
              </p>
              <div className="button-group">
                
                <button
                  onClick={() => handleDelete(item.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
