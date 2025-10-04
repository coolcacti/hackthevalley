import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  const goToProfile = () => {
    navigate('/profile')
  }

  return (
    <>
    <nav className="navbar">
      <div className="nav-text">
        Hello Samuel!
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
        <img src="/globe.gif" alt="description" className="info-image"/>
      </div>
      <div className="info-box">
        <p className="info-title">Items found:</p>
        <p className="info-number">150</p>
      </div>
    </div>

    <button className="scan-button"> 📸 Submit Item</button>

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
    
    </>
  )
}

export default App
