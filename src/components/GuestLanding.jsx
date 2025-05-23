import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaUsers, FaShieldAlt, FaRocket, FaStar, FaComments, FaHome, FaShareAlt, FaCommentDots } from "react-icons/fa";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./GuestLanding.css";

const GuestLanding = () => {
    const navigate = useNavigate();
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        let unsubscribeStats = null;
        
        const fetchUserCount = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get initial count from secure stats collection
                const statsDocRef = doc(db, "stats", "public");
                const statsSnap = await getDoc(statsDocRef);
                
                if (statsSnap.exists()) {
                    const statsData = statsSnap.data();
                    const count = statsData.userCount || 0;
                    setUserCount(count);
                } else {
                    // Fallback count if stats document doesn't exist yet
                    setUserCount(100); // Default display value
                }
                
                setLoading(false);
                
                // Set up real-time listener for live updates
                unsubscribeStats = onSnapshot(
                    statsDocRef,
                    (doc) => {
                        if (doc.exists()) {
                            const statsData = doc.data();
                            const count = statsData.userCount || 0;
                            setUserCount(count);
                            setError(null);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error in stats listener:", error);
                        setError("Unable to get live updates. Please refresh the page.");
                        // Don't change the count if we already have it
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error("Error fetching user count:", err);
                setError("Unable to load user count. Please check your connection and try again.");
                setLoading(false);
            }
        };

        fetchUserCount();
        
        // Cleanup function to unsubscribe from listener
        return () => {
            if (unsubscribeStats) {
                unsubscribeStats();
            }
        };
    }, []);
    
    return (
        <div className="guest-landing">
            {/* Header */}
            <header className="header">
                <div className="nav-container">
                    <h1 className="logo">Let's Match!</h1>
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
                    <h2 className="hero-title">Find Your Perfect Match</h2>
                    <p className="hero-subtitle">
                        Connect with people who share your interests, values, and passions. 
                        Our smart matching algorithm helps you discover meaningful relationships.
                    </p>
                    <div className="hero-buttons">
                        <button className="cta-secondary" onClick={() => navigate("/about")}>
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h3 className="section-title">Why Choose Let's Match?</h3>
                    <div className="features-grid">
                        <div className="feature-card">
                            <FaHeart className="feature-icon" />
                            <h4>Smart Matching</h4>
                            <p>Our advanced algorithm analyzes compatibility based on shared interests and values for meaningful connections.</p>
                        </div>
                        <div className="feature-card">
                            <FaUsers className="feature-icon" />
                            <h4>Diverse Community</h4>
                            <p>Connect with people from all walks of life looking for friendship, romance, or professional networking.</p>
                        </div>
                        <div className="feature-card">
                            <FaShieldAlt className="feature-icon" />
                            <h4>Safe & Secure</h4>
                            <p>Your privacy and safety are our top priorities with advanced security measures and verification systems.</p>
                        </div>
                        <div className="feature-card">
                            <FaComments className="feature-icon" />
                            <h4>Easy Communication</h4>
                            <p>Start conversations naturally with our intuitive messaging system and icebreaker questions.</p>
                        </div>
                        <div className="feature-card">
                            <FaRocket className="feature-icon" />
                            <h4>Quick Setup</h4>
                            <p>Get started in minutes with our simple profile creation process and start meeting people right away.</p>
                        </div>
                        <div className="feature-card">
                            <FaStar className="feature-icon" />
                            <h4>Quality Matches</h4>
                            <p>Focus on quality over quantity with curated matches that truly align with your preferences.</p>
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
                            </div>
                        ) : (
                            <h3 className="count-title">
                                Join our <span className="dynamic-count">{userCount.toLocaleString()}</span> users today!
                            </h3>
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