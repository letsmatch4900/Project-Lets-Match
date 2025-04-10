import React, { useState, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { sendEmailVerification, deleteUser } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt } from "react-icons/fa";
import "./Register.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  //const [verificationPending, setVerificationPending] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    nickName: "",
    gender: "",
    language: "",
    timeZone: "",
    location: "",
    bio: ""
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
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
          "We will send you a verification email. You have 5 minutes to verify, or your account will not be created."
        );
  
        if (confirmVerify) {
          await sendEmailVerification(user);
          alert("Verification email sent. You have 5 minutes to verify.");
  
          // Start 10-minute timer
          const timer = setTimeout(async () => {
            try {
              const refreshedUser = auth.currentUser;
              if (refreshedUser) {
                await refreshedUser.reload();
                if (!refreshedUser.emailVerified) {
                  await deleteUser(refreshedUser);
                  alert("Time is up! Your account has been deleted.");
                }
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
          await deleteUser(user); // Delete the user if they don't want to verify
          alert("Your account has been deleted.");
        }
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is either already associated with an account or pending verification. Please log in or reset your password.");
      } else {
        console.error(error.message);
        alert("Error logging in: " + error.message);
      }
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setImageUrl(previewUrl);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;
    
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to upload a profile image");
      return null;
    }

    const fileExtension = profileImage.name.split('.').pop();
    const storageRef = ref(storage, `profile-images/${user.uid}.${fileExtension}`);
    
    try {
      setUploading(true);
      await uploadBytes(storageRef, profileImage);
      const downloadURL = await getDownloadURL(storageRef);
      setUploading(false);
      return downloadURL;
    } catch (error) {
      console.error("Storage error:", error);
      setError("Error uploading image: " + (error.message || "Storage permission denied. Please check Firebase Storage rules."));
      setUploading(false);
      return null;
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Upload image if selected
      let photoURL = null;
      if (profileImage) {
        photoURL = await uploadProfileImage();
        if (!photoURL && profileImage) {
          setError("Failed to upload profile image. Please try again.");
          return;
        }
      }

      // Save profile data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: profile.fullName,
        nickName: profile.nickName,
        gender: profile.gender,
        language: profile.language,
        timeZone: profile.timeZone,
        location: profile.location,
        bio: profile.bio,
        photoURL: photoURL,
        email: user.email,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      alert("Registration and profile creation successful!");
      navigate("/");
    } catch (err) {
      setError("Error creating profile: " + err.message);
    }
  };

  if (showProfileForm) {
    return (
      <div className="register-container">
        <h2>Complete Your Profile</h2>
        {error && <p className="error">{error}</p>}
        
        <div className="profile-picture-container">
          <div className="profile-image-wrapper">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Profile" 
                className="profile-image" 
              />
            ) : (
              <div className="default-avatar">
                {profile.fullName ? (
                  <div className="initial-avatar">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="initial-avatar">
                    ?
                  </div>
                )}
              </div>
            )}
            <button type="button" className="edit-button" onClick={handleImageClick}>
              <FaPencilAlt />
            </button>
          </div>
          <input 
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
            ref={fileInputRef}
          />
        </div>
        
        <form onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleProfileChange}
                placeholder="Your Full Name"
                required
              />
            </div>
            <div className="form-group">
              <label>Nick Name:</label>
              <input
                type="text"
                name="nickName"
                value={profile.nickName}
                onChange={handleProfileChange}
                placeholder="Your Nick Name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender:</label>
              <select name="gender" value={profile.gender} onChange={handleProfileChange}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleProfileChange}
                placeholder="Your Location"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language:</label>
              <select name="language" value={profile.language} onChange={handleProfileChange}>
                <option value="">Select Language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Time Zone:</label>
              <select name="timeZone" value={profile.timeZone} onChange={handleProfileChange}>
                <option value="">Select Time Zone</option>
                <option value="utc-8">Pacific Time (UTC-8)</option>
                <option value="utc-7">Mountain Time (UTC-7)</option>
                <option value="utc-6">Central Time (UTC-6)</option>
                <option value="utc-5">Eastern Time (UTC-5)</option>
                <option value="utc+0">GMT (UTC+0)</option>
                <option value="utc+1">Central European Time (UTC+1)</option>
                <option value="utc+5.5">Indian Standard Time (UTC+5:30)</option>
                <option value="utc+8">China Standard Time (UTC+8)</option>
              </select>
            </div>
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
            <label>Bio:</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              placeholder="Tell us a bit about yourself..."
              rows="4"
              required
            ></textarea>
          </div>

          <button type="submit" disabled={uploading}>
            Complete Registration
          </button>
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
