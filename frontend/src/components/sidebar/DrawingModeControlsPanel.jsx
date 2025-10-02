import React from 'react';
import { useEditor } from '../../contexts/EditorContext';

const DrawingModeControlsPanel = () => {
  const { 
    currentSlide,
    slideData,
    isDrawingMode,
    setIsDrawingMode,
    isSquareEditMode,
    setIsSquareEditMode,
    selectedDrawingIndex,
    setSelectedDrawingIndex,
    setSlideData
  } = useEditor();

  return (
    <div className="mb-3">
      <label className="form-label small fw-bold">Drawing Tools</label>
      
      {/* Primary Drawing/Editing Button */}
      <button
        className="btn btn-sm w-100 mb-2"
        style={{
          backgroundColor: isDrawingMode ? '#2d5016' : (isSquareEditMode ? '#0d6efd' : 'transparent'),
          borderColor: isDrawingMode ? '#2d5016' : (isSquareEditMode ? '#0d6efd' : '#2d5016'),
          color: (isDrawingMode || isSquareEditMode) ? 'white' : '#2d5016'
        }}
        onClick={() => {
          if (isDrawingMode) {
            setIsDrawingMode(false);
            // Auto-enter edit mode if squares exist
            const currentSlideDrawings = slideData[currentSlide]?.drawings || [];
            if (currentSlideDrawings.length > 0) {
              setIsSquareEditMode(true);
            }
          } else if (isSquareEditMode) {
            setIsSquareEditMode(false);
            setSelectedDrawingIndex(null);
          } else {
            setIsDrawingMode(true);
            setIsSquareEditMode(false);
          }
        }}
      >
        {isDrawingMode ? 'Exit Drawing' : (isSquareEditMode ? 'Exit Editing' : 'Draw Squares')}
      </button>
      
      {/* Secondary Controls */}
      {(isDrawingMode || isSquareEditMode) && (slideData[currentSlide]?.drawings || []).length > 0 && (
        <div className="d-flex gap-1">
          {/* Edit Mode Toggle (only show when not drawing) */}
          {!isDrawingMode && (
            <button
              className="btn btn-outline-info btn-sm flex-fill"
              style={{ fontSize: '10px' }}
              onClick={() => {
                setIsSquareEditMode(!isSquareEditMode);
                if (!isSquareEditMode) {
                  setSelectedDrawingIndex(null);
                }
              }}
            >
              {isSquareEditMode ? 'Stop Edit' : 'Edit Squares'}
            </button>
          )}
          
          {/* Clear All Button */}
          <button
            className="btn btn-outline-danger btn-sm flex-fill"
            style={{ fontSize: '10px' }}
            onClick={() => {
              if (window.confirm('Clear all squares on this slide?')) {
                setSlideData(prev => ({
                  ...prev,
                  [currentSlide]: {
                    ...prev[currentSlide],
                    drawings: []
                  }
                }));
                setSelectedDrawingIndex(null);
                setIsSquareEditMode(false);
              }
            }}
          >
            Clear All
          </button>
        </div>
      )}
      
      {/* Status indicator */}
      {isSquareEditMode && !isDrawingMode && (
        <div className="mt-2 p-2 bg-info bg-opacity-10 rounded border border-info border-opacity-25">
          <small className="text-info d-block" style={{ fontSize: '10px' }}>
            <strong>✏️ Edit Mode:</strong> Click squares to select and resize them
          </small>
          {selectedDrawingIndex !== null && (
            <small className="text-muted d-block" style={{ fontSize: '9px' }}>
              Press Delete or Backspace to remove selected square
            </small>
          )}
        </div>
      )}
      
      {isDrawingMode && (
        <div className="mt-2 p-2 bg-success bg-opacity-10 rounded border border-success border-opacity-25">
          <small className="text-success d-block" style={{ fontSize: '10px' }}>
            <strong>🖊️ Draw Mode:</strong> Click and drag to create squares
          </small>
        </div>
      )}
    </div>
  );
};

export default DrawingModeControlsPanel;
