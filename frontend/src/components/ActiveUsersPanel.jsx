import { useState, useEffect } from 'react';
import userActivityService from '../services/userActivityService';

export default function ActiveUsersPanel() {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    // Initial load
    setActiveUsers(userActivityService.getActiveUsers());

    // Subscribe to activity updates
    const unsubscribe = userActivityService.addListener((event, data) => {
      setActiveUsers(userActivityService.getActiveUsers());
    });

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      setActiveUsers(userActivityService.getActiveUsers());
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (activeUsers.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0 d-flex align-items-center">
            <span className="badge bg-secondary rounded-pill me-2">0</span>
            Active Users
          </h6>
        </div>
        <div className="card-body text-center text-muted py-4">
          <i className="bi bi-people fs-1 mb-2" style={{ color: "#198754" }}></i>
          <p className="mb-0">No users currently working on projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light">
        <h6 className="mb-0 d-flex align-items-center">
          <span className="badge bg-success rounded-pill me-2">{activeUsers.length}</span>
          Active Users
        </h6>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {activeUsers.map((activity, index) => (
            <div key={`${activity.user}-${activity.projectId}`} className="list-group-item">
              <div className="d-flex align-items-center">
                {/* User Avatar */}
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                  style={{ 
                    width: "32px", 
                    height: "32px", 
                    backgroundColor: getUserColor(activity.user),
                    fontSize: "12px"
                  }}
                >
                  {activity.user.charAt(0).toUpperCase()}
                </div>
                
                {/* User Info */}
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-0 fw-semibold">{activity.user}</h6>
                      <p className="mb-0 text-muted small">
                        Working on: <strong>{activity.projectName || activity.projectId}</strong>
                      </p>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success rounded-pill">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px', color: 'white' }}></i>
                        Active
                      </span>
                      <div className="text-muted small mt-1">
                        {activity.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getUserColor(username) {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}