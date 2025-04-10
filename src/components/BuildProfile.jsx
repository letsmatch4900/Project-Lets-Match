import React, { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FaPencilAlt } from "react-icons/fa";
import "./BuildProfile.css";

const BuildProfile = () => {
    const [profile, setProfile] = useState({
        email: "",
        fullName: "",
        nickName: "",
        gender: "",
        country: "",
        language: "",
        timeZone: "",
        location: "",
        bio: ""
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async (user) => {
            try {
                if (!user) {
                    return;
                }

                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfile({
                        ...userData,
                        email: user.email // Email from auth
                    });
                    
                    // Set profile image if it exists
                    if (userData.photoURL) {
                        setImageUrl(userData.photoURL);
                    }
                } else {
                    // Initialize with user's email
                    setProfile(prev => ({
                        ...prev,
                        email: user.email
                    }));
                }
            } catch (err) {
                setError("Error fetching profile: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
                return;
            }
            
            setLoading(true);
            fetchProfile(user);
        });

        // Clean up the listener when component unmounts
        return () => unsubscribe();
    }, [navigate]);

    const handleChange = (e) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const user = auth.currentUser;
            if (!user) {
                navigate("/login");
                return;
            }

            // Upload image if a new one is selected
            let photoURL = profile.photoURL || null;
            if (profileImage) {
                photoURL = await uploadProfileImage();
                if (!photoURL) {
                    setError("Failed to upload profile image. Please try again.");
                    return;
                }
            }

            // Update profile data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: profile.fullName,
                nickName: profile.nickName,
                gender: profile.gender,
                language: profile.language,
                timeZone: profile.timeZone,
                location: profile.location,
                bio: profile.bio,
                photoURL: photoURL,
                updatedAt: new Date()
            });

            setMessage("Profile updated successfully!");
        } catch (err) {
            setError("Error updating profile: " + err.message);
        }
    };

    if (loading) {
        return <div className="build-profile-container">Loading...</div>;
    }

    return (
        <div className="build-profile-container">
            <h2>Build Your Profile</h2>
            {error && <p className="error">{error}</p>}
            {message && <p className="message">{message}</p>}
            
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
            
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Full Name:</label>
                        <input
                            type="text"
                            name="fullName"
                            value={profile.fullName}
                            onChange={handleChange}
                            placeholder="Your Full Name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Nick Name:</label>
                        <input
                            type="text"
                            name="nickName"
                            value={profile.nickName}
                            onChange={handleChange}
                            placeholder="Your Nick Name"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Gender:</label>
                        <select name="gender" value={profile.gender} onChange={handleChange}>
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
                            onChange={handleChange}
                            placeholder="Your Location"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Language:</label>
                        <select name="language" value={profile.language} onChange={handleChange}>
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
                        <select name="timeZone" value={profile.timeZone} onChange={handleChange}>
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
                    <label>My email Address:</label>
                    <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="disabled-input"
                    />
                </div>

                <div className="form-group">
                    <label>Bio:</label>
                    <textarea
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                        placeholder="Tell us a bit about yourself..."
                        rows="4"
                    ></textarea>
                </div>

                <button type="submit" disabled={uploading}>
                    Save Profile
                </button>
            </form>
        </div>
    );
};

export default BuildProfile; 