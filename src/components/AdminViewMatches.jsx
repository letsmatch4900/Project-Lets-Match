import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "./AdminViewMatches.css"; // You'll style the layout here

export default function AdminViewMatches() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [sortBy, setSortBy] = useState("score"); // score, name, email
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [loading, setLoading] = useState(false);

  // Step 1: Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(list);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Step 2: Fetch matches for selected user
  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedUser) return;

      setLoading(true);
      try {
        const matchesRef = collection(db, "users", selectedUser.id, "matches");
        const snapshot = await getDocs(matchesRef);

        const matchList = await Promise.all(snapshot.docs.map(async docSnap => {
          const score = docSnap.data().score;
          const matchId = docSnap.id;
        
          // Filter out NaN scores immediately
          if (isNaN(score) || score === null || score === undefined) {
            return null;
          }
        
          const userSnap = await getDoc(doc(db, "users", matchId));
          if (!userSnap.exists()) return null;
        
          const userData = userSnap.data();
        
          return {
            id: matchId,
            score,
            ...userData
          };
        }));
        
        // Remove nulls (from missing users or NaN scores)
        const filteredMatches = matchList.filter(Boolean);
        
        setMatches(filteredMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedUser]);

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.nickName || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.fullName || "").toLowerCase().includes(search.toLowerCase()) 
    );
  }, [users, search]);

  // Memoized sorted matches for better performance
  const sortedMatches = useMemo(() => {
    const sorted = [...matches];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "score":
          comparison = a.score - b.score;
          break;
        case "name":
          const nameA = (a.nickName || a.fullName || "").toLowerCase();
          const nameB = (b.nickName || b.fullName || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "email":
          const emailA = (a.email || "").toLowerCase();
          const emailB = (b.email || "").toLowerCase();
          comparison = emailA.localeCompare(emailB);
          break;
        default:
          comparison = a.score - b.score;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  }, [matches, sortBy, sortOrder]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div className="admin-view-matches">
      <div className="admin-header">
        <h2>Admin - View User Matches</h2>
      </div>
      
      <div className="admin-content">
        <div className="user-search-panel">
          <h3>Select User</h3>
          <input
            type="text"
            placeholder="Search by nickname, email, or full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <div className="user-list-container">
            <ul className="user-list">
              {filteredUsers.map(user => (
                <li 
                  key={user.id} 
                  onClick={() => setSelectedUser(user)}
                  className={selectedUser?.id === user.id ? "selected" : ""}
                >
                  <div className="user-item">
                    <strong>{user.nickName || "Unnamed"}</strong>
                    <small>{user.email}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selectedUser && (
          <div className="match-panel">
            <div className="user-info">
              <h3>Selected User</h3>
              <div className="user-details">
                <p><strong>Nickname:</strong> {selectedUser.nickName || "N/A"}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Full Name:</strong> {selectedUser.fullName || "N/A"}</p>
                <p><strong>Total Matches:</strong> {matches.length}</p>
              </div>
            </div>

            <div className="matches-section">
              <div className="matches-header">
                <h3>Matches ({matches.length})</h3>
                <div className="sort-controls">
                  <span>Sort by:</span>
                  <button 
                    onClick={() => handleSortChange("score")}
                    className={`sort-btn ${sortBy === "score" ? "active" : ""}`}
                  >
                    Score {getSortIcon("score")}
                  </button>
                  <button 
                    onClick={() => handleSortChange("name")}
                    className={`sort-btn ${sortBy === "name" ? "active" : ""}`}
                  >
                    Name {getSortIcon("name")}
                  </button>
                  <button 
                    onClick={() => handleSortChange("email")}
                    className={`sort-btn ${sortBy === "email" ? "active" : ""}`}
                  >
                    Email {getSortIcon("email")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading">Loading matches...</div>
              ) : (
                <div className="matches-list">
                  {sortedMatches.length === 0 ? (
                    <div className="no-matches">No valid matches found for this user.</div>
                  ) : (
                    sortedMatches.map(match => (
                      <div key={match.id} className="match-card">
                        <div className="match-header">
                          <h4>{match.nickName || match.fullName || "Unnamed"}</h4>
                          <div className="match-score">
                            {(match.score * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="match-details">
                          <p><strong>Email:</strong> {match.email}</p>
                          {match.fullName && <p><strong>Full Name:</strong> {match.fullName}</p>}
                          {match.nickName && <p><strong>Nickname:</strong> {match.nickName}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
