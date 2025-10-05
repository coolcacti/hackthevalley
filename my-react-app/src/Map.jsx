import React, { useEffect, useState } from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

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

function Map() {
  const navigate = useNavigate();
  const [allLocations, setAllLocations] = useState([]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("http://localhost:5000/api/users");
        const users = await res.json();
        const locations = users
          .flatMap(user =>
            (user.locations ?? []).filter(loc => loc.successfulDeposit)
              .map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                timestamp: loc.timestamp,
                username: user.username,
                picture: user.picture
              }))
          );
        setAllLocations(locations);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    }
    fetchLocations();
  }, []);

  const mapCenter = allLocations.length
    ? [allLocations[0].latitude, allLocations[0].longitude]
    : [43.788991157897776, -79.19059949394783];

  return (
    <div className="full-map-container">
      <button className="back-button2" onClick={() => navigate('/profile')}>
        &#60; Back
      </button>

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allLocations.map((loc, idx) => (
          <Marker
            key={idx}
            position={[loc.latitude, loc.longitude]}
            icon={redIcon}
          >
            <Popup>
              <div>
                <img
                  src={loc.picture || "/avatar1.jpeg"}
                  alt={loc.username}
                  style={{ width: 32, height: 32, borderRadius: "50%" }}
                />
                <div><strong>{loc.username}</strong></div>
                <div>{`Collected at ${new Date(loc.timestamp).toLocaleString()}`}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;