import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHeart, FaUsers, FaShieldAlt, FaRocket, FaStar, FaComments } from "react-icons/fa";
import "./About.css";

const About = () => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        try {
            navigate(path);
        } catch (error) {
            console.error("Navigation error:", error);
        }
    };

    const handleBack = () => {
        try {
            navigate(-1);
        } catch (error) {
            console.error("Back navigation error:", error);
            // Fallback to home page if back navigation fails
            navigate("/");
        }
    };

    return (
        <div className="about-page">
            <div className="about-header">
                <button 
                    className="back-button" 
                    onClick={handleBack}
                    aria-label="Go back to previous page"
                >
                    <FaArrowLeft /> Back
                </button>
                <h1>About Let's Match</h1>
            </div>

            <div className="about-content">
                <section className="about-intro">
                    <h2>Connecting Hearts & Minds</h2>
                    <p>
                        Let's Match is more than just another matching platform – we're a community dedicated 
                        to fostering genuine connections. Whether you're seeking meaningful friendships, 
                        romantic relationships, or professional networking opportunities, our innovative 
                        platform brings together like-minded individuals who share your values and interests.
                    </p>
                </section>

                <section className="about-features">
                    <h3>What Makes Us Different</h3>
                    <div className="feature-list">
                        <div className="feature-item">
                            <FaHeart className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Smart Compatibility Matching</h4>
                                <p>
                                    Our advanced algorithm goes beyond surface-level preferences to analyze deep 
                                    compatibility based on personality traits, values, and life goals.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FaUsers className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Diverse & Inclusive Community</h4>
                                <p>
                                    We welcome people from all backgrounds, orientations, and walks of life, 
                                    creating a rich tapestry of potential connections.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FaShieldAlt className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Privacy & Safety First</h4>
                                <p>
                                    Your personal information is protected with enterprise-grade security, and our 
                                    community guidelines ensure a safe environment for everyone.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FaComments className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Meaningful Conversations</h4>
                                <p>
                                    Break the ice with our thoughtfully designed conversation starters and 
                                    compatibility questions that reveal what truly matters.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FaRocket className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Easy to Get Started</h4>
                                <p>
                                    Our streamlined onboarding process gets you connected quickly without 
                                    overwhelming complexity or lengthy forms.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FaStar className="feature-icon" aria-hidden="true" />
                            <div>
                                <h4>Quality Over Quantity</h4>
                                <p>
                                    We focus on providing fewer, higher-quality matches rather than overwhelming 
                                    you with endless options.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-mission">
                    <h3>Our Mission</h3>
                    <p>
                        In an increasingly digital world, we believe that authentic human connections 
                        are more important than ever. Our mission is to use technology thoughtfully 
                        to bring people together in meaningful ways, fostering relationships that 
                        enrich lives and build stronger communities.
                    </p>
                </section>

                <section className="about-cta">
                    <h3>Ready to Begin?</h3>
                    <p>Join thousands of users who have already found their perfect match!</p>
                    <div className="cta-buttons">
                        <button 
                            className="cta-primary" 
                            onClick={() => handleNavigation("/register")}
                            aria-label="Sign up for Let's Match"
                        >
                            Sign Up Today
                        </button>
                        <button 
                            className="cta-secondary" 
                            onClick={() => handleNavigation("/login")}
                            aria-label="Login to existing account"
                        >
                            Already a Member?
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About; 