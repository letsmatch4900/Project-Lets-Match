import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import "./AddQuestion.css";

export default function AddQuestion() {
  const user = getAuth().currentUser;
  const [question, setQuestion] = useState("");
  const [selectedScore, setSelectedScore] = useState(null);
  const [labelInput, setLabelInput] = useState("");
  const [questionsList, setQuestionsList] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.question && item.label);
      setQuestionsList(questions);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "questions"), {
        question,
        score: selectedScore,
        label: labelInput,
        status: "pending",
        submittedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setQuestion("");
      setSelectedScore(null);
      setLabelInput("");
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to submit question.");
    }
  };

  return (
    <div className="add-question-container">
      <h2>Add a New Question</h2>
      <form onSubmit={handleSubmit}>
        <label>Question:</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
          required
        />

        <label>Select a score from 0 to 10 (step 0.5):</label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={selectedScore || 0}
          onChange={(e) => setSelectedScore(parseFloat(e.target.value))}
          className="preview-slider"
        />

        <div className="score-indicator-line">
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className={`score-label ${selectedScore === i ? "active" : ""}`}
              onClick={() => setSelectedScore(i)}
            >
              {i}
            </div>
          ))}
        </div>

        <p>Selected Score: {selectedScore !== null ? selectedScore : "None"}</p>

        {selectedScore !== null && (
          <div className="slider-label-input">
            <label>Label for score {selectedScore}:</label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder={`Label for ${selectedScore}`}
              required
            />
          </div>
        )}

        <button type="submit">Submit Question</button>
      </form>

      <div className="question-list">
        <h3>Submitted Questions</h3>
        {questionsList.length > 0 ? (
          questionsList.map((item) => (
            <div key={item.id} className="question-item">
              <p><strong>Q:</strong> {item.question}</p>
              <p><strong>Score:</strong> {item.score}</p>
              <p><strong>Label:</strong> {item.label}</p>
            </div>
          ))
        ) : (
          <p>No questions submitted yet.</p>
        )}
      </div>
    </div>
  );
}
