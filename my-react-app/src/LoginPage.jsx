import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function LoginPage() {
  const { loginWithPopup, logout, isAuthenticated, user, isLoading } = useAuth0();
  const navigate = useNavigate();

  if (isLoading) return <div>Loading...</div>;

  const handleLogin = async () => {
    await loginWithPopup(); // opens Auth0 popup
    navigate("/app");       // redirect after login
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
        <div>
          <p>Welcome, {user?.name || 'User'}!</p>
          <button onClick={() => logout({ returnTo: window.location.origin })}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
