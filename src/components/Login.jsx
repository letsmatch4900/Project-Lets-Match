import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await user.reload(); // Reload user data

      if (user.emailVerified) {
        // Fetch user role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role; // Retrieve the role field

          alert("Login successful!");

          // Navigate based on role
          if (role === "admin") {
            navigate("/admin-dashboard"); 
          } else {
            navigate("/user-dashboard"); 
          }
        } else {
          setError("No user profile found. Please contact support.");
          await auth.signOut();
        }
      } else {
        await auth.signOut();
        setError("This email isn’t associated with any account.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h5>Login</h5>
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {/* Forgot Password Link */}
      <p className="forgot-password" onClick={() => navigate("/recovery")}>
        Forgot Password?
      </p>

      <p>Don't have an account?</p>
      <button className="register-button" onClick={() => navigate("/register")}>
        Register
      </button>
    </div>
  );
};

export default Login;
