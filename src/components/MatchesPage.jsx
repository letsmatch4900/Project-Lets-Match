import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // assuming you initialized auth and db in firebase.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './MatchesPage.css';

const MatchesPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user'); // default to 'user'
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserMatches, setSelectedUserMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContacts, setShowContacts] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Fetch user role from Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setUserRole(userData.role || 'user'); // make sure 'role' field exists in your users collection
        }
      } else {
        setCurrentUser(null);
        setUserRole('user');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (userRole === 'admin') {
      fetchAllUsers();
    } else {
      fetchUserMatches(currentUser.uid);
    }
  }, [userRole, currentUser]);

  const fetchAllUsers = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(usersData);
  };

  const fetchUserMatches = async (userId) => {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const matchesData = snapshot.docs.map(doc => doc.data());
    matchesData.sort((a, b) => b.score - a.score); // Higher score first
    setMatches(matchesData.slice(0, 10)); // First 10 matches
  };

  const handleSelectUser = async (userId) => {
    setSelectedUserId(userId);
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const matchesData = snapshot.docs.map(doc => doc.data());
    matchesData.sort((a, b) => b.score - a.score);
    setSelectedUserMatches(matchesData);
  };

  const toggleContactInfo = (matchId) => {
    setShowContacts(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="matches-page">
      <h1>{userRole === 'admin' ? 'Admin - View Matches' : 'My Matches'}</h1>

      {userRole === 'admin' && (
        <div className="admin-section">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <div className="user-list">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                className={`user-button ${selectedUserId === user.id ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user.id)}
              >
                {user.firstName} {user.lastName}
              </button>
            ))}
          </div>

          {selectedUserId && (
            <div className="matches-list">
              <h2>Matches for selected user:</h2>
              {selectedUserMatches.map((match, index) => (
                <div key={index} className="match-card">
                  <p>{match.matchName}</p>
                  <button onClick={() => toggleContactInfo(match.matchId)}>
                    {showContacts[match.matchId] ? 'Hide Contact Info' : 'Show Contact Info'}
                  </button>
                  {showContacts[match.matchId] && (
                    <div className="contact-info">
                      <p>Email: {match.contactInfo?.email || 'Hidden'}</p>
                      <p>Phone: {match.contactInfo?.phone || 'Hidden'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {userRole !== 'admin' && (
        <div className="matches-list">
          {matches.map((match, index) => (
            <div key={index} className="match-card">
              <p>{match.matchName}</p>
              <button onClick={() => toggleContactInfo(match.matchId)}>
                {showContacts[match.matchId] ? 'Hide Contact Info' : 'Show Contact Info'}
              </button>
              {showContacts[match.matchId] && (
                <div className="contact-info">
                  <p>Email: {match.contactInfo?.email || 'Hidden'}</p>
                  <p>Phone: {match.contactInfo?.phone || 'Hidden'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <nav className="bottom-nav">
        <a href="/home">
          <div className="nav-icon">🏠</div>
          <div className="nav-label">Home</div>
        </a>
        <a href="/matches">
          <div className="nav-icon">❤️</div>
          <div className="nav-label">Matches</div>
        </a>
        <a href="/profile">
          <div className="nav-icon">👤</div>
          <div className="nav-label">Profile</div>
        </a>
      </nav>
    </div>
  );
};

export default MatchesPage;
