import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // make sure this file properly exports initialized db
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from './firebase';
import './MatchesPage.css';

const MAX_MATCHES_DISPLAYED = 10;

const MatchesPage = () => {
  const { currentUser, userRole } = useAuth();
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContacts, setShowContacts] = useState({});

  useEffect(() => {
    if (!currentUser) return; // Important: wait until currentUser is available
    if (userRole === 'admin') {
      fetchAllUsers();
    } else {
      fetchUserMatches(currentUser.uid);
    }
  }, [userRole, currentUser]);

  const fetchAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserMatches = async (uid) => {
    try {
      const matchesQuery = query(collection(db, 'matches'), where('userId', '==', uid));
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchesList = matchesSnapshot.docs.map(doc => ({
        matchId: doc.id, // Important: get the match document ID
        ...doc.data(),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_MATCHES_DISPLAYED);
      setMatches(matchesList);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchMatchesForSelectedUser = async (userId) => {
    try {
      const matchesQuery = query(collection(db, 'matches'), where('userId', '==', userId));
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchesList = matchesSnapshot.docs.map(doc => ({
        matchId: doc.id, // again, use matchId = doc.id
        ...doc.data(),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
      setMatches(matchesList);
    } catch (error) {
      console.error('Error fetching selected user matches:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMatchesForSelectedUser(user.id);
  };

  const toggleShowContact = (matchId) => {
    setShowContacts(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
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
      {userRole === 'admin' ? (
        <div className="admin-view">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
            />
            <div className="user-list">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  {user.firstName} {user.lastName} ({user.username})
                </div>
              ))}
            </div>
          </div>
          <div className="matches-section">
            {selectedUser && (
              <div className="scrollable-matches">
                <div className="selected-user">
                  <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
                  {selectedUser.contactInfo && (
                    <div className="contact-info">
                      {Object.entries(selectedUser.contactInfo).map(([key, value]) => (
                        <div key={key}><strong>{key}:</strong> {value}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="matches-list">
                  {matches.map((match) => (
                    <div key={match.matchId} className="match-item">
                      <h3>{match.matchName} ({match.matchScore}%)</h3>
                      <button onClick={() => toggleShowContact(match.matchId)}>
                        {showContacts[match.matchId] ? 'Hide Contact Info' : 'Show Contact Info'}
                      </button>
                      {showContacts[match.matchId] && match.contactInfo && (
                        <div className="contact-info">
                          {Object.entries(match.contactInfo).map(([key, value]) => (
                            <div key={key}><strong>{key}:</strong> {value}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="user-view">
          <h2>My Matches</h2>
          <div className="matches-list">
            {matches.map((match) => (
              <div key={match.matchId} className="match-item">
                <h3>{match.matchName} ({match.matchScore}%)</h3>
                <button onClick={() => toggleShowContact(match.matchId)}>
                  {showContacts[match.matchId] ? 'Hide Contact Info' : 'Show Contact Info'}
                </button>
                {showContacts[match.matchId] && match.contactInfo && (
                  <div className="contact-info">
                    {Object.entries(match.contactInfo).map(([key, value]) => (
                      <div key={key}><strong>{key}:</strong> {value}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
