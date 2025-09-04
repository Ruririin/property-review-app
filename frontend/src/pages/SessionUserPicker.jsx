import { useState, useEffect } from "react";
import "./css/SessionUserPicker.css";
import authService from "../services/authService";

export default function SessionUserPicker({ onUserSelected }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [customName, setCustomName] = useState("");
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);

  // Load recent users from backend on component mount
  useEffect(() => {
    const loadRecentUsers = async () => {
      try {
        const sessionStatus = await authService.getSessionStatus();
        const users = sessionStatus.recent_users || [];
        setRecentUsers(users);
        // If no recent users, default to custom input mode
        if (users.length === 0) {
          setIsCustomInput(true);
        }
      } catch (error) {
        console.error('Failed to load recent users:', error);
        // Default to custom input mode on error
        setIsCustomInput(true);
      }
    };

    loadRecentUsers();
  }, []);

  const handleUserSelection = async () => {
    const userName = isCustomInput ? customName.trim() : selectedUser;
    
    if (!userName) {
      return;
    }

    // The backend will handle adding to recent users
    await onUserSelected(userName);
  };

  const handleQuickSelect = async (userName) => {
    setSelectedUser(userName);
    setIsCustomInput(false);
    await onUserSelected(userName);
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