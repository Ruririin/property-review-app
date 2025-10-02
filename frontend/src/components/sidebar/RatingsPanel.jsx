import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const RatingsPanel = () => {
  const { 
    showRatings, 
    businessesAtLocation, 
    searchBusinessRatings,
    getCurrentLocation 
  } = useEditor();

  if (!showRatings) return null;

  return (
    <div className="mb-3">
      <label className="form-label small fw-bold">Business Ratings</label>
      
      {businessesAtLocation.length === 0 ? (
        <button
          className="btn btn-sm btn-outline-primary w-100"
          onClick={() => {
            const location = getCurrentLocation();
            if (location) {
              searchBusinessRatings(location);
            } else {
              alert('Please enter a premise location first.');
            }
          }}
        >
          <i className="bi bi-search me-1"></i>
          Search Business Ratings
        </button>
      ) : (
        <div className="d-flex flex-column gap-2">
          {businessesAtLocation.map((business, index) => (
            <button
              key={index}
              className="btn btn-sm btn-outline-success text-start"
              onClick={() => {
                if (business.website) {
                  window.open(business.website, '_blank');
                } else if (business.name) {
                  const searchQuery = encodeURIComponent(`${business.name} ${getCurrentLocation()}`);
                  window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                }
              }}
              title={`View ${business.name || 'Business'} details`}
            >
              <div className="small">
                <strong>{business.name || 'Business'}</strong>
                {business.rating && (
                  <div className="text-warning">
                    {'★'.repeat(Math.floor(business.rating))}
                    {business.rating % 1 !== 0 && '☆'}
                    <span className="text-muted ms-1">({business.rating})</span>
                  </div>
                )}
                {business.address && (
                  <div className="text-muted small">{business.address}</div>
                )}
              </div>
            </button>
          ))}
          
          {/* Search again button */}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              const location = getCurrentLocation();
              if (location) {
                searchBusinessRatings(location);
              }
            }}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Search Again
          </button>
        </div>
      )}
    </div>
  );
};

export default RatingsPanel;
