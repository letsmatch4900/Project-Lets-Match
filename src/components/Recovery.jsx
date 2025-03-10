import React, { useState, useEffect } from "react";
import { sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Recovery.css"; // Keep using the same CSS file

const Recovery = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract the reset password code from the URL (if it exists)
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (!oobCode) {
      setMessage("Enter your email to receive a reset link.");
    } else {
      setMessage("Enter a new password to reset your account.");
    }
  }, [oobCode]);

  // 📌 Function to send password reset email
  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Opening reset page...");

      // Simulate Firebase Emulator behavior (since real email is not sent)
      const resetUrl = `http://localhost:3000/recovery?oobCode=FAKE_RESET_CODE`;
      console.log(`🔗 Open this link to reset your password: ${resetUrl}`);

      // **Automatically open the link in a new tab**
      setTimeout(() => {
        window.open(resetUrl, "_blank");
      }, 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  // 📌 Function to confirm password reset
  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="recovery-container">
      <h5>{oobCode ? "Reset Your Password" : "Password Recovery"}</h5>
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      {!oobCode ? (
        // **Step 1: Send Reset Email**
        <form onSubmit={handlePasswordResetRequest}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Recovery Email</button>
        </form>
      ) : (
        // **Step 2: Reset Password Form (When oobCode exists)**
        <form onSubmit={handlePasswordResetConfirm}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      )}

      <button className="back-button" onClick={() => navigate("/login")}>
        Back to Login
      </button>
    </div>
  );
};

export default Recovery;