import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "./Dashboard.css";

const auth = getAuth();
const db = getFirestore();

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Redirect to guest landing page instead of login
                navigate("/guest-landing");
                return;
            }

            try {
                // Check the 'users' collection for role
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                let role = "user"; // default
                if (docSnap.exists()) {
                    role = docSnap.data().role || "user";
                }

                // Redirect based on role
                if (role === "admin") {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/user-dashboard");
                }
            } catch (error) {
                console.error("Error reading role from Firestore:", error);
                // Redirect to guest landing page in case of error
                navigate("/guest-landing");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return null;
};

export default Dashboard;
