import React from "react";
import "./Map.css";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";  // Add this import
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
// 1. Import L from Leaflet
import L from "leaflet";

// 2. Define the custom icon
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
  return (
    <div className="full-map-container">
      <button className="back-button2" onClick={() => navigate('/profile')}>
        &#60; Back
      </button>

      <MapContainer
        center={[43.788991157897776, -79.19059949394783]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
  );
}

export default Map;
