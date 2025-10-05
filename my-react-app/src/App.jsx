import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';
import SyncUser from './components/SyncUser';

function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();

  const fullName = user?.name || 'User';
  const firstName = fullName.split(' ')[0];

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToCamera = () => {
    navigate('/camera');
  };

  // Mock leaderboard data
  const leaderboardUsers = [
    { name: "Luna Green", img: "/avatar.png", score: 240 },
    { name: "EcoHero99", img: "/avatar.png", score: 220 },
    { name: "ForestFan", img: "/avatar.png", score: 200 },
    { name: "RecycleQueen", img: "/avatar.png", score: 180 },
    { name: "NatureNinja", img: "/avatar.png", score: 160 },
    { name: "PlanetPal", img: "/avatar.png", score: 150 },
  ];

  return (
    <div className='main-container'>
      <SyncUser />
      <nav className="navbar">
        <div className="nav-text">
          Hey {firstName}!
        </div>
        <div>
          <img 
            src="/avatar1.jpeg" 
            alt="pfp" 
            className="nav-avatar"
            onClick={goToProfile}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </nav>

      <div className="info-container">
        <div className="info-box2">
          <img src="/globe.gif" alt="description" className="info-image"/>
        </div>
        <div className="info-box">
          <p className="info-title">Items found:</p>
          <p className="info-number">150</p>
        </div>
      </div>

      <button className="scan-button" onClick={goToCamera}> 📸‎ ‎ Submit Item</button>

      <div className="leaderboard">
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">Leaderboard</h2>
        </div>

        {leaderboardUsers.map((user, index) => (
          <div className="leaderboard-item" key={index}>
            <div className="leaderboard-rank">{index + 1}</div>
            <img src={user.img} alt={user.name} className="leaderboard-avatar"/>
            <div className="leaderboard-info">
              <span className="leaderboard-name">{user.name}</span>
              <span className="leaderboard-score">{user.score} pts</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="footer">
        made for all the eco-adventurers 🌍
      </footer>
    </div>
  );
}

export default App;
