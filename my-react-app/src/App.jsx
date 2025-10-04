import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();

  const fullName = user?.name || 'User';
  const firstName = fullName.split(' ')[0];

  const goToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="main-container">
      <nav className="navbar">
        <div className="nav-text">
          Hello {firstName}!
        </div>
        <div>
          <img
            src="/pfp.png"
            alt="pfp"
            className="nav-avatar"
            onClick={goToProfile}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </nav>

      <div className="info-container">
        <div className="info-box2">
          <img src="/globe.gif" alt="description" className="info-image" />
        </div>
        <div className="info-box">
          <p className="info-title">Items found:</p>
          <p className="info-number">150</p>
        </div>
      </div>

      <button className="scan-button"> 📸‎ ‎ Submit Item</button>

      <div className="leaderboard">
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">Leaderboard</h2>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
        <div className="leaderboard-item">
          <div className="leaderboard-avatar"></div>
          <span className="leaderboard-name">user</span>
        </div>
      </div>

      <footer className="footer">
        made for all the eco-adventurers 🌍
      </footer>
    </div>
  );
}

export default App;
