import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { auth } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, orderBy } from "firebase/firestore";
import "./ProfileQuestions.css";

const ProfileQuestions = ({ userId }) => {
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [unansweredQuestions, setUnansweredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");
    const [answeredSort, setAnsweredSort] = useState("default");
    const [unansweredSort, setUnansweredSort] = useState("default");
    const [updatingQuestionId, setUpdatingQuestionId] = useState(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [sliderValues, setSliderValues] = useState({});

    const updateSliderValue = (questionId, field, value) => {
        setSliderValues(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
    };
    
    // Initialize slider values when questions load or change
    useEffect(() => {
        // Use functional update to avoid dependency on sliderValues
        setSliderValues(prev => {
            const newSliderValues = { ...prev };
            let hasChanges = false;
            
            // Initialize values for answered questions
            answeredQuestions.forEach(question => {
                if (!newSliderValues[question.id]) {
                    newSliderValues[question.id] = {
                        selfScore: question.userScore !== undefined ? parseFloat(question.userScore) : 5,
                        prefMin: question.prefMin !== undefined ? parseFloat(question.prefMin) : 0,
                        prefMax: question.prefMax !== undefined ? parseFloat(question.prefMax) : 10,
                        strictness: question.strictness !== undefined ? parseFloat(question.strictness) : 5
                    };
                    hasChanges = true;
                }
            });
            
            // Initialize values for unanswered questions
            unansweredQuestions.forEach(question => {
                if (!newSliderValues[question.id]) {
                    newSliderValues[question.id] = {
                        selfScore: 5,
                        prefMin: 0,
                        prefMax: 10,
                        strictness: 5
                    };
                    hasChanges = true;
                }
            });
            
            // Only return new object if there are changes
            return hasChanges ? newSliderValues : prev;
        });
    }, [answeredQuestions, unansweredQuestions]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchQuestions = async () => {
            try {
                if (!isMounted) return;
                setLoading(true);
                setError("");
                
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
                
                // Fetch user's answers - be more careful with ordering
                // Some answers might not have answeredAt field, so we need to handle that
                let answersQuery;
                try {
                    // Try with ordering first
                    answersQuery = query(
                        collection(db, "answers"),
                        where("userId", "==", userId),
                        orderBy("answeredAt", "desc")
                    );
                    await getDocs(answersQuery); // Test if this works
                } catch (orderError) {
                    console.error("Error using orderBy, falling back to simple query:", orderError);
                    // If ordering fails, fall back to a simpler query
                    answersQuery = query(
                        collection(db, "answers"),
                        where("userId", "==", userId)
                    );
                }
                
                const answersSnap = await getDocs(answersQuery);
                
                console.log("User answers found:", answersSnap.docs.length);
                
                // Create a map of the user's answers, keyed by questionId
                const userAnswersMap = {};
                answersSnap.forEach(doc => {
                    const answer = doc.data();
                    // Handle possible missing fields
                    const answeredAt = answer.answeredAt ? 
                        (typeof answer.answeredAt.toDate === 'function' ? answer.answeredAt.toDate() : new Date(answer.answeredAt)) 
                        : new Date();
                    
                    // Only add this answer if we haven't seen this questionId before
                    // or if this is a more recent answer
                    if (!userAnswersMap[answer.questionId] || 
                        answeredAt > userAnswersMap[answer.questionId].answeredAt) {
                        userAnswersMap[answer.questionId] = {
                            selfScore: answer.selfScore !== undefined ? answer.selfScore : 5,
                            prefMin: answer.prefMin !== undefined ? answer.prefMin : 0,
                            prefMax: answer.prefMax !== undefined ? answer.prefMax : 10,
                            strictness: answer.strictness !== undefined ? answer.strictness : 5,
                            answeredAt: answeredAt,
                            answerId: doc.id
                        };
                    }
                });
                
                console.log("User answers mapped:", Object.keys(userAnswersMap).length);
                
                // Split questions into answered and unanswered
                const answered = [];
                const unanswered = [];
                
                // Track answered questions to prevent duplicates
                const answeredQuestionsText = new Set();
                
                questionsData.forEach(question => {
                    if (userAnswersMap[question.id] !== undefined) {
                        // Only add if we haven't already added a similar question
                        if (!answeredQuestionsText.has(question.question)) {
                            answeredQuestionsText.add(question.question);
                            answered.push({
                                ...question,
                                userScore: userAnswersMap[question.id].selfScore,
                                prefMin: userAnswersMap[question.id].prefMin,
                                prefMax: userAnswersMap[question.id].prefMax,
                                strictness: userAnswersMap[question.id].strictness,
                                answeredAt: userAnswersMap[question.id].answeredAt,
                                answerId: userAnswersMap[question.id].answerId
                            });
                        }
                    } else {
                        unanswered.push(question);
                    }
                });
                
                console.log("Answered questions:", answered.length);
                console.log("Unanswered questions:", unanswered.length);
                
                if (isMounted) {
                    setAnsweredQuestions(answered);
                    setUnansweredQuestions(unanswered);
                    
                    // Debug: Log the first few answered questions with their scores
                    if (answered.length > 0) {
                        console.log("Sample answered questions with scores:", 
                            answered.slice(0, 3).map(q => ({
                                question: q.question,
                                score: q.userScore
                            }))
                        );
                    }

                    setLoading(false);
                }

            } catch (err) {
                if (isMounted) {
                    console.error("Error fetching questions:", err);
                    // Provide more specific error message based on the error
                    if (err.code === 'permission-denied') {
                        setError("You don't have permission to access these questions. Please log in again.");
                    } else if (err.code === 'unavailable') {
                        setError("Database is currently unavailable. Please try again later.");
                    } else if (err.code === 'not-found') {
                        setError("Questions collection not found. Please contact support.");
                    } else {
                        setError("Failed to load questions. Please try again later.");
                    }
                    
                    // Log detailed error information for debugging
                    console.error("Error details:", {
                        code: err.code,
                        message: err.message,
                        stack: err.stack
                    });
                    
                    setLoading(false);
                }
            }
        };
        
        if (userId) {
            fetchQuestions();
        } else {
            if (isMounted) {
                setError("User ID is required to load questions.");
                setLoading(false);
            }
        }
        
        return () => {
            isMounted = false;
        };
    }, [userId]);

    const handleAnswerQuestion = async (questionId, score, prefMin, prefMax, strictness) => {
        try {
            setUpdatingQuestionId(questionId);
            setError("");
            const now = new Date();
            
            // Verify user authentication
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }
            
            console.log('Starting answer submission for question:', questionId);
            console.log('Answer data:', { score, prefMin, prefMax, strictness, userId });
            console.log('Current user:', currentUser.uid);
            
            // Validate input data
            if (!questionId) {
                throw new Error('Question ID is missing');
            }
            if (!userId) {
                throw new Error('User ID is missing');
            }
            if (currentUser.uid !== userId) {
                throw new Error('User ID mismatch. Please refresh and try again.');
            }
            if (typeof score !== 'number' || isNaN(score)) {
                throw new Error('Score must be a valid number');
            }
            if (typeof prefMin !== 'number' || isNaN(prefMin)) {
                throw new Error('Preference minimum must be a valid number');
            }
            if (typeof prefMax !== 'number' || isNaN(prefMax)) {
                throw new Error('Preference maximum must be a valid number');
            }
            if (typeof strictness !== 'number' || isNaN(strictness)) {
                throw new Error('Strictness must be a valid number');
            }
    
            const answerData = {
                userId: currentUser.uid, // Use current user's UID directly
                questionId,
                selfScore: score,
                prefMin,
                prefMax,
                strictness,
                answeredAt: now
            };
            
            console.log('Creating answer document with data:', answerData);
            
            // Step 1: Create the answer document
            let answerRef;
            try {
                answerRef = await addDoc(collection(db, "answers"), answerData);
                console.log('Successfully created answer document:', answerRef.id);
            } catch (answerError) {
                console.error('Error creating answer document:', answerError);
                console.error('Answer error details:', answerError.code, answerError.message);
                throw new Error(`Failed to create answer document: ${answerError.message}`);
            }
            
            // Step 2: Update the user document
            try {
                console.log('Updating user document:', currentUser.uid);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userUpdateData = {
                    [`questionAnswers.${questionId}`]: {
                        userId: currentUser.uid,
                        questionId,
                        selfScore: score,
                        prefMin,
                        prefMax,
                        strictness,
                        answeredAt: now,
                        updatedAt: now
                    },
                    updatedAt: now
                };
                console.log('User update data:', userUpdateData);
                await updateDoc(userDocRef, userUpdateData);
                console.log('Successfully updated user document');
            } catch (userError) {
                console.error('Error updating user document:', userError);
                console.error('User error details:', userError.code, userError.message);
                throw new Error(`Failed to update user document: ${userError.message}`);
            }
    
            // Step 3: Update local state
            try {
                // Update state
                const answeredQuestion = unansweredQuestions.find(q => q.id === questionId);
                if (answeredQuestion) {
                    setUnansweredQuestions(prev => prev.filter(q => q.id !== questionId));
                    setAnsweredQuestions(prev => [...prev, {
                        ...answeredQuestion,
                        userScore: score,
                        prefMin,
                        prefMax,
                        strictness,
                        answeredAt: now,
                        answerId: answerRef.id
                    }]);
                }
        
                // Clear this question's slider values
                setSliderValues(prev => {
                    const newValues = {...prev};
                    delete newValues[questionId];
                    return newValues;
                });
                
                console.log('Successfully updated local state');
            } catch (stateError) {
                console.error('Error updating local state:', stateError);
                // Don't throw here since the database updates succeeded
                console.warn('Database updated successfully but local state update failed');
            }
    
            setFeedback("Answer saved successfully!");
            setTimeout(() => setFeedback(""), 3000);
            console.log('Answer submission completed successfully');
            
        } catch (err) {
            console.error("Error in handleAnswerQuestion:", err);
            console.error("Error stack:", err.stack);
            setError(`Failed to save your answer: ${err.message}`);
        } finally {
            setUpdatingQuestionId(null);
        }
    };
    
    const handleUpdateAnswer = async (questionId, score, prefMin, prefMax, strictness) => {
        try {
            setUpdatingQuestionId(questionId);
            setError("");
            const now = new Date();
            
            // Verify user authentication
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }
            
            console.log('Starting update process for question:', questionId);
            console.log('Update data:', { score, prefMin, prefMax, strictness, userId });
            console.log('Current user:', currentUser.uid);
            
            // Validate input data
            if (!questionId) {
                throw new Error('Question ID is missing');
            }
            if (!userId) {
                throw new Error('User ID is missing');
            }
            if (currentUser.uid !== userId) {
                throw new Error('User ID mismatch. Please refresh and try again.');
            }
            if (typeof score !== 'number' || isNaN(score)) {
                throw new Error('Score must be a valid number');
            }
            if (typeof prefMin !== 'number' || isNaN(prefMin)) {
                throw new Error('Preference minimum must be a valid number');
            }
            if (typeof prefMax !== 'number' || isNaN(prefMax)) {
                throw new Error('Preference maximum must be a valid number');
            }
            if (typeof strictness !== 'number' || isNaN(strictness)) {
                throw new Error('Strictness must be a valid number');
            }
            
            // Find the question being updated
            const questionToUpdate = answeredQuestions.find(q => q.id === questionId);
            
            if (!questionToUpdate) {
                throw new Error("Question not found in answered questions list");
            }
            
            console.log(`Updating question "${questionToUpdate.question}" with score: ${score}`);
            
            const answerData = {
                selfScore: score,
                prefMin,
                prefMax,
                strictness,
                updatedAt: now
            };
            
            // Step 1: Update or create the answer document
            try {
                if (questionToUpdate.answerId) {
                    console.log('Updating existing answer document:', questionToUpdate.answerId);
                    const answerDocRef = doc(db, "answers", questionToUpdate.answerId);
                    await updateDoc(answerDocRef, answerData);
                    console.log(`Successfully updated existing answer document: ${questionToUpdate.answerId}`);
                } else {
                    console.log('Creating new answer document');
                    // If no answer document exists, create one
                    const fullAnswerData = {
                        userId: currentUser.uid,
                        questionId,
                        ...answerData,
                        answeredAt: now
                    };
                    const newAnswerRef = await addDoc(collection(db, "answers"), fullAnswerData);
                    console.log(`Successfully created new answer document: ${newAnswerRef.id}`);
                    // Update the question with the new answerId
                    questionToUpdate.answerId = newAnswerRef.id;
                }
            } catch (answerError) {
                console.error('Error updating answer document:', answerError);
                throw new Error(`Failed to update answer document: ${answerError.message}`);
            }
            
            // Step 2: Update the user document
            try {
                console.log('Updating user document:', currentUser.uid);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userUpdateData = {
                    [`questionAnswers.${questionId}`]: {
                        userId: currentUser.uid,
                        questionId,
                        selfScore: score,
                        prefMin,
                        prefMax,
                        strictness,
                        answeredAt: questionToUpdate.answeredAt || now,
                        updatedAt: now
                    },
                    updatedAt: now
                };
                console.log('User update data:', userUpdateData);
                await updateDoc(userDocRef, userUpdateData);
                console.log(`Successfully updated user document with new values`);
            } catch (userError) {
                console.error('Error updating user document:', userError);
                console.error('User error details:', userError.code, userError.message);
                throw new Error(`Failed to update user document: ${userError.message}`);
            }
            
            // Step 3: Update local state
            try {
                // Create a new object for each question to ensure React detects the change
                setAnsweredQuestions(prev => 
                    prev.map(q => {
                        if (q.id === questionId) {
                            return {
                                ...q,
                                userScore: score,
                                prefMin,
                                prefMax,
                                strictness,
                                answeredAt: now
                            };
                        }
                        return q;
                    })
                );
                
                // Clear this question's slider values to ensure fresh value next time
                setSliderValues(prev => {
                    const newValues = {...prev};
                    delete newValues[questionId];
                    return newValues;
                });
                
                // Force a component update
                setForceUpdate(prev => prev + 1);
                
                console.log('Successfully updated local state');
            } catch (stateError) {
                console.error('Error updating local state:', stateError);
                // Don't throw here since the database updates succeeded
                console.warn('Database updated successfully but local state update failed');
            }
            
            setFeedback("Answer updated successfully!");
            setTimeout(() => setFeedback(""), 3000);
            console.log('Update process completed successfully');
            
        } catch (err) {
            console.error("Error in handleUpdateAnswer:", err);
            console.error("Error stack:", err.stack);
            setError(`Failed to update your answer: ${err.message}`);
        } finally {
            setUpdatingQuestionId(null);
        }
    };

    const sortQuestions = (questions, sortMethod) => {
        const sortedQuestions = [...questions];

        switch (sortMethod) {
            case "az":
                return sortedQuestions.sort((a, b) => a.question.localeCompare(b.question));
            case "za":
                return sortedQuestions.sort((a, b) => b.question.localeCompare(a.question));
            case "newest":
                return sortedQuestions.sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0));
            case "oldest":
                return sortedQuestions.sort((a, b) => new Date(a.answeredAt || 0) - new Date(b.answeredAt || 0));
            case "highscore":
                return sortedQuestions.sort((a, b) => (b.userScore || 0) - (a.userScore || 0));
            case "lowscore":
                return sortedQuestions.sort((a, b) => (a.userScore || 0) - (b.userScore || 0));
            case "status":
                return sortedQuestions.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
            default:
                return sortedQuestions;
        }
    };

    const MultiRangeSlider = ({ min, max, minVal, maxVal, onChange, disabled }) => {
        const minValRef = React.useRef(minVal);
        const maxValRef = React.useRef(maxVal);
        const range = React.useRef(null);
        const [minPercent, setMinPercent] = React.useState(0);
        const [maxPercent, setMaxPercent] = React.useState(0);
        const [isDragging, setIsDragging] = React.useState(false);

        // Convert to percentage
        useEffect(() => {
            const minPercent = ((minVal - min) / (max - min)) * 100;
            const maxPercent = ((maxVal - min) / (max - min)) * 100;

            setMinPercent(minPercent);
            setMaxPercent(maxPercent);
        }, [minVal, maxVal, min, max]);

        // Keep track of current values in refs for event handlers
        useEffect(() => {
            minValRef.current = minVal;
            maxValRef.current = maxVal;
        }, [minVal, maxVal]);

        // Add global mouse event listeners when dragging
        useEffect(() => {
            const handleMouseUp = () => {
                if (isDragging) {
                    setIsDragging(false);
                }
            };
            
            if (isDragging) {
                window.addEventListener('mouseup', handleMouseUp);
                window.addEventListener('touchend', handleMouseUp);
            }
            
            return () => {
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }, [isDragging]);

        // Generate values for ticks
        const scoreOptions = [0, 2.5, 5, 7.5, 10];
        
        return (
            <div className="slider-container">
                <div className="multi-range-container">
                    <div className="slider-track">
                        <div
                            ref={range}
                            className="slider-range"
                            style={{
                                left: `${minPercent}%`,
                                width: `${maxPercent - minPercent}%`
                            }}
                        />
                    </div>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step="2.5"
                        value={minVal}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value <= maxVal) {
                                onChange([value, maxVal]);
                            }
                        }}
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)}
                        className="thumb thumb-left"
                        disabled={disabled}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step="2.5"
                        value={maxVal}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value >= minVal) {
                                onChange([minVal, value]);
                            }
                        }}
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)}
                        className="thumb thumb-right"
                        disabled={disabled}
                    />
                </div>
                <div className="slider-labels">
                    {scoreOptions.map((score) => (
                        <div key={score} className="label-container">
                            <span className={`score-value ${(score === minVal || score === maxVal) ? 'active-score' : ''}`}>
                                {score}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderQuestion = (question, isAnswered = false) => {
        const scoreOptions = [0, 2.5, 5, 7.5, 10];
        const isUpdating = updatingQuestionId === question.id;
    
        // Define default values consistently
        const defaultValues = {
            selfScore: isAnswered && question.userScore !== undefined ? parseFloat(question.userScore) : 5,
            prefMin: isAnswered && question.prefMin !== undefined ? parseFloat(question.prefMin) : 0,
            prefMax: isAnswered && question.prefMax !== undefined ? parseFloat(question.prefMax) : 10,
            strictness: isAnswered && question.strictness !== undefined ? parseFloat(question.strictness) : 5
        };
        
        // Get current slider values with fallback to defaults
        const currentValues = sliderValues[question.id] || defaultValues;
        
        // Ensure all values are defined
        const values = {
            selfScore: currentValues.selfScore !== undefined ? currentValues.selfScore : defaultValues.selfScore,
            prefMin: currentValues.prefMin !== undefined ? currentValues.prefMin : defaultValues.prefMin,
            prefMax: currentValues.prefMax !== undefined ? currentValues.prefMax : defaultValues.prefMax,
            strictness: currentValues.strictness !== undefined ? currentValues.strictness : defaultValues.strictness
        };
    
        const handleSubmit = () => {
            // Use the current values from state
            const {
                selfScore = defaultValues.selfScore,
                prefMin = defaultValues.prefMin,
                prefMax = defaultValues.prefMax,
                strictness = defaultValues.strictness
            } = values;
        
            if (isAnswered) {
                handleUpdateAnswer(question.id, selfScore, prefMin, prefMax, strictness);
            } else {
                handleAnswerQuestion(question.id, selfScore, prefMin, prefMax, strictness);
            }
        };
        
        const renderSlider = (label, field) => {
            const isUpdating = updatingQuestionId === question.id;
          
            // Ensure we always have defined values for sliders
            const defaultValues = {
              selfScore: isAnswered && question.userScore !== undefined ? parseFloat(question.userScore) : 5,
              prefMin: isAnswered && question.prefMin !== undefined ? parseFloat(question.prefMin) : 0,
              prefMax: isAnswered && question.prefMax !== undefined ? parseFloat(question.prefMax) : 10,
              strictness: isAnswered && question.strictness !== undefined ? parseFloat(question.strictness) : 5
            };
            
            // Retrieve current slider values with fallback to defaults
            const currentValues = sliderValues[question.id] || defaultValues;
            const currentValue = currentValues[field] !== undefined ? currentValues[field] : defaultValues[field];
          
            // Function to get label text for a specific score
            const getLabelText = (score) => {
              return question.labels && question.labels[score] ? question.labels[score] : '';
            };
          
            return (
              <div className="slider-container">
                <label>{label}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="2.5"
                  value={currentValue}
                  onChange={(e) => updateSliderValue(question.id, field, parseFloat(e.target.value))}
                  className="slider"
                  disabled={isUpdating}
                />
                <div className="slider-labels">
                  {scoreOptions.map((score) => (
                    <div key={score} className="label-container">
                      <span className={`score-value ${currentValue === score ? 'active-score' : ''}`}>
                        {score}
                      </span>
                      {field === 'selfScore' && (
                        <span className="label-text">{getLabelText(score)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
        };
        
        const handlePrefRangeChange = ([min, max]) => {
            // Don't allow min and max to be the same value
            let finalMin = min;
            let finalMax = max;
            
            if (min === max) {
                // If they're the same, adjust one of them
                if (max < 10) {
                    finalMax = max + 2.5;
                } else if (min > 0) {
                    finalMin = min - 2.5;
                }
            }
            
            updateSliderValue(question.id, 'prefMin', finalMin);
            updateSliderValue(question.id, 'prefMax', finalMax);
        };

        return (
            <div className={`question-card ${isUpdating ? 'updating' : ''}`} 
                 data-question-id={question.id}
                 data-force-update={forceUpdate}>
                <h3>{question.question}</h3>
    
                {renderSlider("Self Score", "selfScore")}
                
                <div className="slider-container">
                    <label>Preferred Range</label>
                    <MultiRangeSlider
                        min={0}
                        max={10}
                        minVal={values.prefMin}
                        maxVal={values.prefMax}
                        onChange={handlePrefRangeChange}
                        disabled={isUpdating}
                    />
                </div>

                {renderSlider("Strictness", "strictness")}

                <button onClick={handleSubmit} disabled={isUpdating} className="action-button">
                    {isAnswered ? "Update Answer" : "Submit Answer"}
                </button>
    
                {isAnswered && (
                    <div className="answer-metadata">
                        <span>
                            Last updated: {question.answeredAt?.toLocaleDateString() || 'Unknown'}
                        </span>
                    </div>
                )}
            </div>
        );
    };
    
    const renderSortDropdown = (value, onChange, options) => (
        <div className="sort-control">
            <label>Sort by:</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="default">Default</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    if (loading) {
        return <div className="questions-loading">Loading questions...</div>;
    }

    const answeredSortOptions = [
        { value: "az", label: "A-Z" },
        { value: "za", label: "Z-A" },
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "highscore", label: "Highest Score" },
        { value: "lowscore", label: "Lowest Score" }
    ];

    const unansweredSortOptions = [
        { value: "az", label: "A-Z" },
        { value: "za", label: "Z-A" }
    ];

    const sortedAnsweredQuestions = sortQuestions(answeredQuestions, answeredSort);
    const sortedUnansweredQuestions = sortQuestions(unansweredQuestions, unansweredSort);

    return (
        <div className="profile-questions-container">
            {error && <p className="error-message">{error}</p>}
            {feedback && <p className="success-message">{feedback}</p>}
            
            <h2>Profile Questions</h2>
            <p>Answer these questions to help others get to know you better.</p>
            
            <div className="questions-columns">
                <div className="questions-column">
                    <div className="section-header">
                        <h3>Questions You've Answered</h3>
                        {answeredQuestions.length > 0 && 
                            renderSortDropdown(answeredSort, setAnsweredSort, answeredSortOptions)
                        }
                    </div>
                    {answeredQuestions.length === 0 ? (
                        <p className="no-questions">You haven't answered any questions yet.</p>
                    ) : (
                        <div className="questions-list">
                            {(() => {
                                // Create a map to deduplicate questions
                                const uniqueQuestions = new Map();
                                
                                // Only add each question once by text
                                sortedAnsweredQuestions.forEach(question => {
                                    if (!uniqueQuestions.has(question.question)) {
                                        uniqueQuestions.set(question.question, question);
                                    }
                                });
                                
                                // Return only unique questions
                                return Array.from(uniqueQuestions.values()).map(question => (
                                    <div key={`answered-${question.id}-${question.userScore}-${forceUpdate}`}>
                                        {renderQuestion(question, true)}
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>
                
                <div className="questions-column">
                    <div className="section-header">
                        <h3>Questions To Answer</h3>
                        {unansweredQuestions.length > 0 && 
                            renderSortDropdown(unansweredSort, setUnansweredSort, unansweredSortOptions)
                        }
                    </div>
                    {unansweredQuestions.length === 0 ? (
                        <p className="no-questions">You've answered all available questions!</p>
                    ) : (
                        <div className="questions-list">
                            {sortedUnansweredQuestions.map(question => (
                                <div key={`unanswered-${question.id}`}>
                                    {renderQuestion(question)}
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