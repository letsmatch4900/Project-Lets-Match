import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { sendEmailVerification, deleteUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  //const [verificationPending, setVerificationPending] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    location: "",
    bio: ""
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Get the user object

      if (user.emailVerified) {
        setShowProfileForm(true);
        alert("Login successful!");
      } else {
        // Ask the user if they want to verify
        const confirmVerify = window.confirm(
          "Your email is not verified. Would you like to resend the verification email? You have 10 minutes to verify, or your account will be deleted."
        );
  
        if (confirmVerify) {
          await sendEmailVerification(user);
          alert("Verification email sent. You have 5 minutes to verify.");
  
          // Start 10-minute timer
          const timer = setTimeout(async () => {
            try {
              await user.reload(); // Reload the user object to check if email is verified

              if (!user.emailVerified) {
                await deleteUser(user); // Delete the user if not verified
                alert("Time is up! Your account has been deleted.");
              }
            } catch (err) {
              console.error("Error during deletion timer:", err);
            }
          }, 5 * 60 * 1000); // 5 minutes
  
          // Check every 2 seconds for email verification
          const checkVerification = setInterval(async () => {
            try {
              await user.reload(); // Reload the user object

              if (user.emailVerified) {
                clearTimeout(timer); // Stop the deletion timer
                clearInterval(checkVerification); // Stop checking
                setShowProfileForm(true);
                alert("Email verified! Please enter your information to create your account!");
              }
            } catch (err) {
              console.error("Error checking verification:", err);
              clearInterval(checkVerification); // Stop the interval on error
            }
          }, 2 * 1000); // Check every 2 seconds
        } else {
          await deleteUser(user); // Delete the user if they don’t want to verify
          alert("Your account has been deleted.");
        }
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already associated with an account. Please log in or reset your password.");
      } else {
        console.error(error.message);
        alert("Error logging in: " + error.message);
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!profile.name.trim() || !profile.location.trim() || !profile.bio.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Save profile data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: profile.name.trim(),
        location: profile.location.trim(),
        bio: profile.bio.trim(),
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      alert("Registration and profile creation successful!");
      navigate("/");
    } catch (err) {
      setError("Error creating profile: " + err.message);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (showProfileForm) {
    return (
      <div className="register-container">
        <h5>Complete Your Profile</h5>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={profile.location}
              onChange={handleProfileChange}
              required
              placeholder="Enter your location"
            />
          </div>

          <div className="form-group">
            <label>Bio:</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              required
              placeholder="Tell us about yourself"
              rows="4"
            />
          </div>

          <button type="submit">Complete Registration</button>
        </form>
      </div>
    );
  }

  return (
    <div className="register-container">
      <h5>Register</h5>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleRegister}>
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
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
