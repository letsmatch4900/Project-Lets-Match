import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./MatchesPage.css"; // for custom styles

export default function MatchesPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      const matchesRef = collection(db, "users", user.uid, "matches");
      const snapshot = await getDocs(matchesRef);

      const matchData = await Promise.all(snapshot.docs.map(async docSnap => {
        const matchScore = docSnap.data().score;
        const matchedUserId = docSnap.id;
      
        const userSnap = await getDoc(doc(db, "users", matchedUserId));
        const userInfo = userSnap.exists() ? userSnap.data() : {};
        const displayName = userInfo.nickName || userInfo.fullName || "Unknown User";
      
        // Step 1: Get the answer this user gave (first one is enough for context)
        const answersSnap = await getDocs(
          query(collection(db, "answers"), where("userId", "==", matchedUserId))
        );
      
        let questionText = "No question found.";
        if (!answersSnap.empty) {
          const answerData = answersSnap.docs[0].data(); // use the first question answered
          const questionSnap = await getDoc(doc(db, "questions", answerData.questionId));
          if (questionSnap.exists()) {
            questionText = questionSnap.data().question || "Unnamed question";
          }
        }
      
        return {
          userId: matchedUserId,
          score: matchScore,
          displayName,
          questionText,
        };
      }));
      

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
            <p><em>“{match.questionText}”</em></p>
            <p>Match Score: {(match.score * 100).toFixed(2)}%</p>
            <button onClick={() => navigate(`/profile/${match.userId}`)}>View Profile</button>
          </div>
        ))}
      </div>
    </div>
  );
}
