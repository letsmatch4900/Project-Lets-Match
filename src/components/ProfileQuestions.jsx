import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import "./ProfileQuestions.css";

const ProfileQuestions = ({ userId }) => {
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [unansweredQuestions, setUnansweredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submittedQuestions, setSubmittedQuestions] = useState([]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchQuestions = async () => {
            try {
                if (!isMounted) return;
                setLoading(true);
                
                // Fetch all approved questions
                const questionsQuery = query(collection(db, "questions"), where("status", "==", "approved"));
                const questionDocs = await getDocs(questionsQuery);
                
                if (!isMounted) return;
                console.log("Total questions from Firebase:", questionDocs.docs.length);
                
                // Filter out duplicate questions by question text
                const uniqueQuestionsMap = new Map();
                questionDocs.docs.forEach(doc => {
                    const data = doc.data();
                    // Only add if we don't already have a question with this text
                    if (!uniqueQuestionsMap.has(data.question)) {
                        uniqueQuestionsMap.set(data.question, {
                            id: doc.id,
                            ...data
                        });
                    } else {
                        console.log("Found duplicate question:", data.question);
                    }
                });
                
                const questionsData = Array.from(uniqueQuestionsMap.values());
                console.log("Unique questions after filtering:", questionsData.length);
                
                // Fetch user's answers
                const answersSnap = await getDocs(query(
                    collection(db, "answers"),
                    where("userId", "==", userId)
                  ));
                  
                  const userAnswersMap = {};
                  answersSnap.forEach(doc => {
                    const answer = doc.data();
                    userAnswersMap[answer.questionId] = answer.selfScore;
                  });
                  
                
                // Split questions into answered and unanswered
                const answered = [];
                const unanswered = [];
                
                questionsData.forEach(question => {
                    if (userAnswersMap[question.id] !== undefined) {
                        answered.push({
                          ...question,
                          userScore: userAnswersMap[question.id]
                        });
                      }
                       else {
                        unanswered.push(question);
                    }
                });
                
                console.log("Answered questions:", answered.length);
                console.log("Unanswered questions:", unanswered.length);
                
                if (isMounted) {
                setAnsweredQuestions(answered);
                setUnansweredQuestions(unanswered);

                // 🔽 Add this block to fetch submitted questions
                const submittedQuery = query(
                    collection(db, "questions"),
                    where("submittedBy", "==", userId)
                );
                const submittedSnap = await getDocs(submittedQuery);
                const submitted = submittedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSubmittedQuestions(submitted);

                setLoading(false);
                }

            } catch (err) {
                if (isMounted) {
                    console.error("Error fetching questions:", err);
                    setError("Failed to load questions. Please try again later.");
                    setLoading(false);
                }
            }
        };
        
        if (userId) {
            fetchQuestions();
        }
        
        return () => {
            isMounted = false;
        };
    }, [userId]);

    const handleAnswerQuestion = async (questionId, score) => {
        try {
            // Update the user document with the new answer
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                [`questionAnswers.${questionId}`]: score,
                updatedAt: new Date()
            });
            
            // Update local state
            const answeredQuestion = unansweredQuestions.find(q => q.id === questionId);
            if (answeredQuestion) {
                setUnansweredQuestions(prev => prev.filter(q => q.id !== questionId));
                setAnsweredQuestions(prev => [...prev, {...answeredQuestion, userScore: score}]);
            }
        } catch (err) {
            console.error("Error saving answer:", err);
            setError("Failed to save your answer. Please try again.");
        }
    };

    const handleUpdateAnswer = async (questionId, newScore) => {
        try {
            // Update the user document with the updated answer
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                [`questionAnswers.${questionId}`]: newScore,
                updatedAt: new Date()
            });
            
            // Update local state
            setAnsweredQuestions(prev => 
                prev.map(q => q.id === questionId ? {...q, userScore: newScore} : q)
            );
        } catch (err) {
            console.error("Error updating answer:", err);
            setError("Failed to update your answer. Please try again.");
        }
    };

    const renderQuestion = (question, isAnswered = false) => {
        const scoreOptions = [0, 2.5, 5, 7.5, 10];
        
        return (
            <div className="question-card">
                <h3>{question.question}</h3>
                <div className="slider-container">
                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="2.5"
                        value={isAnswered ? question.userScore : 5}
                        onChange={(e) => {
                            const newScore = parseFloat(e.target.value);
                            if (isAnswered) {
                                handleUpdateAnswer(question.id, newScore);
                            } else {
                                handleAnswerQuestion(question.id, newScore);
                            }
                        }}
                        className="slider"
                    />
                    <div className="slider-labels">
                        {scoreOptions.map(score => (
                            <div key={score} className="label-container">
                                <div className="tick"></div>
                                {question.labels && question.labels[score] && (
                                    <span className="label-text">{question.labels[score]}</span>
                                )}
                                <span className="score-value">{score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="questions-loading">Loading questions...</div>;
    }

    return (
        <div className="profile-questions-container">
            {error && <p className="error-message">{error}</p>}
            
            <h2>Profile Questions</h2>
            <p>Answer these questions to help others get to know you better.</p>
            
            <div className="questions-columns">
                <div className="questions-column">
                    <h3>Questions You've Answered</h3>
                    {answeredQuestions.length === 0 ? (
                        <p className="no-questions">You haven't answered any questions yet.</p>
                    ) : (
                        <div className="questions-list">
                            {answeredQuestions.map(question => (
                                <div key={`answered-${question.id}`}>
                                    {renderQuestion(question, true)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="questions-column">
                    <h3>Questions To Answer</h3>
                    {unansweredQuestions.length === 0 ? (
                        <p className="no-questions">You've answered all available questions!</p>
                    ) : (
                        <div className="questions-list">
                            {unansweredQuestions.map(question => (
                                <div key={`unanswered-${question.id}`}>
                                    {renderQuestion(question)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="submitted-questions-section">
                <h3>Questions You’ve Submitted</h3>
                {submittedQuestions.length === 0 ? (
                    <p className="no-questions">You haven't submitted any questions yet.</p>
                ) : (
                    <div className="questions-list">
                    {submittedQuestions.map(q => (
                        <div key={q.id} className="question-card submitted-question">
                        <h4>{q.question}</h4>
                        <p>Status: <strong>{q.status || "pending"}</strong></p>
                        </div>
                    ))}
                    </div>
                )}
                </div>

            </div>
        </div>
    );
};

export default ProfileQuestions; 