import React, { useState, useEffect, useContext } from 'react';
import './Matches.css';
import { AuthContext } from '../context/AuthContext';
import { fetchMatches, fetchAllProfiles, fetchUserMatches } from '../services/matchService';

const Matches = () => {
  const { user, userRole } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllProfiles().then(setAllUsers);
    } else {
      fetchMatches(user.uid).then(setMatches);
    }
  }, [user, userRole]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredUsers = allUsers.filter((u) =>
    [u.username, u.firstName, u.lastName, u.email].some(field =>
      field?.toLowerCase().includes(searchTerm)
    )
  );

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserMatches(user.id).then(setMatches);
  };

  const renderContactInfo = (person) => {
    const { showEmail, showPhone } = person.settings || {};
    return (
      <div className="contact-info">
        {showEmail && <p>Email: {person.email}</p>}
        {showPhone && <p>Phone: {person.phone}</p>}
      </div>
    );
  };

  return (
    <div className="matches-page">
      {userRole === 'admin' ? (
        <div className="admin-view">
          <input
            type="text"
            placeholder="Search by name, username, email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-bar"
          />
          <div className="user-list">
            {filteredUsers.map((u) => (
              <div key={u.id} onClick={() => handleSelectUser(u)} className="user-card">
                {u.firstName} {u.lastName}
              </div>
            ))}
          </div>

          {selectedUser && (
            <div className="admin-match-view">
              <div className="user-profile left">
                <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                {renderContactInfo(selectedUser)}
              </div>
              <div className="matches right">
                {matches.map((m) => (
                  <div key={m.id} className="match-card">
                    <h4>{m.firstName} {m.lastName}</h4>
                    {renderContactInfo(m)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="regular-view">
          <h2>Your Matches</h2>
          <div className="match-list">
            {matches.slice(0, 10).map((match, index) => (
              <div key={match.id} className="match-card">
                <h4>{index + 1}. {match.firstName} {match.lastName}</h4>
                {renderContactInfo(match)}
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="bottom-nav">
        <div className="icon-with-label">
          <span>🏠</span>
          <small>Home</small>
        </div>
        <div className="icon-with-label">
          <span>💬</span>
          <small>Matches</small>
        </div>
        <div className="icon-with-label">
          <span>⚙️</span>
          <small>Settings</small>
        </div>
      </footer>
    </div>
  );
};

export default Matches;
