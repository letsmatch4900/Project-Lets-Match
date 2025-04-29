import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // for bottom nav clicks
import './MatchesPage.css';

const MatchesPage = ({ currentUser, userRole }) => {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserMatches, setSelectedUserMatches] = useState([]);
  const [showContactInfo, setShowContactInfo] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    if (userRole === 'admin') {
      fetchAllUsers();
    } else {
      fetchUserMatches(currentUser.uid);
    }
  }, [currentUser, userRole]);

  const fetchUserMatches = async (userId) => {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const matchesList = querySnapshot.docs.map(doc => doc.data());
      const sortedMatches = matchesList.sort((a, b) => b.score - a.score);
      setMatches(sortedMatches.slice(0, 10));
    } catch (error) {
      console.error('Error fetching user matches:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedUserId(userId);
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const matchesList = querySnapshot.docs.map(doc => doc.data());
      const sortedMatches = matchesList.sort((a, b) => b.score - a.score);
      setSelectedUserMatches(sortedMatches);
    } catch (error) {
      console.error('Error fetching selected user matches:', error);
    }
  };

  const toggleContactInfo = (matchId) => {
    setShowContactInfo(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const renderMatches = (matchList) => (
    <ul className="matches-list">
      {matchList.map((match, index) => (
        <li key={match.matchId || index} className="match-item">
          <span>{match.matchName}</span>
          <button className="contact-button" onClick={() => toggleContactInfo(match.matchId || index)}>
            {showContactInfo[match.matchId || index] ? 'Hide Contact' : 'Show Contact'}
          </button>
          {showContactInfo[match.matchId || index] && (
            <div className="contact-info">
              <p>{match.contactInfo || 'No contact info available'}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="matches-page">
      <h1>Matches</h1>

      {userRole === 'admin' ? (
        <>
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <ul className="users-list">
            {users
              .filter(user => 
                user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => (
                <li key={user.id} className="user-item">
                  <span>{user.firstName} {user.lastName}</span>
                  <button onClick={() => handleUserSelect(user.id)}>View Matches</button>
                </li>
              ))}
          </ul>

          {selectedUserId && (
            <>
              <h2>Matches for Selected User</h2>
              {renderMatches(selectedUserMatches)}
            </>
          )}
        </>
      ) : (
        <>
          <h2>Your Top Matches</h2>
          {renderMatches(matches)}
        </>
      )}

      <nav className="bottom-nav">
        <div onClick={() => navigate('/home')}>
          <span>🏠</span>
          <p>Home</p>
        </div>
        <div onClick={() => navigate('/matches')}>
          <span>❤️</span>
          <p>Matches</p>
        </div>
        <div onClick={() => navigate('/messages')}>
          <span>💬</span>
          <p>Messages</p>
        </div>
        <div onClick={() => navigate('/profile')}>
          <span>👤</span>
          <p>Profile</p>
        </div>
      </nav>
    </div>
  );
};

export default MatchesPage;
