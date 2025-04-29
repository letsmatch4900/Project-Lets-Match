import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userData);
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Available Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <Link to={`/profile/${user.id}`}>
              {/* Show username instead of just "View Profile" */}
              {user.nickName ? user.nickName : "Unknown User"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
