import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import App from "./App.jsx";
import Profile from "./Profile.jsx";
import LoginPage from "./LoginPage.jsx";
import Map from "./Map.jsx";
import TrashRecorder from "./camera.jsx"; // Add this import
import "./index.css";

// 🔹 Handles routing and protects routes
function RootRoutes() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={isAuthenticated ? <App /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/map"
        element={isAuthenticated ? <Map /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/camera"
        element={isAuthenticated ? <TrashRecorder /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// 🔹 Auth0 credentials
const domain = "dev-kipzv7bwrxcpd61d.us.auth0.com";
const clientId = "Hcsgl2jxlvR7LbvDHyyGU4Wpw6758UJx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{ redirect_uri: window.location.origin + "/app" }}
      >
        <RootRoutes />
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);