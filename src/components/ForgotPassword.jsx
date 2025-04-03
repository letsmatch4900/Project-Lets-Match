import React, { useState } from "react";
import { auth } from "../firebase"; // Import Firebase auth
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase function
import "./ForgotPassword.css"; // CSS file for styling

//Defines a functional component ForgotPassword
const ForgotPassword = () => {
    const [email, setEmail] = useState(""); // email stores user's input
    const [message, setMessage] = useState(""); // message displays success messages
    const [error, setError] = useState(""); // error handles error feedback

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            // sends a reset email if the mail is registered
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Check your inbox.");
        } catch (err) {
            // if an error occurs (e.g., invalid email or unregistered user), it displays an error message.
            setError("Failed to send reset email. Please check the email address.");
        }
    };

    // Basic UI: Displays input and a submit button, Shows success or error message dynamically.
    return (
        <div className="forgot-password-container">
            <h2>Reset Your Password</h2>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Send Reset Email</button>
            </form>
        </div>
    );
};

export default ForgotPassword;