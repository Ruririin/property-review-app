import React from 'react';
import SlideRenderer from '../SlideRenderer';

const EditorCanvas = ({
  canvasRef,
  canvasOffset,
  zoomLevel,
  isDraggingCanvas,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  currentSlide,
  renderSlide,
  getSlideData,
  isDrawingMode,
  isSquareEditMode,
  selectedDrawingIndex,
  setSelectedDrawingIndex,
  rectToPoints,
  SIDEBAR_WIDTH,
  SLIDES_BAR_HEIGHT,
  showToolbar,
  showSlidesBar
}) => {
  return (
    <div 
      ref={canvasRef}
      className="flex-fill"
      style={{
        marginLeft: showToolbar ? SIDEBAR_WIDTH : 0,
        marginBottom: showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
        transition: "margin 0.3s ease",
        overflow: "hidden",
        position: "relative",
        cursor: isDraggingCanvas ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      <div
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel / 100})`,
          transformOrigin: '0 0',
          transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease-out',
          position: 'relative'
        }}
      >
        {renderSlide(currentSlide)}
        
        {/* Drawing Overlay */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1280px",
            height: "720px",
            pointerEvents: (isDrawingMode || isSquareEditMode) ? "auto" : "none",
            zIndex: 1000
          }}
        >
          {/* Render saved drawings for current slide */}
          {(getSlideData(currentSlide)?.drawings || []).map((drawing, index) => {
            const isSelected = selectedDrawingIndex === index;
            const points = rectToPoints(drawing);
            
            return (
              <g key={index}>
                <polygon
                  points={`${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[3].x},${points[3].y} ${points[2].x},${points[2].y}`}
                  fill={drawing.fill || "none"}
                  stroke={drawing.stroke || "red"}
                  strokeWidth={drawing.strokeWidth || 3}
                  style={{ 
                    cursor: (isDrawingMode || isSquareEditMode) ? "pointer" : "default",
                    opacity: isSelected ? 0.8 : 1,
                    filter: isSquareEditMode && !isDrawingMode ? "drop-shadow(0 0 4px rgba(0, 123, 255, 0.5))" : "none"
                  }}
                  onClick={(e) => {
                    if (isDrawingMode || isSquareEditMode) {
                      e.stopPropagation();
                      setSelectedDrawingIndex(isSelected ? null : index);
                    }
                  }}
                />
                
                {/* Individual draggable points when selected */}
                {isSelected && (isDrawingMode || isSquareEditMode) && (
                  <>
                    {points.map((point, pointIndex) => (
                      <circle
                        key={pointIndex}
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="blue"
                        stroke="white"
                        strokeWidth="2"
                        style={{ cursor: "move" }}
                      />
                    ))}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default EditorCanvas;
