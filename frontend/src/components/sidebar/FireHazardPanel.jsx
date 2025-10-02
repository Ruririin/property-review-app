import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const FireHazardPanel = () => {
  const { 
    fireHazardData,
    setFireHazardData,
    globalLocationData,
    currentProjectId,
    apiService 
  } = useEditor();

  const handleFireHazardToggle = async () => {
    const newValue = !fireHazardData.enabled;
    const updatedData = {
      ...fireHazardData,
      enabled: newValue
    };
    
    setFireHazardData(updatedData);

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          fireHazardData: updatedData
        });
        console.log('✅ Fire hazard data saved to backend:', updatedData);
      } catch (error) {
        console.error('❌ Failed to save fire hazard data:', error);
        // Revert on error
        setFireHazardData(fireHazardData);
      }
    }
  };

  const handleClassificationChange = async (classification) => {
    const updatedData = {
      ...fireHazardData,
      classification
    };
    
    setFireHazardData(updatedData);

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          fireHazardData: updatedData
        });
        console.log('✅ Fire hazard classification saved:', classification);
      } catch (error) {
        console.error('❌ Failed to save fire hazard classification:', error);
      }
    }
  };

  const handleTextChange = async (field, value) => {
    const updatedData = {
      ...fireHazardData,
      [field]: value
    };
    
    setFireHazardData(updatedData);

    // Debounced save to backend (you might want to add debouncing here)
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          fireHazardData: updatedData
        });
        console.log(`✅ Fire hazard ${field} saved:`, value);
      } catch (error) {
        console.error(`❌ Failed to save fire hazard ${field}:`, error);
      }
    }
  };

  const fireHazardClassifications = [
    'Low',
    'Moderate', 
    'High',
    'Very High',
    'Extreme'
  ];

  const getClassificationColor = (classification) => {
    const colors = {
      'Low': 'text-success',
      'Moderate': 'text-warning', 
      'High': 'text-danger',
      'Very High': 'text-danger',
      'Extreme': 'text-danger fw-bold'
    };
    return colors[classification] || 'text-secondary';
  };

  return (
    <div className="mb-3">
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="toggleFireHazard"
          checked={fireHazardData.enabled}
          onChange={handleFireHazardToggle}
        />
        <label className="form-check-label fw-bold" htmlFor="toggleFireHazard">
          <i className="bi bi-fire me-2"></i>
          Fire Hazard Assessment
        </label>
      </div>

      {fireHazardData.enabled && (
        <div className="fire-hazard-content">
          {/* Classification */}
          <div className="mb-3">
            <label className="form-label small">Fire Hazard Classification:</label>
            <div className="btn-group-vertical w-100" role="group">
              {fireHazardClassifications.map((classification) => (
                <button
                  key={classification}
                  type="button"
                  className={`btn btn-sm ${
                    fireHazardData.classification === classification
                      ? 'btn-danger'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => handleClassificationChange(classification)}
                >
                  <span className={getClassificationColor(classification)}>
                    {classification}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Location */}
          {globalLocationData?.premiseLocation && (
            <div className="mb-3">
              <label className="form-label small">Property Location:</label>
              <div className="p-2 bg-light rounded small">
                <i className="bi bi-geo-alt me-1"></i>
                {globalLocationData.premiseLocation}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          <div className="mb-3">
            <label className="form-label small">Risk Factors:</label>
            <textarea
              className="form-control form-control-sm"
              placeholder="Describe fire hazard risk factors (vegetation, weather conditions, etc.)"
              value={fireHazardData.riskFactors || ''}
              onChange={(e) => handleTextChange('riskFactors', e.target.value)}
              rows={3}
            />
          </div>

          {/* Mitigation Measures */}
          <div className="mb-3">
            <label className="form-label small">Mitigation Measures:</label>
            <textarea
              className="form-control form-control-sm"
              placeholder="Describe fire prevention and mitigation measures"
              value={fireHazardData.mitigationMeasures || ''}
              onChange={(e) => handleTextChange('mitigationMeasures', e.target.value)}
              rows={3}
            />
          </div>

          {/* Assessment Date */}
          <div className="mb-3">
            <label className="form-label small">Assessment Date:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fireHazardData.assessmentDate || ''}
              onChange={(e) => handleTextChange('assessmentDate', e.target.value)}
            />
          </div>

          {/* Summary */}
          {fireHazardData.classification && (
            <div className="alert alert-warning p-2">
              <div className="small">
                <strong>Assessment Summary:</strong>
                <div className={`mt-1 ${getClassificationColor(fireHazardData.classification)}`}>
                  Fire Hazard Level: {fireHazardData.classification}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FireHazardPanel;
