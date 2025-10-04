import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, Navigate } from 'react-router-dom';
import './Login.css';

export default function LoginPage() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();
  const navigate = useNavigate();

  if (isLoading) return <div>Loading...</div>;

  const handleLogin = async () => {
    await loginWithRedirect();
  };

  return (
    <div className="login-page">
      {!isAuthenticated ? (
        <div className="login-container">
          <h1 className="welcome-text">Welcome to</h1>
          <h1 className="welcome-text">EcoScav! 🌍</h1>
          <button className="login-button" onClick={handleLogin}>Log In</button>
        </div>
      ) : (
        <Navigate to="/app" replace />
      )}
    </div>
  );
}