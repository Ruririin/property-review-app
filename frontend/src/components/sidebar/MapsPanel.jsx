import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { openActiveFires } from '../../utils/editorHelpers';

const MapsPanel = () => {
  const { getCurrentLocation } = useEditor();

  const handleOpenGoogle = () => {
    const location = getCurrentLocation();
    if (!location.trim()) {
      alert('Please enter a premise location first (on slide 1).');
      return;
    }
    
    const searchQuery = encodeURIComponent(location.trim());
    const googleMapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
    window.open(googleMapsUrl, '_blank');
    console.log('Opened Google Maps for:', location);
  };

  const handleOpenBing = () => {
    const location = getCurrentLocation();
    if (!location.trim()) {
      alert('Please enter a premise location first (on slide 1).');
      return;
    }
    
    const searchQuery = encodeURIComponent(location.trim());
    const bingMapsUrl = `https://www.bing.com/maps?q=${searchQuery}`;
    window.open(bingMapsUrl, '_blank');
    console.log('Opened Bing Maps for:', location);
  };

  const handleOpenFireHazard = () => {
    window.open('https://experience.arcgis.com/experience/6a9cb66bb1824cd98756812af41292a0', '_blank');
    console.log('Opened Fire Hazard ArcGIS experience');
  };



  return (
    <div className="mb-3">
      <label className="form-label small fw-bold d-block mb-2">Maps</label>
      <div className="d-flex gap-2 mb-2">
        <button
          className="btn btn-sm flex-1"
          style={{
            backgroundColor: '#2d5016',
            borderColor: '#2d5016',
            color: 'white'
          }}
          onClick={handleOpenGoogle}
        >
          GOOGLE
        </button>
        <button
          className="btn btn-sm flex-1"
          style={{
            backgroundColor: '#2d5016',
            borderColor: '#2d5016',
            color: 'white'
          }}
          onClick={handleOpenBing}
        >
          BING
        </button>
      </div>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm flex-1"
          style={{
            backgroundColor: '#2d5016',
            borderColor: '#2d5016',
            color: 'white'
          }}
          onClick={handleOpenFireHazard}
        >
          Fire Hazard
        </button>
        <button
          className="btn btn-sm flex-1"
          style={{
            backgroundColor: '#2d5016',
            borderColor: '#2d5016',
            color: 'white'
          }}
          onClick={openActiveFires}
        >
          Active Fires
        </button>
      </div>
    </div>
  );
};

export default MapsPanel;
