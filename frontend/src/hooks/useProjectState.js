import { useState } from 'react';

/**
 * Custom hook for managing project-related state
 */
export const useProjectState = () => {
  // Project save state
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading project...");

  // Project status state
  const [currentProjectStatus, setCurrentProjectStatus] = useState('draft');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Project metadata
  const [isProjectModified, setIsProjectModified] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return {
    // Project ID and loading
    currentProjectId,
    setCurrentProjectId,
    isLoadingProject,
    setIsLoadingProject,
    loadingMessage,
    setLoadingMessage,

    // Project status
    currentProjectStatus,
    setCurrentProjectStatus,
    showStatusDropdown,
    setShowStatusDropdown,

    // Project metadata
    isProjectModified,
    setIsProjectModified,
    lastSaveTime,
    setLastSaveTime,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  };
};