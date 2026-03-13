import { useState, useEffect } from 'react';
import { generateGoogleMapsFallbackUrl, generateBingMapsEmbedUrl, cleanLocation } from '../utils/mapUtils';

const MapEmbed = ({ 
  location, 
  mapType = 'google', // 'google' or 'bing'
  width = '400px',
  height = '300px',
  style = {},
  showViewSelector = false,
  defaultView = 'satellite' // 'satellite', 'hybrid', 'terrain'
}) => {
  const [mapUrl, setMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentView, setCurrentView] = useState(defaultView);

  useEffect(() => {
    const cleanedLocation = cleanLocation(location);
    
    if (!cleanedLocation) {
      setMapUrl(null);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      let url;
      if (mapType === 'bing') {
        url = generateBingMapsEmbedUrl(cleanedLocation);
      } else {
        url = generateGoogleMapsFallbackUrl(cleanedLocation, currentView);
      }
      
      setMapUrl(url);
    } catch (error) {
      console.error('Error generating map URL:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [location, mapType, currentView]);

  const handleIframeError = () => {
    setHasError(true);
  };

  const containerStyle = {
    width,
    height,
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  };

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px'
  };

  const placeholderStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#666',
    textAlign: 'center',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '14px'
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle}>
          <div style={{ marginBottom: '10px' }}>📍</div>
          <div>Loading map...</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle}>
          <div style={{ marginBottom: '10px' }}>⚠️</div>
          <div>Unable to load map</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
            Check the location format
          </div>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle}>
          <div style={{ marginBottom: '10px' }}>🗺️</div>
          <div>{mapType === 'bing' ? 'Bing Maps' : 'Google Maps'}</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
            Enter location on first slide
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {showViewSelector && mapType !== 'bing' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontSize: '12px',
            fontFamily: "'Montserrat', sans-serif"
          }}
        >
          <select
            value={currentView}
            onChange={(e) => setCurrentView(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '12px',
              fontFamily: "'Montserrat', sans-serif",
              cursor: 'pointer'
            }}
          >
            <option value="satellite">🛰️ Satellite</option>
            <option value="hybrid">🗺️ Bird's Eye</option>
            <option value="terrain">🏔️ Terrain</option>
            <option value="roadmap">🛣️ Street</option>
          </select>
        </div>
      )}
      <iframe
        src={mapUrl}
        style={iframeStyle}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={handleIframeError}
        title={`${mapType === 'bing' ? 'Bing' : 'Google'} Maps - ${location}`}
      />
    </div>
  );
};

export default MapEmbed;