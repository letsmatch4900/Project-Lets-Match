import React, {useState, useEffect} from "react";
//import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaUser } from "react-icons/fa";
//include the other Fa functions would cause error because they were not used.
//import { FaHome, FaShareAlt, FaCommentDots, FaHeart, FaUser, FaQuestion, FaCog } from "react-icons/fa";
import "./UserDashboard.css";

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false); // State to toggle category options
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUser(null);
                setUserData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    /*
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");  // Redirect to homepage after logout
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };
    */
    // Toggle category options
    const toggleCategory = () => {
        setIsCategoryOpen(!isCategoryOpen);
    };
    
    return (
        <div className="user-dashboard">
            {/* Top Bar */}
            <div className="top-bar">
                <h1>Let's Match!</h1>
                <div className="top-right">
                    <FaUser className="user-icon" onClick={() => navigate("/build-profile")} />
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <h2>Home</h2>
                <p>Welcome {userData?.name || user?.email || "User"}</p>

                {/* Category Button and Sub-options */}
                <div className="category-section">
                    <button onClick={toggleCategory} className="option-btn">
                        Category
                    </button>
                    <div className={`sub-options ${isCategoryOpen ? "open" : ""}`}>
                        <button className="sub-option-btn" onClick={() => navigate("/dating")}>
                            Dating
                        </button>
                        <button className="sub-option-btn" onClick={() => navigate("/jobs")}>
                            Jobs
                        </button>
                    </div>
                </div>

                {/* User Specific Buttons */}
                <div className="user-options">
                    <button className="option-btn" onClick={() => navigate("/build-profile")}>
                        Build my profile
                    </button>
                    <button className="option-btn" onClick={() => navigate("/add-question")}>
                        Add a question
                    </button>
                    <button className="option-btn" onClick={() => navigate("/matches")}>
                        My matches
                    </button>
                    <button className="option-btn" onClick={() => navigate("/feedback")}>
                        Feedback
                    </button>
                    <button className="option-btn" onClick={() => navigate("/share")}>
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
