import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import userMatchingCore from "../utils/userMatching";
import "./MatchesPage.css";

export default function MatchesPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [matchDataByQuestion, setMatchDataByQuestion] = useState({});
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSelect = (questionId) => {
    setExpandedQuestionId(prev => (prev === questionId ? null : questionId));
  };

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      const answersSnap = await getDocs(collection(db, "answers"));
      const usersAnswers = {};

      answersSnap.forEach(doc => {
        const data = doc.data();
        const { userId, questionId, selfScore, prefMin, prefMax, strictness } = data;

        if (
          typeof selfScore === "number" &&
          typeof prefMin === "number" &&
          typeof prefMax === "number" &&
          typeof strictness === "number"
        ) {
          if (!usersAnswers[userId]) usersAnswers[userId] = {};
          usersAnswers[userId][questionId] = {
            self: selfScore,
            prefRange: [prefMin, prefMax],
            strictness
          };
        }
      });

      const currentUserAnswers = usersAnswers[user.uid];
      if (!currentUserAnswers) {
        setMatchDataByQuestion({});
        setLoading(false);
        return;
      }

      const usersSnap = await getDocs(collection(db, "users"));
      const matchGroups = {};

      for (const userDoc of usersSnap.docs) {
        const matchedUserId = userDoc.id;
        const userInfo = userDoc.data();

        if (
          matchedUserId === user.uid ||
          !usersAnswers[matchedUserId]
        ) continue;

        for (const questionId of Object.keys(currentUserAnswers)) {
          if (!usersAnswers[matchedUserId][questionId]) continue;

          const userAAnswer = currentUserAnswers[questionId];
          const userBAnswer = usersAnswers[matchedUserId][questionId];

          const aToB = userMatchingCore.calculateOneWayMatchScore(
            { [questionId]: userAAnswer }, // current user
            { [questionId]: userBAnswer }  // matched user
          );
          
          const bToA = userMatchingCore.calculateOneWayMatchScore(
            { [questionId]: userBAnswer }, // matched user
            { [questionId]: userAAnswer }  // current user
          );
          
          const twoWay = userMatchingCore.geometricMean([aToB, bToA]);
          
          if (twoWay > 0.5) {
            const questionSnap = await getDoc(doc(db, "questions", questionId));

            if (!matchGroups[questionId]) {
              const questionText = questionSnap.exists()
                ? questionSnap.data().question
                : "Unknown Question";

              matchGroups[questionId] = {
                questionText,
                matches: []
              };
            }

          
            const matchedAnswer = usersAnswers[matchedUserId][questionId];
            const scoreValue = matchedAnswer?.self ?? null;

            const questionData = questionSnap.exists() ? questionSnap.data() : {};
            const labelText = questionData.labels && scoreValue in questionData.labels
              ? questionData.labels[scoreValue]
              : "";

            matchGroups[questionId].matches.push({
              userId: matchedUserId,
              displayName: userInfo.nickName || userInfo.fullName || "Unknown User",
              score: aToB,
              selfScore: scoreValue,
              label: labelText
            });

          }
                   
        }
      }

      setMatchDataByQuestion(matchGroups);
      setLoading(false);
    };

    fetchMatches();
  }, [user]);

  if (loading) return <p>Loading matches...</p>;


  if (Object.keys(matchDataByQuestion).length === 0) {
    return <p className="no-matches-message">No current matches</p>;
  }

  return (
    <div className="matches-layout">
      <div className="questions-sidebar">
      <h2 className="sidebar-title">Match Questions</h2>

        {Object.entries(matchDataByQuestion).map(([questionId, data]) => (
          <div
            key={questionId}
            className={`question-card ${expandedQuestionId === questionId ? 'active' : ''}`}
            onClick={() => handleSelect(questionId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSelect(questionId);
            }}
          >
            <h4>{data.questionText}</h4>
          </div>
        ))}
      </div>

      <div className="matches-panel">
        {expandedQuestionId && matchDataByQuestion[expandedQuestionId] && (
          <div className="user-match-list">
            <h3>{matchDataByQuestion[expandedQuestionId].questionText}</h3>
            {matchDataByQuestion[expandedQuestionId].matches.map(match => (
              <div key={match.userId} className="user-match-card">
                <p>{match.displayName}</p>
                <p>Match Score: {(match.score * 100).toFixed(2)}%</p>
                <p>Self Score: <strong>{match.selfScore ?? "N/A"}</strong></p>
                {match.label && <p><em>"{match.label}"</em></p>}
                <button onClick={() => navigate(`/profile/${match.userId}`)}>
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
