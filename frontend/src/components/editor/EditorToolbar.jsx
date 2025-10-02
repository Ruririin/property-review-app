import React from 'react';

const EditorToolbar = ({
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  isDrawingMode,
  setIsDrawingMode,
  isSquareEditMode,
  setIsSquareEditMode,
  ZOOM_MIN,
  ZOOM_MAX,
  BUTTON_STYLES
}) => {
  return (
    <div className="editor-toolbar d-flex align-items-center gap-2 p-2 bg-light border-bottom">
      {/* Zoom Controls */}
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-outline-secondary"
          style={BUTTON_STYLES.zoomButton}
          onClick={handleZoomOut}
          disabled={zoomLevel <= ZOOM_MIN}
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-muted small" style={{ minWidth: '50px', textAlign: 'center' }}>
          {zoomLevel}%
        </span>
        <button
          className="btn btn-outline-secondary"
          style={BUTTON_STYLES.zoomButton}
          onClick={handleZoomIn}
          disabled={zoomLevel >= ZOOM_MAX}
          title="Zoom In"
        >
          +
        </button>
        <button
          className="btn btn-outline-secondary btn-sm ms-1"
          onClick={handleResetZoom}
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      {/* Drawing Tools */}
      <div className="d-flex align-items-center gap-1 ms-3">
        <button
          className={`btn ${isDrawingMode ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
          onClick={() => {
            setIsDrawingMode(!isDrawingMode);
            if (isSquareEditMode) setIsSquareEditMode(false);
          }}
          title="Drawing Mode"
        >
          <i className="bi bi-pencil"></i>
          <span className="d-none d-md-inline ms-1">Draw</span>
        </button>
        <button
          className={`btn ${isSquareEditMode ? 'btn-success' : 'btn-outline-success'} btn-sm`}
          onClick={() => {
            setIsSquareEditMode(!isSquareEditMode);
            if (isDrawingMode) setIsDrawingMode(false);
          }}
          title="Edit Mode"
        >
          <i className="bi bi-cursor"></i>
          <span className="d-none d-md-inline ms-1">Edit</span>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
