import { useState, useEffect } from 'react';

export const useDrawing = (slideData, setSlideData, currentSlide, zoomLevel, canvasOffset) => {
  // Drawing tool state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [isSquareEditMode, setIsSquareEditMode] = useState(false);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggingPointIndex, setDraggingPointIndex] = useState(null); // 0=topLeft, 1=topRight, 2=bottomLeft, 3=bottomRight

  // Get slide data helper
  const getSlideData = (slideId) => {
    return slideData[slideId] || { type: '', title: '', formData: {}, drawings: [] };
  };

  // Keyboard support for deleting selected drawings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((isDrawingMode || isSquareEditMode) && selectedDrawingIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteDrawing(selectedDrawingIndex);
        setSelectedDrawingIndex(null);
      }

      // Exit drawing mode with Escape key
      if (e.key === 'Escape') {
        setIsDrawingMode(false);
        setIsSquareEditMode(false);
        setSelectedDrawingIndex(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, isSquareEditMode, selectedDrawingIndex]);

  // Automatically enable square edit mode when exiting drawing mode if squares exist
  useEffect(() => {
    if (!isDrawingMode && !isSquareEditMode) {
      const currentSlideDrawings = getSlideData(currentSlide)?.drawings || [];
      if (currentSlideDrawings.length > 0) {
        setIsSquareEditMode(true);
      }
    }
  }, [isDrawingMode, currentSlide]);

  // Convert rectangle drawing to points
  const rectToPoints = (drawing) => {
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

  // Start point dragging
  const startPointDrag = (e, drawingIndex, pointIndex) => {
    e.stopPropagation();
    setIsDraggingPoint(true);
    setDraggingPointIndex(pointIndex);
    setSelectedDrawingIndex(drawingIndex);
  };

  // Update point position
  const updatePointPosition = (drawingIndex, pointIndex, newX, newY) => {
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

    setSlideData({
      ...slideData,
      [currentSlide]: {
        ...slideData[currentSlide],
        drawings: updatedDrawings
      }
    });
  };

  // Delete drawing
  const deleteDrawing = (drawingIndex) => {
    const updatedDrawings = (slideData[currentSlide]?.drawings || []).filter((_, index) => index !== drawingIndex);

    setSlideData({
      ...slideData,
      [currentSlide]: {
        ...slideData[currentSlide],
        drawings: updatedDrawings
      }
    });
  };

  // Start resize
  const startResize = (e, drawingIndex, handle) => {
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

      updateDrawingSize(drawingIndex, drawing.startX, drawing.startY, drawing.endX, drawing.endY, handle, mouseX, mouseY);
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

  // Update drawing size
  const updateDrawingSize = (drawingIndex, oldStartX, oldStartY, oldEndX, oldEndY, handle, mouseX, mouseY) => {
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

    setSlideData({
      ...slideData,
      [currentSlide]: {
        ...slideData[currentSlide],
        drawings: updatedDrawings
      }
    });
  };

  return {
    // State
    isDrawingMode,
    setIsDrawingMode,
    isDrawing,
    setIsDrawing,
    currentDrawing,
    setCurrentDrawing,
    selectedDrawingIndex,
    setSelectedDrawingIndex,
    isResizing,
    setIsResizing,
    resizeHandle,
    setResizeHandle,
    isSquareEditMode,
    setIsSquareEditMode,
    isDraggingPoint,
    setIsDraggingPoint,
    draggingPointIndex,
    setDraggingPointIndex,

    // Functions
    rectToPoints,
    startPointDrag,
    updatePointPosition,
    deleteDrawing,
    startResize,
    updateDrawingSize,
    getSlideData
  };
};