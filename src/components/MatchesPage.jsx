import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Adjust path if needed
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { FaSearch, FaUser, FaHeart, FaCog, FaHome, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // For navigation
import './MatchesPage.css';

const MAX_MATCHES_DISPLAYED = 10;

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

  const fetchUserMatches = async (uid) => {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const matchList = [];

      querySnapshot.forEach((doc) => {
        matchList.push(doc.data());
      });

      matchList.sort((a, b) => b.score - a.score); // Highest score first
      setMatches(matchList.slice(0, MAX_MATCHES_DISPLAYED));
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const userList = [];

      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });

      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSelectedUserMatches = async (userId) => {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const matchList = [];

      querySnapshot.forEach((doc) => {
        matchList.push(doc.data());
      });

      matchList.sort((a, b) => b.score - a.score);
      setSelectedUserMatches(matchList);
    } catch (error) {
      console.error('Error fetching selected user matches:', error);
    }
  };

  const handleToggleContact = (matchId) => {
    setShowContactInfo((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  const handleSearchSelect = (userId) => {
    setSelectedUserId(userId);
    fetchSelectedUserMatches(userId);
  };

  return (
    <div className="matches-page">
      <h2>Matches</h2>

      {userRole === 'admin' && (
        <div className="admin-search">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="user-list">
            {users
              .filter((user) =>
                `${user.firstName} ${user.lastName} ${user.email}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <div
                  key={user.id}
                  className="user-card"
                  onClick={() => handleSearchSelect(user.id)}
                >
                  {user.firstName} {user.lastName}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="match-list">
        {(userRole === 'admin' && selectedUserId ? selectedUserMatches : matches).map((match, idx) => (
          <div key={idx} className="match-card">
            <div className="match-name">{match.matchName}</div>
            <button onClick={() => handleToggleContact(match.matchId)}>
              {showContactInfo[match.matchId] ? 'Hide Contact' : 'View Contact'}
            </button>
            {showContactInfo[match.matchId] && (
              <div className="contact-info">
                {match.contactInfo || 'No contact info shared'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fab-button" onClick={() => navigate('/add')}>
        <FaPlus />
      </button>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div onClick={() => navigate('/home')}>
          <FaHome />
          <div className="nav-label">Home</div>
        </div>
        <div onClick={() => navigate('/matches')}>
          <FaHeart />
          <div className="nav-label">Matches</div>
        </div>
        <div onClick={() => navigate('/profile')}>
          <FaUser />
          <div className="nav-label">Profile</div>
        </div>
        <div onClick={() => navigate('/settings')}>
          <FaCog />
          <div className="nav-label">Settings</div>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
