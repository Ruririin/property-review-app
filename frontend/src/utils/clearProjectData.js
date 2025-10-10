/**
 * Utility to clear all project-related data from browser storage
 * Run this in browser console to clean up invalid project IDs
 */

window.clearAllProjectData = function() {


  // Clear session storage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('project') || key.includes('Project') || key.includes('lastSaved')) {
      sessionStorage.removeItem(key);

    }
  });

  // Clear local storage - be more aggressive
  const localKeys = Object.keys(localStorage);
  localKeys.forEach(key => {
    if (key.includes('project') || key.includes('Project') || key.includes('property_review') ||
        key.includes('currentProjectId') || key.includes('savedProjects') || key.includes('projectsCache')) {
      localStorage.removeItem(key);

    }
  });

  // Clear URL parameters
  if (window.location.search.includes('project')) {
    window.history.replaceState({}, '', '/editor');

  }


};

// Add function to clear just the problematic current project ID
window.clearCurrentProjectId = function() {


  // Clear specific problematic keys
  localStorage.removeItem('currentProjectId');
  sessionStorage.removeItem('lastSavedProject');


};

// Auto-run on load
if (typeof window !== 'undefined') {

}
