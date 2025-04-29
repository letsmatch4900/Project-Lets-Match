import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // make sure you export db and auth from firebase.js
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './MatchesPage.css';

const MAX_MATCHES_DISPLAYED = 10;

const MatchesPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user'); // default to user
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserMatches, setSelectedUserMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContacts, setShowContacts] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'user');
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && userRole === 'admin') {
      fetchAllUsers();
    } else if (currentUser) {
      fetchUserMatches(currentUser.uid);
    }
  }, [currentUser, userRole]);

  const fetchUserMatches = async (userId) => {
    try {
      const userMatchesRef = collection(db, 'matches');
      const q = query(userMatchesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const matchesData = querySnapshot.docs.map(doc => doc.data());
      setMatches(matchesData.sort((a, b) => b.score - a.score).slice(0, MAX_MATCHES_DISPLAYED));
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSelectedUserMatches = async (userId) => {
    try {
      const userMatchesRef = collection(db, 'matches');
      const q = query(userMatchesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const matchesData = querySnapshot.docs.map(doc => doc.data());
      setSelectedUserMatches(matchesData.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Error fetching selected user matches:', error);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    fetchSelectedUserMatches(userId);
  };

  const toggleContact = (matchId) => {
    setShowContacts(prev => ({ ...prev, [matchId]: !prev[matchId] }));
  };

  return (
    <div className="matches-page">
      <h1>Matches</h1>

      {userRole === 'admin' ? (
        <div className="admin-section">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="user-list">
            {users
              .filter(user =>
                `${user.username || ''} ${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <div key={user.id} className="user-item" onClick={() => handleUserSelect(user.id)}>
                  {user.username || user.email}
                </div>
              ))}
          </div>
          {selectedUser && (
            <div className="matches-list">
              {selectedUserMatches.map((match, index) => (
                <div key={index} className="match-card">
                  <div>{match.matchName}</div>
                  <button onClick={() => toggleContact(index)}>
                    {showContacts[index] ? 'Hide Contact' : 'Show Contact'}
                  </button>
                  {showContacts[index] && <div>{match.contactInfo}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match, index) => (
            <div key={index} className="match-card">
              <div>{match.matchName}</div>
              <button onClick={() => toggleContact(index)}>
                {showContacts[index] ? 'Hide Contact' : 'Show Contact'}
              </button>
              {showContacts[index] && <div>{match.contactInfo}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Bottom navigation */}
      <div className="bottom-nav">
        <div className="nav-item">
          <i className="fas fa-home"></i>
          <div className="nav-label">Home</div>
        </div>
        <div className="nav-item">
          <i className="fas fa-heart"></i>
          <div className="nav-label">Matches</div>
        </div>
        <div className="nav-item">
          <i className="fas fa-user"></i>
          <div className="nav-label">Profile</div>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
