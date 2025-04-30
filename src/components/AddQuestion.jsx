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
  getDocs, 
  where, 
  writeBatch
} from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
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
  const [prefRange, setPrefRange] = useState([3, 7]); // Default range
  const [strictness, setStrictness] = useState(5);    // Default strictness

  const navigate = useNavigate();
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState([]);


  useEffect(() => {
    if (!user) return;
  
    const q = query(collection(db, "answers"), where("userId", "==", user.uid));
    onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().questionId);
      setAnsweredQuestionIds(ids);
    });
  }, [user]);
  

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setQuestionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
  
    try {
      // Add the question to Firestore
      const questionRef = await addDoc(collection(db, "questions"), {
        question,
        labels,
        selectedScore,
        prefRange,
        strictness,
        status: "pending",
        submittedBy: user.uid,
        createdAt: serverTimestamp(),
      });
  
      // Add the user's answer (selfScore) to Firestore
      await addDoc(collection(db, "answers"), {
        questionId: questionRef.id,
        selfScore: selectedScore,
        prefRange: prefRange,        // NEW
        strictness: strictness,      // NEW
        userId: user.uid,
        timestamp: serverTimestamp(),
      });
  
      // Reset form inputs
      setQuestion("");
      setLabels({ 0: "", 2.5: "", 5: "", 7.5: "", 10: "" });
      setSelectedScore(5);
      setPrefRange([3, 7]);     // Reset preferred range
      setStrictness(5);         // Reset strictness
    } catch (error) {
      console.error("Error submitting question and answer:", error);
      alert("There was an error submitting your question. Please try again.");
    }
  };

  const handleDelete = async id => {
    await deleteDoc(doc(db, "questions", id));
  };


  const handleSaveEdit = async () => {
    if (!editingItem) return;
  
    // ✅ Confirmation before continuing
    const confirm = window.confirm("Are you sure? Your question will need to be re-approved and all existing answers will be deleted.");
    if (!confirm) return;
  
    try {
      // Update the question with new data and revert status to 'pending'
      await updateDoc(doc(db, "questions", editingItem.id), {
        selectedScore: editScore,
        labels: editLabels,
        status: "pending"
      });
  
      // Delete all related answers
      const qAnswers = query(
        collection(db, "answers"),
        where("questionId", "==", editingItem.id)
      );
      const snapshot = await getDocs(qAnswers);
      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
  
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
          <p>My Score</p>
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
            <label>Preferred Partner Score Range:</label>
            <br></br><br></br>
            {renderSliderNumbers()}
            {renderLabelTexts(labels)}
            <label>From</label>
            <br></br><br></br>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5" 
              value={prefRange[0]} 
              onChange={e => setPrefRange([parseFloat(e.target.value), prefRange[1]])} 
              />
              <br></br><br></br>
              {renderSliderNumbers()}
            {renderLabelTexts(labels)}
            <label>To</label>
            <br></br><br></br>
            <input type="range" 
              min="0" 
              max="10" 
              step="0.5" 
              value={prefRange[1]} 
              onChange={e => setPrefRange([prefRange[0], parseFloat(e.target.value)])} 
              />
            <br></br><br></br>
            {renderSliderNumbers()}
            {renderLabelTexts(labels)}
            <label>Strictness (0 = lenient, 10 = strict):</label>
            <br></br><br></br>
            <input type="range" min="0" max="10" step="1" value={strictness} onChange={e => setStrictness(parseInt(e.target.value))} />
            <br></br><br></br>
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
        {questionsList
          .filter(item => item.status === "approved" && item.submittedBy !== user.uid)
          .map(item => ( // Users can only see questions that are approved
            //Delete button only seen if user created the question
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
              <p className="status-row">✅ Approved</p>
          
              <div className="button-group">
              {item.submittedBy === user.uid && ( 
                <button
                  onClick={() => handleDelete(item.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              )}
                {/* ✅ Conditionally show "Answer" button or "Question Answered" */}
                {answeredQuestionIds.includes(item.id) ? (
                  <p className="answered-label">✅ Question Answered</p>
                ) : (
                  <button onClick={() => navigate(`/answer/${item.id}`)}>
                    Answer
                  </button>
                )}
              </div>
            </div>
          </div>
          
        ))}
      </div>
    </div>
  );
}
