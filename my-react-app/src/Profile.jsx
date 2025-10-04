import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './profile.css';


function App() {

  const navigate = useNavigate();

  const avatarOptions = [
    '/avatar1.jpeg',
    '/avatar2.jpeg',
    '/avatar3.jpeg',
  ];

  const [user, setUser] = useState({
    name: 'Samuel',
    avatar: '/avatar1.jpeg',
    trashCollected: 128, // Used for level
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const pixelFrames = [
    '/pixel1.png',
    '/pixel2.png',
    '/pixel3.png',
  ];

  // Pixel animation loop
  useState(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % pixelFrames.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAvatarClick = () => setDropdownOpen(!dropdownOpen);

  const handleAvatarChange = (newAvatar) => {
    setUser({ ...user, avatar: newAvatar });
    setDropdownOpen(false);
  };

  const handleBack = () => {
    navigate('/');  // This will redirect to the home page
  };

  const maxTrash = 200; // max for level bar
  const levelPercentage = Math.min((user.trashCollected / maxTrash) * 100, 100);

  return (
    <div className="app-container">
      <div className="phone-frame">
        <button className="back-button" onClick={handleBack}>
          &#60; Back
        </button>

        {/* Top-right profile */}
        <div className="top-right-avatar">
          <img
            src={user.avatar}
            alt="Profile"
            className="profile-avatar"
            onClick={handleAvatarClick}
          />
          {dropdownOpen && (
            <div className="avatar-dropdown">
              {avatarOptions.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="avatar option"
                  className="avatar-option"
                  onClick={() => handleAvatarChange(img)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pixel character */}
        <div className="character-container">
          <img
            src={pixelFrames[currentFrame]}
            alt="Pixel Character"
            className="pixel-character"
          />

          <div className="character-name">Samuel</div>
        </div>
        

        {/* Level bar */}
        <div className="level-container">
          <p className="level-text">Level Progress: 1</p>
          <div className="level-bar">
            <div
              className="level-fill"
              style={{ width: `${levelPercentage}%` }}
            ></div>
          </div>
          <p className="level-value">{user.trashCollected} / {maxTrash} kg</p>
        </div>

        <div className="widget-container">
        <h3 className="widget-title">Distribution of Trash</h3>
        <div className="widget-bar">
          <span>Compost</span>
          <div className="bar-background">
            <div className="bar-fill compost" style={{ width: '50%' }}></div>
          </div>
        </div>

        <div className="widget-bar">
          <span>Recycle</span>
          <div className="bar-background">
            <div className="bar-fill recycle" style={{ width: '30%' }}></div>
          </div>
        </div>

        <div className="widget-bar">
          <span>Trash</span>
          <div className="bar-background">
            <div className="bar-fill trash" style={{ width: '20%' }}></div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}

export default App;
