import React, { useEffect, useState } from "react";
import { getDocuments, deleteDocument } from "../services/firestore";  //  Import Firestore functions
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ReviewQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            const fetchedQuestions = await getDocuments("questions");  //  Firestore: Fetch all questions
            setQuestions(fetchedQuestions);
        };

        const fetchRole = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));  //  Firestore: Get user role from Firestore
                if (userDoc.exists()) {
                    setRole(userDoc.data().role);
                }
            }
        };

        fetchQuestions();
        fetchRole();
    }, []);

    const handleDelete = async (id) => {
        if (role !== "admin") {
            alert("You do not have permission to delete questions.");
            return;
        }
        await deleteDocument("questions", id);  //  Firestore: Delete question document
        setQuestions(questions.filter(q => q.id !== id));  
    };

    return (
        <div>
            <h2>Review Questions</h2>
            <ul>
                {questions.map(q => (
                    <li key={q.id}>
                        {q.text} 
                        {role === "admin" && (
                            <button onClick={() => handleDelete(q.id)}>Delete</button>  {/* ✅ Clickable delete button */}
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ReviewQuestions;
