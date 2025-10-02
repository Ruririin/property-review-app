/**
 * Utility to clear all project-related data from browser storage
 * Run this in browser console to clean up invalid project IDs
 */

window.clearAllProjectData = function() {
  console.log('🧹 Clearing all project data from browser storage...');

  // Clear session storage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('project') || key.includes('Project') || key.includes('lastSaved')) {
      sessionStorage.removeItem(key);
      console.log('🗑️ Removed from sessionStorage:', key);
    }
  });

  // Clear local storage - be more aggressive
  const localKeys = Object.keys(localStorage);
  localKeys.forEach(key => {
    if (key.includes('project') || key.includes('Project') || key.includes('property_review') ||
        key.includes('currentProjectId') || key.includes('savedProjects') || key.includes('projectsCache')) {
      localStorage.removeItem(key);
      console.log('🗑️ Removed from localStorage:', key);
    }
  });

  // Clear URL parameters
  if (window.location.search.includes('project')) {
    window.history.replaceState({}, '', '/editor');
    console.log('🗑️ Cleared URL parameters');
  }

  console.log('✅ All project data cleared from browser storage');
  console.log('🔄 Please refresh the page to start fresh');
};

// Add function to clear just the problematic current project ID
window.clearCurrentProjectId = function() {
  console.log('🧹 Clearing current project ID references...');

  // Clear specific problematic keys
  localStorage.removeItem('currentProjectId');
  sessionStorage.removeItem('lastSavedProject');

  console.log('✅ Current project ID references cleared');
  console.log('🔄 Please refresh the page');
};

// Auto-run on load
if (typeof window !== 'undefined') {
  console.log('🧪 Project cleanup utility loaded. Run clearAllProjectData() in console to clear invalid project data.');
}
