// src/profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./profile.css";

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();

  const fullName = user?.name || 'User';

  const avatarOptions = ["/avatar1.jpeg", "/avatar2.jpeg", "/avatar3.jpeg"];

  const [profileUser, setProfileUser] = useState({
    name: fullName,
    avatar: "/avatar1.jpeg",
    trashCollected: 128,
  });

  const [currentFrame, setCurrentFrame] = useState(0);
  const pixelFrames = ["/pixel1.png", "/pixel2.png", "/pixel3.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % pixelFrames.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate("/app");
  };

  const maxTrash = 200;
  const levelPercentage = Math.min(
    (profileUser.trashCollected / maxTrash) * 100,
    100
  );

  const goToMap = () => {
    navigate('/map');
  };

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

        <div
          className="map-preview-container"
          style={{
            width: '100%',
            maxWidth: '400px',
            margin: '20px auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 1,
          }}
          onClick={goToMap}
        >
          <MapContainer
            center={[43.788991157897776, -79.19059949394783]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '180px' }}
            dragging={false}
            doubleClickZoom={false}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              attribution=""
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[43.78754535704544, -79.19009374471229]}
              icon={redIcon}
            >
              <Popup>You collected a trash item here!</Popup>
            </Marker>
          </MapContainer>
        </div>

        <span
          className="logout-button"
          onClick={() => logout({ returnTo: window.location.origin })}
          style={{ margin: '20px auto', display: 'block', cursor: 'pointer' }}
        >
          Log Out
        </span>
      </div>
    </div>
  );
}

export default Profile;
