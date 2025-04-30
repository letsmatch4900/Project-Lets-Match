import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, query, where, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import userMatchingCore from "../utils/userMatching";
 // make sure this is the correct path to your algorithm

export default function AnswerQuestion() {
    const { id } = useParams(); // question ID from URL
    const navigate = useNavigate();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const [questionData, setQuestionData] = useState(null);
    const [selfScore, setSelfScore] = useState(5);
    const [submitting, setSubmitting] = useState(false);
  
    useEffect(() => {
      const fetchQuestion = async () => {
        const docRef = doc(db, "questions", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
        const data = snap.data();
        if (data.status !== "approved") {
            alert("This question has not been approved yet.");
            navigate("/");
            return;
        }
        setQuestionData({ id: snap.id, ...data });
        } else {
        alert("Question not found");
        navigate("/");
        }
      };
  
      fetchQuestion();
    }, [id, navigate]);
  
    const handleSubmit = async () => {
        if (!currentUser || !questionData) return;
        setSubmitting(true);
    
        // Step 1: Save selfScore to answers collection
        await addDoc(collection(db, "answers"), {
          questionId: id,
          selfScore,
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
        });
    
        // Step 2: Get all other users who answered this question
        const answerSnap = await getDocs(query(
          collection(db, "answers"),
          where("questionId", "==", id)
        ));
    
        // Step 3: Compare with each answer
        for (const docSnap of answerSnap.docs) {
          const theirData = docSnap.data();
          const otherUserId = theirData.userId;
    
          if (otherUserId === currentUser.uid) continue;
    
          // Build userA (you) and userB (them)
          const userA = {
            [id]: {
              self: selfScore,
              prefRange: questionData.prefRange,
              strictness: questionData.strictness,
            },
          };
    
          const userB = {
            [id]: {
              self: theirData.selfScore,
              prefRange: questionData.prefRange,
              strictness: questionData.strictness,
            },
          };
    
          // Step 4: Calculate match
          const score = userMatchingCore.calculateTwoWayMatchScore(userA, userB);
    
          // Step 5: Save match result to both users
          await Promise.all([
            setDoc(doc(db, "users", currentUser.uid, "matches", otherUserId), {
              score,
              updatedAt: serverTimestamp(),
            }),
            setDoc(doc(db, "users", otherUserId, "matches", currentUser.uid), {
              score,
              updatedAt: serverTimestamp(),
            }),
          ]);
        }
    
        alert("Answer submitted and matches calculated!");
        navigate("/"); // or to another page like /matches
      };
    
      return (
        <div className="answer-question-page">
          <h2>Answer Question</h2>
          {questionData ? (
            <div className="slider-box blue-theme">
              <p><strong>{questionData.question}</strong></p>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={selfScore}
                onChange={e => setSelfScore(parseFloat(e.target.value))}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {[0, 2.5, 5, 7.5, 10].map(score => (
                    <span key={score}>
                    {questionData.labels?.[score] || score}
                    </span>
                ))}
                </div>
              <p className="selected-score">Your Score: {selfScore}</p>
              <button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Answer"}
              </button>
            </div>
          ) : (
            <p>Loading question...</p>
          )}
        </div>
      );
    }
    