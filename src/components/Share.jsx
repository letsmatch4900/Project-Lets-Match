import React from "react";
import { useNavigate } from "react-router-dom";
import { FaLink, FaWhatsapp, FaShareAlt } from "react-icons/fa";
import "./Share.css"; 

const Share = () => {
  const navigate = useNavigate();
  const appUrl = "https://lets-match-10e18.web.app/"; 

  // Native Web Share API
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "Let's Match!",
        text: "Check out this awesome matching app!",
        url: appUrl,
      });
    } catch (err) {
      console.log("Native share failed:", err);
    }
  };

  // Copy link fallback
  const copyToClipboard = () => {
    navigator.clipboard.writeText(appUrl);
    alert("Link copied to clipboard!");
  };

  // Specific app sharing 
  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=Check%20out%20Let's%20Match!%20${appUrl}`);
  };

  return (
    <div className="share-container">
      <div className="share-header">
        <h1>Share the App</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          Dashboard
        </button>
      </div>

      <div className="share-content">
        <p>Invite friends to join Let's Match!</p>

        {/* Native Share Button */}
        {navigator.share && (
          <button onClick={handleNativeShare} className="share-button native-share">
            <FaShareAlt /> Share via Device
          </button>
        )}

        {/* Fallback Options */}
        <div className="fallback-options">
          <button onClick={copyToClipboard} className="share-button">
            <FaLink /> Copy Link
          </button>
          
          <button onClick={shareViaWhatsApp} className="share-button">
            <FaWhatsapp /> Share via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default Share;