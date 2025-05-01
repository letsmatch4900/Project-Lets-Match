import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import userMatchingCore from "../utils/userMatching"; // Make sure this import path is correct
import "./MatchesPage.css";

export default function MatchesPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      const answersSnap = await getDocs(collection(db, "answers"));
      const usersAnswers = {}; // { userId: { questionId: { self, prefRange, strictness } } }

      answersSnap.forEach(doc => {
        const data = doc.data();
        const { userId, questionId, selfScore, prefMin, prefMax, strictness } = data;
        if (!usersAnswers[userId]) usersAnswers[userId] = {};
        usersAnswers[userId][questionId] = {
          self: selfScore,
          prefRange: [prefMin, prefMax],
          strictness
        };
      });

      const currentUserAnswers = usersAnswers[user.uid];
      if (!currentUserAnswers) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const usersSnap = await getDocs(collection(db, "users"));
      const matchData = [];

      for (const userDoc of usersSnap.docs) {
        const matchedUserId = userDoc.id;
        const userInfo = userDoc.data();

        if (matchedUserId === user.uid || !usersAnswers[matchedUserId]) continue;

        const score = userMatchingCore.calculateTwoWayMatchScore(
          currentUserAnswers,
          usersAnswers[matchedUserId]
        );

        if (score > 0.5) {
          // Try to pull the first question they've answered for context
          const matchedAnswers = Object.keys(usersAnswers[matchedUserId]);
          const sharedQuestions = Object.keys(currentUserAnswers).filter(qId =>
            matchedAnswers.includes(qId)
          );
          
          const questionTexts = [];
          
          for (const qId of sharedQuestions) {
            const questionSnap = await getDoc(doc(db, "questions", qId));
            if (questionSnap.exists()) {
              questionTexts.push(questionSnap.data().question);
            }
          }
          

          matchData.push({
            userId: matchedUserId,
            score,
            displayName: userInfo.nickName || userInfo.fullName || "Unknown User",
            questionTexts // ✅ now using array of shared questions
          });
          
        }
      }

      matchData.sort((a, b) => b.score - a.score);
      setMatches(matchData);
      setLoading(false);
    };

    fetchMatches();
  }, [user]);

  if (loading) return <p>Loading matches...</p>;

  return (
    <div className="matches-page">
      <h2>My Matches</h2>
      <div className="match-cards-container">
      {matches.map(match => (
      <div key={match.userId} className="match-card">
        <h3>{match.displayName}</h3>

        {match.questionTexts && match.questionTexts.length > 0 ? (
          match.questionTexts.map((q, i) => (
            <p key={i}><em>“{q}”</em></p>
          ))
        ) : (
          <p><em>No shared questions</em></p>
        )}

        <p>Match Score: {(match.score * 100).toFixed(2)}%</p>
        <button onClick={() => navigate(`/profile/${match.userId}`)}>View Profile</button>
      </div>
    ))}

      </div>
    </div>
  );
}
