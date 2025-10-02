import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const FireStationPanel = () => {
  const { 
    fireStationData,
    setFireStationData,
    globalLocationData,
    currentProjectId,
    apiService 
  } = useEditor();

  const handleFireStationToggle = async () => {
    const newValue = !fireStationData.enabled;
    const updatedData = {
      ...fireStationData,
      enabled: newValue
    };
    
    setFireStationData(updatedData);

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          fireStationData: updatedData
        });
        console.log('✅ Fire station data saved to backend:', updatedData);
      } catch (error) {
        console.error('❌ Failed to save fire station data:', error);
        // Revert on error
        setFireStationData(fireStationData);
      }
    }
  };

  const handleDataChange = async (field, value) => {
    const updatedData = {
      ...fireStationData,
      [field]: value
    };
    
    setFireStationData(updatedData);

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          fireStationData: updatedData
        });
        console.log(`✅ Fire station ${field} saved:`, value);
      } catch (error) {
        console.error(`❌ Failed to save fire station ${field}:`, error);
      }
    }
  };

  const handleSearchNearbyStations = () => {
    if (globalLocationData?.premiseLocation) {
      const searchQuery = `fire station near ${globalLocationData.premiseLocation}`;
      const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      alert('No location data available. Please enter a location first.');
    }
  };

  const getResponseTimeColor = (minutes) => {
    if (!minutes) return 'text-secondary';
    const time = parseInt(minutes);
    if (time <= 4) return 'text-success';
    if (time <= 8) return 'text-warning';
    return 'text-danger';
  };

  const getResponseTimeRating = (minutes) => {
    if (!minutes) return '';
    const time = parseInt(minutes);
    if (time <= 4) return 'Excellent';
    if (time <= 8) return 'Good';
    if (time <= 12) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="mb-3">
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="toggleFireStation"
          checked={fireStationData.enabled}
          onChange={handleFireStationToggle}
        />
        <label className="form-check-label fw-bold" htmlFor="toggleFireStation">
          <i className="bi bi-fire me-2"></i>
          Fire Station Information
        </label>
      </div>

      {fireStationData.enabled && (
        <div className="fire-station-content">
          {/* Search Button */}
          <div className="mb-3">
            <button
              className="btn btn-outline-danger btn-sm w-100"
              onClick={handleSearchNearbyStations}
              disabled={!globalLocationData?.premiseLocation}
            >
              <i className="bi bi-search me-2"></i>
              Find Nearby Fire Stations
            </button>
            {!globalLocationData?.premiseLocation && (
              <small className="text-muted d-block mt-1">
                Enter a location to search for fire stations
              </small>
            )}
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

          {/* Nearest Fire Station */}
          <div className="mb-3">
            <label className="form-label small">Nearest Fire Station:</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Enter fire station name"
              value={fireStationData.nearestStation || ''}
              onChange={(e) => handleDataChange('nearestStation', e.target.value)}
            />
          </div>

          {/* Distance */}
          <div className="mb-3">
            <label className="form-label small">Distance (miles):</label>
            <input
              type="number"
              step="0.1"
              className="form-control form-control-sm"
              placeholder="0.0"
              value={fireStationData.distance || ''}
              onChange={(e) => handleDataChange('distance', e.target.value)}
            />
          </div>

          {/* Response Time */}
          <div className="mb-3">
            <label className="form-label small">Estimated Response Time (minutes):</label>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="0"
              value={fireStationData.responseTime || ''}
              onChange={(e) => handleDataChange('responseTime', e.target.value)}
            />
            {fireStationData.responseTime && (
              <div className={`mt-1 small ${getResponseTimeColor(fireStationData.responseTime)}`}>
                Rating: {getResponseTimeRating(fireStationData.responseTime)}
              </div>
            )}
          </div>

          {/* Fire Department */}
          <div className="mb-3">
            <label className="form-label small">Fire Department:</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Enter fire department name"
              value={fireStationData.department || ''}
              onChange={(e) => handleDataChange('department', e.target.value)}
            />
          </div>

          {/* Contact Information */}
          <div className="mb-3">
            <label className="form-label small">Emergency Contact:</label>
            <input
              type="tel"
              className="form-control form-control-sm"
              placeholder="911 or local emergency number"
              value={fireStationData.emergencyContact || ''}
              onChange={(e) => handleDataChange('emergencyContact', e.target.value)}
            />
          </div>

          {/* Additional Notes */}
          <div className="mb-3">
            <label className="form-label small">Additional Notes:</label>
            <textarea
              className="form-control form-control-sm"
              placeholder="Special considerations, equipment, accessibility, etc."
              value={fireStationData.notes || ''}
              onChange={(e) => handleDataChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary Card */}
          {(fireStationData.nearestStation || fireStationData.distance || fireStationData.responseTime) && (
            <div className="alert alert-info p-2">
              <div className="small">
                <strong>Fire Protection Summary:</strong>
                {fireStationData.nearestStation && (
                  <div className="mt-1">Station: {fireStationData.nearestStation}</div>
                )}
                {fireStationData.distance && (
                  <div>Distance: {fireStationData.distance} miles</div>
                )}
                {fireStationData.responseTime && (
                  <div className={getResponseTimeColor(fireStationData.responseTime)}>
                    Response Time: {fireStationData.responseTime} min 
                    ({getResponseTimeRating(fireStationData.responseTime)})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FireStationPanel;
