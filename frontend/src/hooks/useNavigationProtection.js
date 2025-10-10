import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to protect navigation when there are unsaved changes
 * Alternative implementation without useBlocker for compatibility
 */
export const useNavigationProtection = (isProjectModified, saveProject) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Override browser back/forward navigation
  useEffect(() => {
    if (!isProjectModified) return;

    const handlePopState = (e) => {
      if (isProjectModified) {
        e.preventDefault();
        const userConfirmed = window.confirm(
          "You have unsaved changes. Do you want to save your project before leaving?\n\n" +
          "Click 'OK' to save and continue, or 'Cancel' to stay on this page."
        );
        
        if (userConfirmed) {
          const saveAndLeave = async () => {
            try {
              await saveProject();
              // Allow the navigation to proceed
              window.history.go(1);
            } catch (error) {
              console.error('Failed to save project:', error);
              alert('Failed to save project. Please try again.');
              // Push current state back to prevent navigation
              window.history.pushState(null, '', location.pathname);
            }
          };
          saveAndLeave();
        } else {
          // Prevent navigation by pushing current state back
          window.history.pushState(null, '', location.pathname);
        }
      }
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProjectModified, saveProject, location.pathname]);

  // Browser refresh/close protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProjectModified) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProjectModified]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isProjectModified) {
          saveProject();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProjectModified, saveProject]);
};
