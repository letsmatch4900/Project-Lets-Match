import { db } from "../firebase";  // ✅ Import Firestore from firebase.js
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

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
