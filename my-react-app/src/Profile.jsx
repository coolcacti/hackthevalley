// src/profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();

  // Get the custom username from Auth0 Action
  const username = user?.["https://myapp.example.com/username"] || "User";

  const avatarOptions = ["/avatar1.jpeg", "/avatar2.jpeg", "/avatar3.jpeg"];

  // Local state for profile-specific data
  const [profileUser, setProfileUser] = useState({
    name: username,
    avatar: "/avatar1.jpeg",
    trashCollected: 128,
  });

  const [currentFrame, setCurrentFrame] = useState(0);
  const pixelFrames = ["/pixel1.png", "/pixel2.png", "/pixel3.png"];

  // Pixel animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % pixelFrames.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate("/app"); // redirect to home
  };

  const maxTrash = 200;
  const levelPercentage = Math.min(
    (profileUser.trashCollected / maxTrash) * 100,
    100
  );

  return (
    <div className="app-container">
      <div className="phone-frame">
        <button className="back-button" onClick={handleBack}>
          &#60; Back
        </button>

        <div className="top-right-avatar">
          <img
            src={profileUser.avatar}
            alt="Profile"
            className="profile-avatar"
          />
        </div>

        <div className="character-container">
          <div className="character-name">{profileUser.name}</div>
          <img
            src={pixelFrames[currentFrame]}
            alt="Pixel Character"
            className="pixel-character"
          />
        </div>

        <div className="level-container">
          <p className="level-text">Level 1</p>
          <div className="level-bar">
            <div
              className="level-fill"
              style={{ width: `${levelPercentage}%` }}
            ></div>
          </div>
          <p className="level-value">
            {profileUser.trashCollected} / {maxTrash} kg
          </p>
        </div>

        <div className="widget-container">
          <h3 className="widget-title">Distribution of Trash</h3>
          <div className="widget-bar">
            <span>Compost</span>
            <div className="bar-background">
              <div className="bar-fill compost" style={{ width: "50%" }}></div>
            </div>
          </div>

          <div className="widget-bar">
            <span>Recycle</span>
            <div className="bar-background">
              <div className="bar-fill recycle" style={{ width: "30%" }}></div>
            </div>
          </div>

          <div className="widget-bar">
            <span>Trash</span>
            <div className="bar-background">
              <div className="bar-fill trash" style={{ width: "20%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
