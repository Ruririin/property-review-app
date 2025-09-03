/**
 * Field Activity Service - Tracks which users are editing specific fields in real-time
 */

class FieldActivityService {
  constructor() {
    this.fieldActivities = new Map(); // fieldId -> { user, fieldName }
    this.listeners = new Set();
    
    // Set up BroadcastChannel for cross-tab communication
    this.broadcastChannel = new BroadcastChannel('fieldActivity');
    this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
    };
    
    // Load existing activities from localStorage
    this.loadActivities();
  }

  /**
   * Mark a user as actively editing a specific field
   */
  startEditingField(user, fieldId, fieldName) {
    // First, stop the user from editing any other fields (one field per user limit)
    this.stopAllFieldsForUser(user);
    
    const activity = {
      user,
      fieldId,
      fieldName,
      status: 'editing'
    };
    
    this.fieldActivities.set(fieldId, activity);
    this.saveActivities();
    this.notifyListeners('fieldEditingStarted', activity);
    
    // console.log(`🏷️ Field activity started: ${fieldId} by ${user} (${fieldName})`);
    
    // Broadcast to other tabs
    this.broadcastChannel.postMessage({
      type: 'fieldEditingStarted',
      data: activity
    });
  }

  /**
   * Stop a user from editing all fields (enforce one field per user)
   */
  stopAllFieldsForUser(user) {
    const fieldsToRemove = [];
    
    for (const [fieldId, activity] of this.fieldActivities) {
      if (activity.user === user) {
        fieldsToRemove.push(fieldId);
      }
    }
    
    fieldsToRemove.forEach(fieldId => {
      this.fieldActivities.delete(fieldId);
      this.notifyListeners('fieldEditingStopped', { user, fieldId });
    });
    
    if (fieldsToRemove.length > 0) {
      this.saveActivities();
    }
  }

  /**
   * Update heartbeat for a user's field editing activity (no longer needed but kept for compatibility)
   */
  updateFieldHeartbeat(user, fieldId) {
    // This method is kept for backward compatibility but no longer does anything
    // since we removed time-based expiration
  }

  /**
   * Mark a user as no longer editing a specific field
   */
  stopEditingField(user, fieldId) {
    const activity = this.fieldActivities.get(fieldId);
    if (activity && activity.user === user) {
      this.fieldActivities.delete(fieldId);
      this.saveActivities();
      this.notifyListeners('fieldEditingStopped', { user, fieldId });
      
      // console.log(`🏷️ Field activity stopped: ${fieldId} by ${user}`);
      
      // Broadcast to other tabs
      this.broadcastChannel.postMessage({
        type: 'fieldEditingStopped',
        data: { user, fieldId }
      });
    }
  }

  /**
   * Get all current field editing activities
   */
  getFieldActivities() {
    const activeFields = [];
    for (const [fieldId, activity] of this.fieldActivities) {
      activeFields.push({
        fieldId,
        user: activity.user,
        fieldName: activity.fieldName
      });
    }
    
    return activeFields;
  }

  /**
   * Get who is currently editing a specific field
   */
  getFieldEditor(fieldId) {
    const activity = this.fieldActivities.get(fieldId);
    if (!activity) return null;
    
    return {
      user: activity.user,
      fieldName: activity.fieldName
    };
  }

  /**
   * Get all fields currently being edited by any user
   */
  getActiveFieldsByUser() {
    const activities = this.getFieldActivities();
    const userFields = new Map();
    
    activities.forEach(activity => {
      if (!userFields.has(activity.user)) {
        userFields.set(activity.user, []);
      }
      userFields.get(activity.user).push({
        fieldId: activity.fieldId,
        fieldName: activity.fieldName
      });
    });
    
    return userFields;
  }

  /**
   * Handle broadcast messages from other tabs
   */
  handleBroadcastMessage(message) {
    const { type, data } = message;
    
    if (type === 'fieldEditingStarted') {
      this.fieldActivities.set(data.fieldId, data);
      this.notifyListeners('fieldEditingStarted', data);
    } else if (type === 'fieldEditingStopped') {
      this.fieldActivities.delete(data.fieldId);
      this.notifyListeners('fieldEditingStopped', data);
    }
  }

  /**
   * Add an event listener for field activity changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }


  /**
   * Private: Notify all listeners of activity changes
   */
  notifyListeners(event, data) {
    for (const callback of this.listeners) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in field activity listener:', error);
      }
    }
  }

  /**
   * Private: Load activities from localStorage
   */
  loadActivities() {
    try {
      const stored = localStorage.getItem('fieldActivities');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.fieldActivities = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading field activities:', error);
      this.fieldActivities = new Map();
    }
  }

  /**
   * Private: Save activities to localStorage
   */
  saveActivities() {
    try {
      const obj = Object.fromEntries(this.fieldActivities);
      localStorage.setItem('fieldActivities', JSON.stringify(obj));
      
      // Also trigger a custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('fieldActivitiesChanged', {
        detail: { activities: obj }
      }));
    } catch (error) {
      console.error('Error saving field activities:', error);
    }
  }


  /**
   * Clean up service (call when app unmounts)
   */
  destroy() {
    this.listeners.clear();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}

// Create singleton instance
const fieldActivityService = new FieldActivityService();

export default fieldActivityService;