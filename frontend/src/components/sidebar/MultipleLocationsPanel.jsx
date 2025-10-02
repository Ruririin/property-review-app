import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const MultipleLocationsPanel = () => {
  const { 
    multipleLocationsMode,
    setMultipleLocationsMode,
    selectedLocationIndex,
    setSelectedLocationIndex,
    globalLocationData,
    parseMultipleLocations,
    currentProjectId,
    apiService 
  } = useEditor();

  const handleToggleMultipleLocations = async () => {
    try {
      const newMode = !multipleLocationsMode;
      setMultipleLocationsMode(newMode);
      
      // Save to backend if we have a current project
      if (currentProjectId) {
        await apiService.updateAppState(currentProjectId, { 
          multipleLocationsMode: newMode,
          selectedLocationIndex: 0 // Reset to first location
        });
        console.log('✅ Multiple locations mode saved to backend:', newMode);
      }
      
      // Reset selected location index when toggling
      setSelectedLocationIndex(0);
    } catch (error) {
      console.error('❌ Failed to save multiple locations mode:', error);
      // Revert on error
      setMultipleLocationsMode(!multipleLocationsMode);
    }
  };

  // Get available locations
  const locations = multipleLocationsMode && globalLocationData?.premiseLocation 
    ? parseMultipleLocations(globalLocationData.premiseLocation)
    : [];

  return (
    <div className="mb-3">
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="toggleMultipleLocations"
          checked={multipleLocationsMode}
          onChange={handleToggleMultipleLocations}
        />
        <label className="form-check-label fw-bold" htmlFor="toggleMultipleLocations">
          Multiple Locations Mode
        </label>
      </div>
      
      {multipleLocationsMode && locations.length > 1 && (
        <div className="mt-2">
          <label className="form-label small">Select Location for Next Slide:</label>
          <select
            className="form-select form-select-sm"
            value={selectedLocationIndex}
            onChange={(e) => setSelectedLocationIndex(parseInt(e.target.value))}
          >
            {locations.map((location, index) => (
              <option key={index} value={index}>
                Location {index + 1}: {location.substring(0, 40)}
                {location.length > 40 && '...'}
              </option>
            ))}
          </select>
          
          <div className="mt-2 p-2 bg-light rounded small">
            <strong>Selected:</strong>
            <div className="text-muted">{locations[selectedLocationIndex]}</div>
          </div>
        </div>
      )}
      
      {multipleLocationsMode && locations.length <= 1 && (
        <div className="mt-2 text-muted small">
          <i className="bi bi-info-circle me-1"></i>
          Enter multiple locations separated by line breaks to use this feature.
        </div>
      )}
    </div>
  );
};

export default MultipleLocationsPanel;
