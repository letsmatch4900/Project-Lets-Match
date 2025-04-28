//React & useState - We use React's state management to handle user input and messages.
import React, { useState } from "react"; 
import { auth } from "../firebase";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if different

import { useEffect } from "react"; // Make sure this is imported

// reauthenticateWithCredential() - Verifies the user's identity using their current password
// updatePassword() - updates the password after successful reauthentication
// EmailAuthProvider.credential() - Creates a credential (email + password) to verify the user.
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from "firebase/auth";

// useNavigate() - Used for navigation, allowing us to redirect users.
import { useNavigate } from "react-router-dom";

// CSS Import - Settings.css styles the settings page.
import "./Settings.css"; 


const Settings = () => {

// State Variables

    //currentPassword → Stores the user's current password.
    //newPassword → Stores the new password input.
    //confirmNewPassword → Stores the confirmation of the new password.
    //error → Stores error messages to show if something goes wrong.
    //message → Stores success messages when the password is updated.
    //navigate → Handles redirections (e.g., if the user isn't logged in).
    //contact info -> Handles setting/storing of shared/unshared contact information
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const [contactInfo, setContactInfo] = useState({
        email: { value: "", share: false },
        phone: { value: "", share: false },
        whatsapp: { value: "", share: false },
    });

    useEffect(() => {
        const fetchContactInfo = async () => {
            const user = auth.currentUser;
            if (!user) return;
    
            try {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
    
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.contactInfo) {
                        setContactInfo(data.contactInfo);
                    }
                }
            } catch (err) {
                console.error("Failed to load contact info:", err);
                setError("Could not load contact information.");
            }
        };
    
        fetchContactInfo();
    }, []);

    //Update function for contact information
    const updateContactInfo = (field, key, val) => {
        setContactInfo((prev) => ({
            ...prev,
            [field]: {
                ...prev[field],
                [key]: val,
            },
        }));
    };

    //Save Contact information into firestore
    const saveContactInfo = async () => {
        setError("");
        setMessage("");

        const user = auth.currentUser;
        if (!user) {
            setError("User not logged in.");
            return;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { contactInfo }, { merge: true });
            setMessage("Contact information saved successfully.");
        } catch (err) {
            console.error("Error saving contact info:", err);
            setError("Failed to save contact info. Please try again.");
        }
    };


    const handlePasswordChange = async (e) => {

        //Prevents Page Refresh
        e.preventDefault(); //stops the default form submission

        //Clears old Messages
        setError(""); // Resets setError("") 
        setMessage(""); // and setMessage("") before processing.

        // Checks if new passwords Match
        // If newPassword !== confirmNewPassword, and error is shown, and the function stops
        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            return;
        }

        // Checks if the User is logged in
        // If auth.currentUser is null, it means the user is not authenticated - Redirect to login.
        const user = auth.currentUser;
        if (!user) {
            setError("No user is signed in.");
            navigate("/login");
            return;
        }

        //Creates Credential for Reauthentication
        const credential = EmailAuthProvider.credential(user.email, currentPassword); // generates a credential using the current password


        try {
            // Step 1: Reauthenticate user with their current password
            await reauthenticateWithCredential(user, credential);

            // Step 2: Update password
            await updatePassword(user, newPassword);
            setMessage("Password updated successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");  // Redirect to homepage after logout
        } catch (error) {
            console.error("Error signing out:", error);
            setError("Error signing out. Please try again.");
        }
    };



    return (


        //Password Reset Form

        <div className="settings-container">
            <h1>Account Settings</h1>
            {error && <p className="error">{error}</p>} 
            {message && <p className="message">{message}</p>}

            <h3>Reset Account Password</h3>

            <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                    <label>Current Password:</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Confirm New Password:</label>
                    <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Change Password</button>
            </form>

            <button onClick={handleSignOut} className="log-out-btn">
                Log Out
            </button>

            <h3>Contact Information to Share with Matches</h3>

            <div className="form-group">
                <label>Email Address:</label>
                <input
                    type="email"
                    value={contactInfo.email.value}
                    onChange={(e) => updateContactInfo("email", "value", e.target.value)}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={contactInfo.email.share}
                        onChange={(e) => updateContactInfo("email", "share", e.target.checked)}
                    />
                    Share with matches
                </label>
            </div>

            <div className="form-group">
                <label>Phone Number:</label>
                <input
                    type="tel"
                    value={contactInfo.phone.value}
                    onChange={(e) => updateContactInfo("phone", "value", e.target.value)}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={contactInfo.phone.share}
                        onChange={(e) => updateContactInfo("phone", "share", e.target.checked)}
                    />
                    Share with matches
                </label>
            </div>

            <div className="form-group">
                <label>WhatsApp Number:</label>
                <input
                    type="tel"
                    value={contactInfo.whatsapp.value}
                    onChange={(e) => updateContactInfo("whatsapp", "value", e.target.value)}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={contactInfo.whatsapp.share}
                        onChange={(e) => updateContactInfo("whatsapp", "share", e.target.checked)}
                    />
                    Share with matches
                </label>
                <button onClick={saveContactInfo}>Save Contact Information</button>
            </div>

        </div>

        
    );
};

export default Settings;