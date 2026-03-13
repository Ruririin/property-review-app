/**
 * User Activity Service - Tracks who is working on which property reviews
 * This provides an event listener system for real-time user activity tracking
 */

class UserActivityService {
  constructor() {
    this.activities = new Map(); // projectId -> { user, timestamp, projectName }
    this.listeners = new Set();
    this.heartbeatInterval = null;
    
    this.loadActivities();
    
    this.startHeartbeat();
    
    // Clean up stale activities when page loads
    this.cleanStaleActivities();
  }

  /**
   * Mark a user as actively working on a project
   */
  startWorking(user, projectId, projectName = '') {
    const activity = {
      user,
      projectId,
      projectName,
      timestamp: Date.now(),
      status: 'working'
    };
    
    this.activities.set(projectId, activity);
    this.saveActivities();
    this.notifyListeners('userStartedWorking', activity);
    
    // console.log(`${user} started working on project: ${projectName || projectId}`);
  }

  /**
   * Mark a user as no longer working on a project
   */
  stopWorking(user, projectId) {
    const activity = this.activities.get(projectId);
    if (activity && activity.user === user) {
      this.activities.delete(projectId);
      this.saveActivities();
      this.notifyListeners('userStoppedWorking', { user, projectId });
      
      // console.log(`${user} stopped working on project: ${projectId}`);
    }
  }

  /**
   * Get all current active users and what they're working on
   */
  getActiveUsers() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    const activeUsers = [];
    for (const [projectId, activity] of this.activities) {
      if (now - activity.timestamp < maxAge) {
        activeUsers.push({
          user: activity.user,
          projectId,
          projectName: activity.projectName,
          timestamp: activity.timestamp,
          timeAgo: this.getTimeAgo(activity.timestamp)
        });
      }
    }
    
    return activeUsers;
  }

  /**
   * Check if a specific project is currently being worked on
   */
  isProjectActive(projectId) {
    const activity = this.activities.get(projectId);
    if (!activity) return false;
    
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return (now - activity.timestamp) < maxAge;
  }

  /**
   * Get who is currently working on a specific project
   */
  getProjectWorker(projectId) {
    const activity = this.activities.get(projectId);
    if (!activity) return null;
    
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if ((now - activity.timestamp) < maxAge) {
      return {
        user: activity.user,
        timeAgo: this.getTimeAgo(activity.timestamp)
      };
    }
    
    return null;
  }

  /**
   * Add an event listener for user activity changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update heartbeat for a user's activity
   */
  updateHeartbeat(user, projectId) {
    const activity = this.activities.get(projectId);
    if (activity && activity.user === user) {
      activity.timestamp = Date.now();
      this.saveActivities();
    }
  }

  /**
   * Private: Notify all listeners of activity changes
   */
  notifyListeners(event, data) {
    for (const callback of this.listeners) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in user activity listener:', error);
      }
    }
  }

  /**
   * Private: Load activities from localStorage
   */
  loadActivities() {
    try {
      const stored = localStorage.getItem('userActivities');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.activities = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading user activities:', error);
      this.activities = new Map();
    }
  }

  /**
   * Private: Save activities to localStorage
   */
  saveActivities() {
    try {
      const obj = Object.fromEntries(this.activities);
      localStorage.setItem('userActivities', JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving user activities:', error);
    }
  }

  /**
   * Private: Clean up stale activities (older than 5 minutes)
   */
  cleanStaleActivities() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [projectId, activity] of this.activities) {
      if (now - activity.timestamp > maxAge) {
        this.activities.delete(projectId);
      }
    }
    
    this.saveActivities();
  }

  /**
   * Private: Start heartbeat to periodically clean stale activities
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.cleanStaleActivities();
      this.notifyListeners('activitiesUpdated', this.getActiveUsers());
    }, 30000); // Every 30 seconds
  }

  /**
   * Private: Get human-readable time ago
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }

  /**
   * Clean up service (call when app unmounts)
   */
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.listeners.clear();
  }
}

const userActivityService = new UserActivityService();

export default userActivityService;