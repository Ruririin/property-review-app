/**
 * Sidebar Toolbar Component
 * Contains field controls, font size, website toggle, maps, zoom controls, etc.
 */

import { useState } from 'react';

const SidebarToolbar = ({
  // Field controls
  selectedField = null,
  fontSizes = {},
  onFontSizeChange = () => {},
  
  // Website field
  showWebsite = false,
  onToggleWebsite = () => {},
  websiteUrl = '',
  onVisitWebsite = () => {},
  
  // Maps (now use backend API)
  onOpenGoogleMaps = () => {},
  onOpenBingMaps = () => {},
  
  // Zoom controls
  zoomLevel = 100,
  onZoomIn = () => {},
  onZoomOut = () => {},
  onResetZoom = () => {},
  
  // Drawing mode
  isDrawingMode = false,
  onToggleDrawingMode = () => {},
  onClearDrawings = () => {},
  hasDrawings = false,
  
  // Multiple locations
  multipleLocationsMode = false,
  onToggleMultipleLocations = () => {},
  
  // Toggle sidebar
  isVisible = true,
  onToggleVisibility = () => {}
}) => {
  const SIDEBAR_WIDTH = 350;
  
  const buttonStyles = {
    toggleArrow: {
      position: "absolute",
      width: "20px",
      height: "60px",
      backgroundColor: "#f8f9fa",
      border: "1px solid #ddd",
      borderRadius: "0 6px 6px 0",
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      right: "-20px",
      top: "50%",
      transform: "translateY(-50%)",
      borderLeft: "none",
      zIndex: 1001,
    },
    zoomButton: {
      width: "28px",
      height: "28px",
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "bold"
    }
  };

  const mapButtonStyle = {
    backgroundColor: '#2d5016',
    borderColor: '#2d5016',
    color: 'white'
  };

  return (
    <div
      className="editor-sidebar bg-light border-end p-3 shadow custom-scrollbar"
      style={{
        position: "fixed",
        top: "72px", // NAVBAR_HEIGHT
        bottom: "160px", // SLIDES_BAR_HEIGHT
        left: isVisible ? 0 : -SIDEBAR_WIDTH,
        width: SIDEBAR_WIDTH,
        zIndex: 1000,
        transition: "left 0.3s ease-in-out, bottom 0.3s ease",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: "#c1c1c1 #f1f1f1",
      }}
    >
      {/* Font Size Control */}
      <div className="mb-3">
        <label className="form-label small fw-bold">Font Size</label>
        <input
          type="number"
          className="form-control form-control-sm"
          min="10"
          max="100"
          value={selectedField ? fontSizes[selectedField] || '' : ""}
          onChange={(e) => onFontSizeChange(e.target.value)}
          disabled={!selectedField}
          placeholder="Select field"
        />
      </div>

      {/* Website Field Toggle */}
      <div className="mb-3">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="toggleWebsite"
            checked={showWebsite}
            onChange={onToggleWebsite}
          />
          <label className="form-check-label fw-bold" htmlFor="toggleWebsite">
            Website Field
          </label>
        </div>
        
        {/* Visit Website Button */}
        {showWebsite && websiteUrl && websiteUrl.trim() !== '' && (
          <div className="mt-2">
            <button
              className="btn btn-sm w-100"
              style={{
                backgroundColor: '#2d5016',
                borderColor: '#2d5016',
                color: 'white',
                fontSize: '12px',
                padding: '6px 12px'
              }}
              onClick={onVisitWebsite}
            >
              Visit Website
            </button>
          </div>
        )}
      </div>

      {/* Maps Section */}
      <div className="mb-3">
        <label className="form-label small fw-bold d-block mb-2">Maps</label>
        <div className="d-flex gap-2 mb-2">
          <button
            className="btn btn-sm flex-1"
            style={mapButtonStyle}
            onClick={onOpenGoogleMaps}
          >
            Google
          </button>
          <button
            className="btn btn-sm flex-1"
            style={mapButtonStyle}
            onClick={onOpenBingMaps}
          >
            Bing
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="mb-3">
        <label className="form-label small fw-bold d-block mb-2">Zoom</label>
        <div className="d-flex align-items-center gap-2 mb-2">
          <button
            className="btn btn-outline-secondary"
            style={buttonStyles.zoomButton}
            onClick={onZoomOut}
            disabled={zoomLevel <= 50}
          >
            -
          </button>
          <span className="text-center flex-1 small fw-semibold">
            {zoomLevel}%
          </span>
          <button
            className="btn btn-outline-secondary"
            style={buttonStyles.zoomButton}
            onClick={onZoomIn}
            disabled={zoomLevel >= 200}
          >
            +
          </button>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm w-100"
          onClick={onResetZoom}
        >
          Reset (100%)
        </button>
      </div>

      {/* Drawing Mode */}
      <div className="mb-3">
        <label className="form-label small fw-bold d-block mb-2">Drawing</label>
        <button
          className={`btn btn-sm w-100 mb-2 ${isDrawingMode ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={onToggleDrawingMode}
        >
          {isDrawingMode ? 'Exit Drawing' : 'Draw Lines'}
        </button>
        
        {hasDrawings && (
          <button
            className="btn btn-outline-secondary btn-sm w-100"
            onClick={onClearDrawings}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Multiple Locations Mode */}
      <div className="mb-3">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="toggleMultipleLocations"
            checked={multipleLocationsMode}
            onChange={onToggleMultipleLocations}
          />
          <label className="form-check-label fw-bold" htmlFor="toggleMultipleLocations">
            Multiple Locations
          </label>
        </div>
      </div>

      {/* Toggle Arrow Button */}
      <button
        onClick={onToggleVisibility}
        style={buttonStyles.toggleArrow}
      >
        <span style={{ fontSize: "1rem" }}>
          {isVisible ? "←" : "→"}
        </span>
      </button>
    </div>
  );
};

export default SidebarToolbar;