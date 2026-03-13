import { useEffect, useState } from 'react';
import fieldActivityService from '../services/fieldActivityService';

/**
 * Hook to track field editing activity for form inputs
 */
export const useFieldActivity = (fieldId, fieldName, sessionUser) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditor, setCurrentEditor] = useState(null);

  useEffect(() => {
    // Subscribe to field activity updates
    const unsubscribe = fieldActivityService.addListener((event, data) => {
      if (data.fieldId === fieldId) {
        if (event === 'fieldEditingStarted') {
          setCurrentEditor(data.user === sessionUser ? null : data.user);
        } else if (event === 'fieldEditingStopped') {
          setCurrentEditor(null);
        }
      }
    });

    const editor = fieldActivityService.getFieldEditor(fieldId);
    if (editor && editor.user !== sessionUser) {
      setCurrentEditor(editor.user);
    }

    return unsubscribe;
  }, [fieldId, sessionUser]);

  const startEditing = () => {
    if (sessionUser) {
      fieldActivityService.startEditingField(sessionUser, fieldId, fieldName);
      setIsEditing(true);
    }
  };

  const stopEditing = () => {
    if (sessionUser) {
      fieldActivityService.stopEditingField(sessionUser, fieldId);
      setIsEditing(false);
    }
  };

  const updateHeartbeat = () => {
    if (sessionUser && isEditing) {
      fieldActivityService.updateFieldHeartbeat(sessionUser, fieldId);
    }
  };

  return {
    isEditing,
    currentEditor,
    startEditing,
    stopEditing,
    updateHeartbeat
  };
};

/**
 * Hook to get all current field activities for display in dropdowns
 */
export const useAllFieldActivities = () => {
  const [fieldActivities, setFieldActivities] = useState([]);
  const [userFieldMap, setUserFieldMap] = useState(new Map());

  useEffect(() => {
    // Initial load
    setFieldActivities(fieldActivityService.getFieldActivities());
    setUserFieldMap(fieldActivityService.getActiveFieldsByUser());

    // Subscribe to updates
    const unsubscribe = fieldActivityService.addListener((event, data) => {
      setFieldActivities(fieldActivityService.getFieldActivities());
      setUserFieldMap(fieldActivityService.getActiveFieldsByUser());
    });

    return unsubscribe;
  }, []);

  return {
    fieldActivities,
    userFieldMap,
    getFieldEditor: (fieldId) => fieldActivityService.getFieldEditor(fieldId)
  };
};