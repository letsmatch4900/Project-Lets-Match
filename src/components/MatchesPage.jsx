import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import "./Matches.css"; 

const Matches = () => {
  const [user, loading] = useAuthState(auth);
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [userRole, setUserRole] = useState(""); // assume you store userRole

  useEffect(() => {
    if (user) {
      loadUserRole();
      if (userRole !== "admin") {
        loadUserMatches();
      } else {
        loadAllUsers();
      }
    }
  }, [user, userRole]);

  const loadUserRole = async () => {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      setUserRole(docSnap.data().role || "user"); // Default to "user"
    }
  };

  const loadUserMatches = async () => {
    const matchesRef = collection(db, "matches", user.uid, "userMatches");
    const matchesSnapshot = await getDocs(matchesRef);
    const matchesList = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by rank if there's a "rank" field
    matchesList.sort((a, b) => (a.rank || 0) - (b.rank || 0));

    setMatches(matchesList.slice(0, 10)); // Show first 10 or all
  };

  const loadAllUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const userList = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAllUsers(userList);
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    const usersQuery = query(
      collection(db, "users"),
      where("name", ">=", searchInput),
      where("name", "<=", searchInput + "\uf8ff")
    );
    const usersSnapshot = await getDocs(usersQuery);
    const foundUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setSelectedMatches(foundUsers);
  };

  const handleShowContact = (match) => {
    alert(`Contact Info: ${match.contactInfoToShow || "Not Provided"}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="matches-page">
      {userRole === "admin" ? (
        <div className="admin-view">
          <h2>Admin - Search Users</h2>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter name to search..."
          />
          <button onClick={handleSearch}>Search</button>

          <div className="user-list">
            {(selectedMatches.length ? selectedMatches : allUsers).map((user) => (
              <div key={user.id} className="user-card">
                <span>{user.name}</span>
                <button onClick={() => handleShowContact(user)}>View Contact Info</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="user-view">
          <h2>Your Matches</h2>
          <div className="match-list">
            {matches.map((match) => (
              <div key={match.id} className="match-card">
                <span>{match.name}</span>
                <button onClick={() => handleShowContact(match)}>View Contact Info</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
