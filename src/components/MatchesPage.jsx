import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import userMatchingCore from "../utils/userMatching";
import "./MatchesPage.css";

export default function MatchesPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("percentage");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentUserLocation, setCurrentUserLocation] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) {
        console.log("No authenticated user found");
        setLoading(false);
        return;
      }

      console.log("Starting fetchMatches for user:", user.uid);
      console.log("User auth token exists:", !!user.accessToken);

      try {
        // Get current user's data
        console.log("Fetching current user data...");
        const currentUserDoc = await getDoc(doc(db, "users", user.uid));
        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data();
          setCurrentUserLocation(userData.location || "");
          console.log("Current user data fetched successfully");
        } else {
          console.log("Current user document does not exist");
        }

        console.log("Fetching all answers...");
        const answersSnap = await getDocs(collection(db, "answers"));
        console.log("Answers fetched successfully, count:", answersSnap.docs.length);
        
        const usersAnswers = {};

        answersSnap.forEach(doc => {
          const data = doc.data();
          const { userId, questionId, selfScore, prefMin, prefMax, strictness } = data;

          if (
            typeof selfScore === "number" &&
            typeof prefMin === "number" &&
            typeof prefMax === "number" &&
            typeof strictness === "number"
          ) {
            if (!usersAnswers[userId]) usersAnswers[userId] = {};
            usersAnswers[userId][questionId] = {
              self: selfScore,
              prefRange: [prefMin, prefMax],
              strictness
            };
          }
        });

        const currentUserAnswers = usersAnswers[user.uid];
        if (!currentUserAnswers) {
          console.log("Current user has no answers");
          setMatchedUsers([]);
          setLoading(false);
          return;
        }

        console.log("Fetching all users...");
        const usersSnap = await getDocs(collection(db, "users"));
        console.log("Users fetched successfully, count:", usersSnap.docs.length);
        
        const users = {};
        const matches = [];

        // Create a map of all users with their data
        usersSnap.docs.forEach(userDoc => {
          users[userDoc.id] = userDoc.data();
        });

        // Process each potential match
        for (const userDoc of usersSnap.docs) {
          const matchedUserId = userDoc.id;
          const userInfo = users[matchedUserId];

          // Skip self or users without answers
          if (
            matchedUserId === user.uid ||
            !usersAnswers[matchedUserId]
          ) continue;

          // Calculate overall match score
          let totalAToBScore = 0;
          let totalBToAScore = 0;
          let questionCount = 0;

          // Calculate match scores for each common question
          for (const questionId of Object.keys(currentUserAnswers)) {
            if (!usersAnswers[matchedUserId][questionId]) continue;

            const userAAnswer = currentUserAnswers[questionId];
            const userBAnswer = usersAnswers[matchedUserId][questionId];

            const aToB = userMatchingCore.calculateOneWayMatchScore(
              { [questionId]: userAAnswer }, // current user
              { [questionId]: userBAnswer }  // matched user
            );
            
            const bToA = userMatchingCore.calculateOneWayMatchScore(
              { [questionId]: userBAnswer }, // matched user
              { [questionId]: userAAnswer }  // current user
            );

            totalAToBScore += aToB;
            totalBToAScore += bToA;
            questionCount++;
          }

          // Only consider users with at least one common answered question
          if (questionCount > 0) {
            const averageAToB = totalAToBScore / questionCount;
            const averageBToA = totalBToAScore / questionCount;
            const overallMatchScore = userMatchingCore.geometricMean([averageAToB, averageBToA]);
            
            // Only add users with a match score above 0.5 (50%)
            if (overallMatchScore > 0.5) {
              matches.push({
                userId: matchedUserId,
                displayName: userInfo.nickName || userInfo.fullName || "Unknown User",
                matchScore: overallMatchScore,
                photoURL: userInfo.photoURL || null,
                gender: userInfo.gender || "Not specified",
                location: userInfo.location || "Not specified",
                bio: userInfo.bio || "No bio available",
                rating: userInfo.rating || null,
                reviewCount: userInfo.reviewCount || 0
              });
            }
          }
        }

        console.log("Matches calculated successfully, count:", matches.length);
        setMatchedUsers(matches);
        setLoading(false);
      } catch (error) {
        console.error("Error in fetchMatches:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      // Toggle sort order if clicking the same criteria
      setSortOrder(prevOrder => prevOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new criteria and default to descending for percentage, ascending for distance
      setSortBy(criteria);
      setSortOrder(criteria === "percentage" ? "desc" : "asc");
    }
  };

  // Calculate a simple "distance" score based on location strings
  // This is a placeholder - in a real app, you would use geocoding
  const calculateSimpleDistance = (locationA, locationB) => {
    if (!locationA || !locationB) return Infinity;
    
    // Simple string comparison - closer if they start with the same characters
    // Return a value between 0 and 1 where 0 is identical and 1 is completely different
    const maxLength = Math.max(locationA.length, locationB.length);
    let sameChars = 0;
    
    for (let i = 0; i < Math.min(locationA.length, locationB.length); i++) {
      if (locationA.charAt(i).toLowerCase() === locationB.charAt(i).toLowerCase()) {
        sameChars++;
      } else {
        break;
      }
    }
    
    return 1 - (sameChars / maxLength);
  };

  // Sort the matched users based on current criteria
  const sortedUsers = [...matchedUsers].sort((a, b) => {
    if (sortBy === "percentage") {
      return sortOrder === "desc" 
        ? b.matchScore - a.matchScore 
        : a.matchScore - b.matchScore;
    } else if (sortBy === "distance") {
      const distanceA = calculateSimpleDistance(currentUserLocation, a.location);
      const distanceB = calculateSimpleDistance(currentUserLocation, b.location);
      return sortOrder === "asc" 
        ? distanceA - distanceB 
        : distanceB - distanceA;
    }
    return 0;
  });

  if (loading) return <p>Loading matches...</p>;

  if (matchedUsers.length === 0) {
    return <p className="no-matches-message">No current matches</p>;
  }

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h2>Your Matches</h2>
        <div className="sort-controls">
          <span>Sort by:</span>
          <button 
            className={`sort-button ${sortBy === "percentage" ? "active" : ""}`} 
            onClick={() => handleSortChange("percentage")}
          >
            Match % {sortBy === "percentage" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button 
            className={`sort-button ${sortBy === "distance" ? "active" : ""}`} 
            onClick={() => handleSortChange("distance")}
          >
            Distance {sortBy === "distance" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      <div className="user-matches-grid">
        {sortedUsers.map(match => (
          <div key={match.userId} className="user-match-card">
            <div className="user-profile">
              <div className="user-avatar">
                {match.photoURL ? 
                  <img src={match.photoURL} alt={match.displayName} /> : 
                  <div className="user-avatar-placeholder">
                    {match.displayName.charAt(0).toUpperCase()}
                  </div>
                }
              </div>
              <div className="user-info">
                <h5>{match.displayName}</h5>
                <p className="user-location">{match.location}</p>
              </div>
            </div>
            <div className="user-match-score">
              {(match.matchScore * 100).toFixed(0)}% Match
            </div>
            <div className="user-rating">
              {match.reviewCount > 0 ? (
                <>
                  <span className="user-stars">★ {match.rating} rating</span>
                  <span>• {match.reviewCount} reviews</span>
                </>
              ) : (
                <span className="user-stars">No reviews</span>
              )}
            </div>
            <p className="user-description">
              {match.bio || "No bio available"}
            </p>
            <button className="view-profile-button" onClick={() => navigate(`/profile/${match.userId}`)}>
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
