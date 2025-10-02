import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const WebsitePanel = () => {
  const { 
    showWebsite, 
    setShowWebsite, 
    currentProjectId, 
    apiService,
    globalLocationData,
    getSlideData 
  } = useEditor();

  const handleWebsiteToggle = async () => {
    try {
      const newShowWebsite = !showWebsite;
      setShowWebsite(newShowWebsite);
      
      // Save to backend if we have a current project
      if (currentProjectId) {
        await apiService.updateAppState(currentProjectId, { showWebsite: newShowWebsite });
        console.log('✅ Website visibility saved to backend:', newShowWebsite);
      }
    } catch (error) {
      console.error('❌ Failed to save website visibility:', error);
      // Revert on error
      setShowWebsite(!showWebsite);
    }
  };

  // Get website URL for visit button
  const getWebsiteUrl = () => {
    const slide1Data = getSlideData(1);
    return globalLocationData?.website || slide1Data?.formData?.website || '';
  };

  const websiteUrl = getWebsiteUrl();

  return (
    <div className="mb-3">
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="toggleWebsite"
          checked={showWebsite}
          onChange={handleWebsiteToggle}
        />
        <label className="form-check-label fw-bold" htmlFor="toggleWebsite">
          Website Field
        </label>
      </div>
      
      {/* Visit Website Button - only show if website field is enabled and has data */}
      {showWebsite && websiteUrl && (
        <div className="mt-2">
          <button
            className="btn btn-sm btn-outline-primary w-100"
            onClick={() => {
              const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
              window.open(url, '_blank');
            }}
            title={`Visit ${websiteUrl}`}
          >
            <i className="bi bi-globe me-1"></i>
            Visit Website
          </button>
        </div>
      )}
    </div>
  );
};

export default WebsitePanel;
