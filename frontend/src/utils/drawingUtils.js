/**
 * Drawing Utilities - Phase 3 of Editor Refactoring
 * 
 * This module contains drawing-related utility functions extracted from Editor.jsx
 * to reduce complexity and improve maintainability.
 */

// Convert rectangle drawing to points
export const rectToPoints = (drawing) => {
  if (drawing.points) {
    return drawing.points; // Already has points
  }

  const { startX, startY, endX, endY } = drawing;
  return [
    { x: startX, y: startY },     // Top-left
    { x: endX, y: startY },       // Top-right
    { x: startX, y: endY },       // Bottom-left
    { x: endX, y: endY }          // Bottom-right
  ];
};

// Delete drawing from slide data
export const deleteDrawing = (slideData, currentSlide, drawingIndex) => {
  const updatedDrawings = (slideData[currentSlide]?.drawings || []).filter(
    (_, index) => index !== drawingIndex
  );

  return {
    ...slideData,
    [currentSlide]: {
      ...slideData[currentSlide],
      drawings: updatedDrawings
    }
  };
};

// Update point position in drawing
export const updatePointPosition = (slideData, currentSlide, drawingIndex, pointIndex, newX, newY) => {
  const updatedDrawings = [...(slideData[currentSlide]?.drawings || [])];
  const drawing = updatedDrawings[drawingIndex];

  if (!drawing.points) {
    // Convert rect to points first
    drawing.points = rectToPoints(drawing);
    delete drawing.startX;
    delete drawing.startY;
    delete drawing.endX;
    delete drawing.endY;
  }

  drawing.points[pointIndex] = { x: newX, y: newY };

  return {
    ...slideData,
    [currentSlide]: {
      ...slideData[currentSlide],
      drawings: updatedDrawings
    }
  };
};

// Update drawing size based on resize handle
export const updateDrawingSize = (slideData, currentSlide, drawingIndex, oldStartX, oldStartY, oldEndX, oldEndY, handle, mouseX, mouseY) => {
  const updatedDrawings = [...(slideData[currentSlide]?.drawings || [])];
  let newStartX = oldStartX, newStartY = oldStartY, newEndX = oldEndX, newEndY = oldEndY;

  switch (handle) {
    case 'nw': // Top-left corner
      newStartX = mouseX;
      newStartY = mouseY;
      break;
    case 'ne': // Top-right corner
      newEndX = mouseX;
      newStartY = mouseY;
      break;
    case 'sw': // Bottom-left corner
      newStartX = mouseX;
      newEndY = mouseY;
      break;
    case 'se': // Bottom-right corner
      newEndX = mouseX;
      newEndY = mouseY;
      break;
    case 'n': // Top edge
      newStartY = mouseY;
      break;
    case 's': // Bottom edge
      newEndY = mouseY;
      break;
    case 'w': // Left edge
      newStartX = mouseX;
      break;
    case 'e': // Right edge
      newEndX = mouseX;
      break;
  }

  updatedDrawings[drawingIndex] = {
    ...updatedDrawings[drawingIndex],
    startX: Math.min(newStartX, newEndX),
    startY: Math.min(newStartY, newEndY),
    endX: Math.max(newStartX, newEndX),
    endY: Math.max(newStartY, newEndY)
  };

  return {
    ...slideData,
    [currentSlide]: {
      ...slideData[currentSlide],
      drawings: updatedDrawings
    }
  };
};

// Start point dragging helper
export const createPointDragHandler = (e, drawingIndex, pointIndex, setIsDraggingPoint, setDraggingPointIndex, setSelectedDrawingIndex) => {
  e.stopPropagation();
  setIsDraggingPoint(true);
  setDraggingPointIndex(pointIndex);
  setSelectedDrawingIndex(drawingIndex);
};

// Create resize handler
export const createResizeHandler = (slideData, currentSlide, canvasOffset, zoomLevel, setSlideData, setIsResizing, setResizeHandle, setSelectedDrawingIndex) => {
  return (e, drawingIndex, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedDrawingIndex(drawingIndex);

    const handleMouseMove = (moveEvent) => {
      const slideContainer = e.target.closest('.slide-content');
      if (!slideContainer) return;

      const rect = slideContainer.getBoundingClientRect();
      const drawing = slideData[currentSlide]?.drawings[drawingIndex];
      if (!drawing) return;

      // Calculate mouse position relative to slide container, accounting for zoom and canvas offset
      const mouseX = ((moveEvent.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100));
      const mouseY = ((moveEvent.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100));

      const updatedSlideData = updateDrawingSize(
        slideData,
        currentSlide,
        drawingIndex,
        drawing.startX,
        drawing.startY,
        drawing.endX,
        drawing.endY,
        handle,
        mouseX,
        mouseY
      );

      setSlideData(updatedSlideData);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
};

// Drawing keyboard handler
export const createDrawingKeyboardHandler = (isDrawingMode, isSquareEditMode, selectedDrawingIndex, slideData, currentSlide, setSlideData, setSelectedDrawingIndex, setIsDrawingMode, setIsSquareEditMode) => {
  return (e) => {
    if ((isDrawingMode || isSquareEditMode) && selectedDrawingIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
      const updatedSlideData = deleteDrawing(slideData, currentSlide, selectedDrawingIndex);
      setSlideData(updatedSlideData);
      setSelectedDrawingIndex(null);
    }

    // Exit drawing mode with Escape key
    if (e.key === 'Escape') {
      setIsDrawingMode(false);
      setIsSquareEditMode(false);
      setSelectedDrawingIndex(null);
    }
  };
};

// Get slide data helper
export const getSlideData = (slideData, slideId) => {
  return slideData[slideId] || { type: '', title: '', formData: {}, drawings: [] };
};

// Auto-enable square edit mode when exiting drawing mode
export const shouldEnableSquareEditMode = (isDrawingMode, isSquareEditMode, slideData, currentSlide) => {
  if (!isDrawingMode && !isSquareEditMode) {
    const currentSlideDrawings = getSlideData(slideData, currentSlide)?.drawings || [];
    return currentSlideDrawings.length > 0;
  }
  return false;
};

// Drawing state management helpers
export const createDrawingStateHelpers = () => {
  return {
    // Default drawing state
    getDefaultDrawingState: () => ({
      isDrawingMode: false,
      isDrawing: false,
      currentDrawing: null,
      selectedDrawingIndex: null,
      isResizing: false,
      resizeHandle: null,
      isSquareEditMode: false,
      isDraggingPoint: false,
      draggingPointIndex: null
    }),

    // Drawing validation
    isValidDrawing: (drawing) => {
      return drawing && (
        (drawing.startX !== undefined && drawing.startY !== undefined && 
         drawing.endX !== undefined && drawing.endY !== undefined) ||
        (drawing.points && Array.isArray(drawing.points) && drawing.points.length > 0)
      );
    }
  };
};
