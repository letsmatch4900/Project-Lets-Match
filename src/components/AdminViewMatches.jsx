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
        const userData = userSnap.exists() ? userSnap.data() : {};

        return {
          id: matchId,
          score,
          ...userData
        };
      }));

      matchList.sort((a, b) => b.score - a.score);
      setMatches(matchList);
    };

    fetchMatches();
  }, [selectedUser]);

  const filteredUsers = users.filter(user =>
    (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.lastName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-view-matches">
      <div className="user-search">
        <input
          type="text"
          placeholder="Search by username, email, etc."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="user-list">
          {filteredUsers.map(user => (
            <li key={user.id} onClick={() => setSelectedUser(user)}>
              {user.nickname || user.email || "Unnamed"}
            </li>
          ))}
        </ul>
      </div>

      {selectedUser && (
        <div className="match-panel">
          <div className="user-info">
            <h3>{selectedUser.nickname || selectedUser.email}</h3>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>First Name:</strong> {selectedUser.firstName}</p>
            <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
            {/* Add any other fields you'd like */}
          </div>

          <div className="matches-list">
            <h3>Matches</h3>
            <div className="scrollable-matches">
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <p><strong>{match.nickname || match.email}</strong></p>
                  <p>Match Score: {(match.score * 100).toFixed(1)}%</p>
                  <p>Email: {match.email}</p>
                  <p>First Name: {match.firstName}</p>
                  <p>Last Name: {match.lastName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
