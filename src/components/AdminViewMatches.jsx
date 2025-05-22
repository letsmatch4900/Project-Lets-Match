import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "./AdminViewMatches.css"; // You'll style the layout here

export default function AdminViewMatches() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [matches, setMatches] = useState([]);

  // Step 1: Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  // Step 2: Fetch matches for selected user
  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedUser) return;

      const matchesRef = collection(db, "users", selectedUser.id, "matches");
      const snapshot = await getDocs(matchesRef);

      const matchList = await Promise.all(snapshot.docs.map(async docSnap => {
        const score = docSnap.data().score;
        const matchId = docSnap.id;
      
        const userSnap = await getDoc(doc(db, "users", matchId));
        if (!userSnap.exists()) return null;
      
        const userData = userSnap.data();
      
        return {
          id: matchId,
          score,
          ...userData
        };
      }));
      
      // 🧹 Remove nulls (from missing users)
      const filteredMatches = matchList.filter(Boolean);
      
      // 🧠 Sort by match score
      filteredMatches.sort((a, b) => b.score - a.score);
      
      // ✅ Save to state
      setMatches(filteredMatches);
      
    };

    fetchMatches();
  }, [selectedUser]);

  const filteredUsers = users.filter(user =>
    (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.nickName || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.fullName || "").toLowerCase().includes(search.toLowerCase()) 
  );

  return (
    <div className="admin-view-matches">
      <div className="user-search">
        <input
          type="text"
          placeholder="Search by nickname, email, etc."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="user-list">
          {filteredUsers.map(user => (
            <li key={user.id} onClick={() => setSelectedUser(user)}>
              {user.nickName || "Unnamed"}
            </li>
          ))}
        </ul>

      </div>

      {selectedUser && (
        <div className="match-panel">
          <div className="user-info">
            <h3>{selectedUser.nickName || selectedUser.email}</h3>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Full Name:</strong> {selectedUser.fullName}</p>
            {/* Add any other fields you'd like */}
          </div>

          <div className="matches-list">
            <h3>Matches</h3>
            <div className="scrollable-matches">
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <p><strong>{match.nickName || match.email}</strong></p>
                  <p>Match Score: {(match.score * 100).toFixed(1)}%</p>
                  <p>Email: {match.email}</p>
                  <p>Full Name: {match.fullName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
