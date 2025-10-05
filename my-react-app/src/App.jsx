import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import './App.css';
import SyncUser from './components/SyncUser';

function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();

  const fullName = user?.name || 'User';
  const firstName = fullName.split(' ')[0];

  const goToProfile = () => navigate('/profile');
  const goToCamera = () => navigate('/camera');

  const [leaderboardUsers, setLeaderboardUsers] = useState([]);

  const fetchUsersOnce = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      const sorted = data.sort((a, b) => b.totalItemsCollected - a.totalItemsCollected);
      setLeaderboardUsers(sorted);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsersOnce();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("http://localhost:5000/api/users");
        const data = await res.json();
        const sorted = data.sort((a, b) => b.totalItemsCollected - a.totalItemsCollected);
        setLeaderboardUsers(sorted);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    }

    fetchUsers();

    const handleUserSynced = (e) => {
      console.log("User synced event:", e.detail);
      fetchUsers();
    };

    window.addEventListener("userSynced", handleUserSynced);
    return () => window.removeEventListener("userSynced", handleUserSynced);
  }, []);

  useEffect(() => {
    const onUserSynced = async (ev) => {
      console.log("User synced event:", ev.detail);
      await fetchUsersOnce();
    };

    window.addEventListener("userSynced", onUserSynced);
    return () => window.removeEventListener("userSynced", onUserSynced);
  }, []);

  const dbUser = leaderboardUsers.find(
    (u) => u.userAuth0Id === user?.sub
  );

  return (
    <div className='main-container'>
      <SyncUser />
      <nav className="navbar">
        <div className="nav-text">
          Hey {firstName}!
        </div>
        <div>
          <img
            src={dbUser?.picture || "/avatar1.jpeg"}
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
          <p className="info-number">{dbUser?.totalItemsCollected ?? 0}</p>
        </div>
      </div>

      <button className="scan-button" onClick={goToCamera}> 📸‎ ‎ Submit Item</button>

      <div className="leaderboard">
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">Leaderboard</h2>
        </div>

        {leaderboardUsers.map((user, index) => (
          <div className="leaderboard-item" key={user._id || index}>
            <div className="leaderboard-rank">{index + 1}</div>
            <img src={user.picture || "/avatar1.jpeg"} alt={user.username} className="leaderboard-avatar" />
            <div className="leaderboard-info">
              <span className="leaderboard-name">{user.username}</span>
              <span className="leaderboard-score">{user.totalItemsCollected} pts</span>
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