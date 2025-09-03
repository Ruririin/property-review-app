import { useState, useEffect } from "react";
import "./css/SessionUserPicker.css";

export default function SessionUserPicker({ onUserSelected }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [customName, setCustomName] = useState("");
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);

  // Load recent users from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem("recentUsers");
    if (stored) {
      const users = JSON.parse(stored);
      setRecentUsers(users);
      // If no recent users, default to custom input mode
      if (users.length === 0) {
        setIsCustomInput(true);
      }
    } else {
      // No stored users, default to custom input mode
      setIsCustomInput(true);
    }
  }, []);

  const handleUserSelection = () => {
    const userName = isCustomInput ? customName.trim() : selectedUser;
    
    if (!userName) {
      return;
    }

    // Add to recent users if it's a new name
    let updatedRecent = [...recentUsers];
    if (!updatedRecent.includes(userName)) {
      updatedRecent = [userName, ...updatedRecent.slice(0, 9)]; // Keep max 10 recent users
      setRecentUsers(updatedRecent);
      localStorage.setItem("recentUsers", JSON.stringify(updatedRecent));
    }

    // Set session user and notify parent (use sessionStorage for tab-specific sessions)
    sessionStorage.setItem("sessionUser", userName);
    onUserSelected(userName);
  };

  const handleQuickSelect = (userName) => {
    setSelectedUser(userName);
    setIsCustomInput(false);
    sessionStorage.setItem("sessionUser", userName);
    onUserSelected(userName);
  };

  return (
    <div className="session-picker-container">
      <div className="session-picker-card">
        {/* Header */}
        <div className="session-header">
          <div className="logo-container">
            <img
              src="/NeitClemLogo.png"
              alt="NeitClem Logo"
              className="session-logo"
            />
          </div>
          <h2 className="session-title">Property Review Session</h2>
          <p className="session-subtitle">Select or enter your name to start working</p>
        </div>

        {/* Recent Users */}
        {recentUsers.length > 0 && (
          <div className="recent-users-section">
            <h3 className="recent-users-title">Recent Users</h3>
            <div className="recent-users-grid">
              {recentUsers.map((user, index) => (
                <button
                  key={index}
                  className="user-button"
                  onClick={() => handleQuickSelect(user)}
                >
                  <div className="user-avatar">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Input Section */}
        <div className="user-input-section">
          {recentUsers.length > 0 && (
            <div className="input-toggle">
              <button
                className={`toggle-button ${!isCustomInput ? "active" : ""}`}
                onClick={() => setIsCustomInput(false)}
              >
                Select User
              </button>
              <button
                className={`toggle-button ${isCustomInput ? "active" : ""}`}
                onClick={() => setIsCustomInput(true)}
              >
                Enter Name
              </button>
            </div>
          )}

          {!isCustomInput && recentUsers.length > 0 ? (
            <select
              className="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Choose a user...</option>
              {recentUsers.map((user, index) => (
                <option key={index} value={user}>
                  {user}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleUserSelection();
                }
              }}
            />
          )}

          <button
            className="start-session-button"
            onClick={handleUserSelection}
            disabled={isCustomInput ? !customName.trim() : !selectedUser}
          >
            Start Session
          </button>
        </div>

        {/* Info Section */}
        <div className="session-info">
          <p className="info-text">
            <strong>Session Mode:</strong> Your name will be tracked while working on property reviews. 
            Others can see who's actively working on which projects.
          </p>
        </div>
      </div>
    </div>
  );
}