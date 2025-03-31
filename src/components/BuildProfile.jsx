import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./BuildProfile.css";

const BuildProfile = () => {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        location: "",
        bio: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile({
                        ...docSnap.data(),
                        email: user.email // Email from auth
                    });
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

        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
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

            await setDoc(doc(db, "users", user.uid), {
                name: profile.name,
                location: profile.location,
                bio: profile.bio,
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
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={profile.email}
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
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Bio:</label>
                    <textarea
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                        required
                        rows="4"
                    />
                </div>

                <button type="submit">Save Profile</button>
            </form>
        </div>
    );
};

export default BuildProfile; 