import { db } from "../firebase";  // ✅ Import Firestore from firebase.js
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { query, where, orderBy  } from "firebase/firestore"; // Add to existing import line

// ✅ Add a new question to Firestore with default "pending" status
export const addDocument = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            status: "pending", // ✅ Default status
        });
        console.log("Document written with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document:", error);
    }
};

// ✅ Get all questions from Firestore
export const getDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching documents:", error);
    }
};

// ✅ Delete a question from Firestore
// IMPORTANT: For approved questions, this function should only be called from admin components.
// Regular users should not be able to delete approved questions.
// The deletion permission check should be implemented in the component itself.
export const deleteDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        console.log("Document deleted:", docId);
    } catch (error) {
        console.error("Error deleting document:", error);
    }
};

// ✅ Update question status in Firestore
export const updateDocument = async (collectionName, docId, newData) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, newData);
        console.log("Document updated:", docId);
    } catch (error) {
        console.error("Error updating document:", error);
    }
};
export const getUserQuestions = async (userId) => {
    try {
        const q = query(
            collection(db, "questions"),
            where("submittedBy", "==", userId),
            orderBy("createdAt", "desc") // optional, shows latest first
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching user questions:", error);
        return [];
    }
};
