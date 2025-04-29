import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";

const UserProfile = () => {
  const { userId } = useParams(); // Gets ID from URL
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const userDocRef = doc(db, "users", userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setContactInfo(userData.contactInfo || {});
      } else {
        console.error("No such user!");
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (!contactInfo) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h1>User Contact Information</h1>

      {/* Only show if user allowed sharing */}
      {contactInfo.email?.share && (
        <p><strong>Email:</strong> {contactInfo.email.value}</p>
      )}

      {contactInfo.phone?.share && (
        <p><strong>Phone:</strong> {contactInfo.phone.value}</p>
      )}

      {contactInfo.whatsapp?.share && (
        <p><strong>WhatsApp:</strong> {contactInfo.whatsapp.value}</p>
      )}
    </div>
  );
};

export default UserProfile;
