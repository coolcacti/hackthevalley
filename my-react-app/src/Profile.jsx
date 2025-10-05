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

  const [dbUser, setDbUser] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const pixelFrames = ["/pixel1.png", "/pixel2.png", "/pixel3.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % pixelFrames.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchDbUser() {
      if (!user?.sub) return;
      try {
        const res = await fetch('http://localhost:5000/api/users');
        const users = await res.json();
        const found = users.find(u => u.userAuth0Id === user.sub);
        setDbUser(found);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    fetchDbUser();
  }, [user]);

  const handleBack = () => {
    navigate("/app");
  };

  const totalItems = dbUser?.totalItemsCollected ?? 0;
  const level = Math.floor(Math.log2(totalItems + 1));
  const nextLevelThreshold = Math.pow(2, level + 1) - 1;
  const levelPercentage = Math.min(
    (totalItems / nextLevelThreshold) * 100,
    100
  );

  const compost = dbUser?.compost ?? 0;
  const recycle = dbUser?.recycle ?? 0;
  const trash = dbUser?.trash ?? 0;
  const totalDist = compost + recycle + trash || 1;
  const compostPercent = ((compost / totalDist) * 100).toFixed(0);
  const recyclePercent = ((recycle / totalDist) * 100).toFixed(0);
  const trashPercent = ((trash / totalDist) * 100).toFixed(0);

  const locations = (dbUser?.locations ?? []).filter(loc => loc.successfulDeposit);
  const mapCenter = locations.length
    ? [locations[0].latitude, locations[0].longitude]
    : [43.788991157897776, -79.19059949394783];

  return (
    <div className="app-container">
      <div className="phone-frame">
        <button className="back-button" onClick={handleBack}>
          &#60; Back
        </button>

        <div className="top-right-avatar">
          <img
            src={dbUser?.picture || "/avatar1.jpeg"}
            alt="Profile"
            className="profile-avatar"
          />
        </div>

        <div className="character-container">
          <div className="character-name">{dbUser?.username || user?.name || "User"}</div>
          <img
            src={pixelFrames[currentFrame]}
            alt="Pixel Character"
            className="pixel-character"
          />
        </div>

        <div className="level-container">
          <p className="level-text">Level {level}</p>
          <div className="level-bar">
            <div
              className="level-fill"
              style={{ width: `${levelPercentage}%` }}
            ></div>
          </div>
          <p className="level-value">
            {totalItems} / {nextLevelThreshold} items
          </p>
        </div>

        <div className="widget-container">
          <h3 className="widget-title">Distribution of Trash</h3>
          <div className="widget-bar">
            <span>Compost</span>
            <div className="bar-background">
              <div className="bar-fill compost" style={{ width: `${compostPercent}%` }}></div>
            </div>
            <span className="bar-value">{compost}</span>
          </div>
          <div className="widget-bar">
            <span>Recycle</span>
            <div className="bar-background">
              <div className="bar-fill recycle" style={{ width: `${recyclePercent}%` }}></div>
            </div>
            <span className="bar-value">{recycle}</span>
          </div>
          <div className="widget-bar">
            <span>Trash</span>
            <div className="bar-background">
              <div className="bar-fill trash" style={{ width: `${trashPercent}%` }}></div>
            </div>
            <span className="bar-value">{trash}</span>
          </div>
        </div>

        <div
          className="map-preview-container"
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: '20px auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 1,
          }}
          onClick={() => navigate('/map')}
        >
          <MapContainer
            center={mapCenter}
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
            {locations.map((loc, idx) => (
              <Marker
                key={idx}
                position={[loc.latitude, loc.longitude]}
                icon={redIcon}
              >
                <Popup>
                  {`Collected at ${new Date(loc.timestamp).toLocaleString()}`}
                </Popup>
              </Marker>
            ))}
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