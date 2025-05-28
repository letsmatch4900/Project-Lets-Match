import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaHome, FaShareAlt, FaCommentDots, FaGraduationCap, FaTools, FaHandshake } from "react-icons/fa";
import { collection, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./GuestLanding.css";

const GuestLanding = () => {
    const navigate = useNavigate();
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        let unsubscribeUsers = null;
        let verificationInterval = null;
        let hasLoadedCount = false;
        
        const fetchUserCount = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First, try to get the cached count from stats collection for faster initial load
                try {
                    const statsDocRef = doc(db, "stats", "public");
                    const statsSnap = await getDoc(statsDocRef);
                    
                    if (statsSnap.exists()) {
                        const statsData = statsSnap.data();
                        const cachedCount = statsData.userCount || 0;
                        setUserCount(cachedCount);
                        hasLoadedCount = true;
                    }
                } catch (statsError) {
                    console.warn("Could not fetch cached count, will count directly:", statsError);
                }
                
                // Then get the accurate count directly from users collection
                const usersSnapshot = await getDocs(collection(db, "users"));
                const actualCount = usersSnapshot.size;
                setUserCount(actualCount);
                hasLoadedCount = true;
                setLoading(false);
                
                // Set up real-time listener on the users collection for 100% accuracy
                unsubscribeUsers = onSnapshot(
                    collection(db, "users"),
                    (snapshot) => {
                        const liveCount = snapshot.size;
                        setUserCount(liveCount);
                        setError(null);
                        setLoading(false);
                        hasLoadedCount = true;
                        console.log(`Live user count updated: ${liveCount}`);
                    },
                    (error) => {
                        console.error("Error in users collection listener:", error);
                        // Only show error to user if we haven't loaded any count yet
                        if (!hasLoadedCount) {
                            setError("Unable to get live updates. Please refresh the page.");
                        }
                        setLoading(false);
                    }
                );
                
                // Set up periodic verification to ensure accuracy (every 30 seconds)
                verificationInterval = setInterval(async () => {
                    try {
                        const verificationSnapshot = await getDocs(collection(db, "users"));
                        const verifiedCount = verificationSnapshot.size;
                        
                        // Update count if it differs (this handles edge cases where real-time listener might miss updates)
                        setUserCount(prevCount => {
                            if (prevCount !== verifiedCount) {
                                console.log(`Count verification: corrected from ${prevCount} to ${verifiedCount}`);
                                return verifiedCount;
                            }
                            return prevCount;
                        });
                    } catch (verificationError) {
                        console.warn("Periodic verification failed:", verificationError);
                        // Don't update the UI for verification errors
                    }
                }, 30000); // Verify every 30 seconds
                
            } catch (err) {
                console.error("Error fetching user count:", err);
                setError("Unable to load user count. Please check your connection and try again.");
                // Set a reasonable fallback count
                setUserCount(100);
                setLoading(false);
            }
        };

        fetchUserCount();
        
        // Cleanup function to unsubscribe from listener and clear interval
        return () => {
            if (unsubscribeUsers) {
                unsubscribeUsers();
            }
            if (verificationInterval) {
                clearInterval(verificationInterval);
            }
        };
    }, []);
    
    // Manual refresh function for troubleshooting
    const refreshUserCount = async () => {
        try {
            setLoading(true);
            setError(null);
            const usersSnapshot = await getDocs(collection(db, "users"));
            const actualCount = usersSnapshot.size;
            setUserCount(actualCount);
            setLoading(false);
            console.log(`Manual refresh: ${actualCount} users`);
        } catch (err) {
            console.error("Error during manual refresh:", err);
            setError("Refresh failed. Please try again.");
            setLoading(false);
        }
    };
    
    return (
        <div className="guest-landing">
            {/* Header */}
            <header className="header">
                <div className="nav-container">
                    <h1 className="logo">
                        <FaHandshake className="logo-icon" />
                        Let's Match
                    </h1>
                    <div className="auth-buttons">
                        <button className="login-btn" onClick={() => navigate("/login")}>
                            Login
                        </button>
                        <button className="register-btn" onClick={() => navigate("/register")}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h2 className="hero-title">Your Next Great Connection Awaits</h2>
                        <p className="hero-subtitle">
                            From learning partners to life changers, from skilled experts to 
                            kindred spirits — discover connections that truly matter.
                        </p>
                        <div className="hero-buttons">
                            <button className="cta-primary" onClick={() => navigate("/register")}>
                                Get Started
                            </button>
                        </div>
                        <div className="about-us-section">
                            <p className="about-us-text">
                                Want to learn more about our mission? 
                                <span className="about-us-link" onClick={() => navigate("/about")}>
                                    Visit our About Us page
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="hero-image">
                        <img 
                            src="/hero_image.png" 
                            alt="People connecting and matching" 
                            className="hero-img"
                        />
                    </div>
                </div>
            </section>

            {/* Perfect for Every Connection Section */}
            <section className="perfect-connections">
                <div className="container">
                    <h3 className="section-title">Perfect for Every Connection</h3>
                    <p className="section-subtitle">Find the right match for any situation</p>
                    <div className="connections-grid">
                        <div className="connection-card">
                            <FaGraduationCap className="connection-icon" />
                            <h4>Students & Tutors</h4>
                            <p>Connect with expert tutors or eager students for personalized learning experiences.</p>
                        </div>
                        <div className="connection-card">
                            <FaTools className="connection-icon" />
                            <h4>Homeowners & Local Pros</h4>
                            <p>Find trusted professionals for home repairs, maintenance, and improvement projects.</p>
                        </div>
                        <div className="connection-card">
                            <FaHeart className="connection-icon" />
                            <h4>Romantic Interests</h4>
                            <p>Discover meaningful connections based on compatibility and shared values.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <h3 className="section-title">How It Works</h3>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h4>Create Your Profile</h4>
                            <p>Share your interests, preferences, and what you're looking for in a connection.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h4>Answer Questions</h4>
                            <p>Complete our compatibility questionnaire to help our algorithm understand you better.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h4>Get Matched</h4>
                            <p>Receive personalized matches based on compatibility, interests, and preferences.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <h4>Start Connecting</h4>
                            <p>Begin meaningful conversations and build relationships with your matches.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Smarter Matching with Every Answer Section */}
            <section className="smarter-matching">
                <div className="container">
                    <h3 className="section-title">Smarter Matching with Every Answer</h3>
                    <div className="matching-content">
                        <div className="matching-text">
                            <p className="section-subtitle">
                                Our system scores compatibility from 0–100% so you can find 
                                people who truly match your needs and values.
                            </p>
                            <ul className="matching-features">
                                <li>Compatibility algorithms</li>
                                <li>Daily matches</li>
                                <li>Personalized profiles</li>
                            </ul>
                        </div>
                        <div className="matching-demo">
                            <div className="demo-profile">
                                <div className="demo-avatar">JD</div>
                                <div className="demo-info">
                                    <h5>John Doe</h5>
                                    <p className="demo-role">Math Tutor</p>
                                </div>
                            </div>
                            <div className="demo-match">92% Match</div>
                            <div className="demo-rating">
                                <span className="demo-stars">★ 4.9 rating</span>
                                <span>• 127 reviews</span>
                            </div>
                            <p className="demo-description">
                                Experienced calculus tutor with 5+ years helping students excel in mathematics.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic User Count Section */}
            <section className="user-count-section">
                <div className="container">
                    <div className="user-count-card">
                        {loading ? (
                            <h3 className="count-title">
                                Loading our community size...
                            </h3>
                        ) : error ? (
                            <div>
                                <h3 className="count-title">
                                    Join our growing community today!
                                </h3>
                                <p className="error-message" role="alert">
                                    {error}
                                </p>
                                <button 
                                    className="refresh-button" 
                                    onClick={refreshUserCount}
                                    aria-label="Refresh user count"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="count-title">
                                    Join our <span className="dynamic-count">{userCount.toLocaleString()}</span> users today!
                                </h3>
                            </div>
                        )}
                        
                        <p className="count-subtitle">
                            Be part of a growing community of people finding meaningful connections every day.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="final-cta">
                <div className="container">
                    <h3>Ready to Find Your Match?</h3>
                    <p>Join our community and start building meaningful connections today.</p>
                    <div className="cta-buttons">
                        <button className="cta-primary large" onClick={() => navigate("/register")}>
                            Sign Up Now - It's Free!
                        </button>
                        <p className="cta-note">
                            Already have an account? 
                            <span className="link" onClick={() => navigate("/login")}>
                                Login here
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button onClick={() => navigate("/")} aria-label="Home">
                    <FaHome />
                </button>
                <button onClick={() => navigate("/share")} aria-label="Share">
                    <FaShareAlt />
                </button>
                <button onClick={() => navigate("/user-feedback")} aria-label="Feedback">
                    <FaCommentDots />
                </button>
            </div>
        </div>
    );
};

export default GuestLanding; 