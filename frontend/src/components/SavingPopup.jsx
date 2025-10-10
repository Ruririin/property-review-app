import React from 'react';

const SavingPopup = ({ isVisible, message = "Saving project..." }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 9999 
      }}
    >
      <div 
        className="bg-white rounded shadow-lg p-4 d-flex align-items-center"
        style={{ minWidth: '300px' }}
      >
        <div 
          className="spinner-border text-primary me-3" 
          role="status"
          style={{ width: '2rem', height: '2rem' }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <div>
          <h6 className="mb-1">{message}</h6>
          <small className="text-muted">Please wait...</small>
        </div>
      </div>
    </div>
  );
};

export default SavingPopup;
