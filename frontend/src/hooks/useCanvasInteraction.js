import { useState, useCallback } from 'react';

export const useCanvasInteraction = (
  isDrawingMode,
  setIsDrawing,
  setCurrentDrawing,
  setIsDraggingCanvas,
  setDragStart,
  isDraggingCanvas,
  dragStart,
  canvasOffset,
  setCanvasOffset,
  zoomLevel,
  canvasRef,
  currentDrawing,
  slideData,
  setSlideData,
  currentSlide,
  rectToPoints
) => {
  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e) => {
    if (isDrawingMode) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const startY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);

      setIsDrawing(true);
      setCurrentDrawing({
        type: 'rectangle',
        startX,
        startY,
        endX: startX,
        endY: startY,
        stroke: 'red',
        strokeWidth: 5,
        fill: 'none'
      });
      e.preventDefault();
      e.stopPropagation(); // Prevent other interactions
    } else if (e.target === canvasRef.current) {
      // Only start dragging if clicking on the canvas container itself (background area)
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      });
      e.preventDefault();
    }
  }, [
    isDrawingMode,
    setIsDrawing,
    setCurrentDrawing,
    setIsDraggingCanvas,
    setDragStart,
    canvasRef,
    canvasOffset,
    zoomLevel
  ]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isDrawingMode && currentDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const endY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);

      setCurrentDrawing(prev => ({
        ...prev,
        endX,
        endY
      }));
      e.preventDefault();
      e.stopPropagation();
    } else if (isDraggingCanvas) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setCanvasOffset(newOffset);
      e.preventDefault();
    }
  }, [
    isDrawingMode,
    currentDrawing,
    isDraggingCanvas,
    dragStart,
    canvasRef,
    canvasOffset,
    zoomLevel,
    setCurrentDrawing,
    setCanvasOffset
  ]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);

    // Handle drawing mode
    if (isDrawingMode && currentDrawing) {

      // Convert to point-based format for new drawings
      const drawingWithPoints = {
        ...currentDrawing,
        points: rectToPoints(currentDrawing)
      };

      // Save the completed drawing to the current slide
      const updatedSlideData = {
        ...slideData[currentSlide],
        drawings: [...(slideData[currentSlide]?.drawings || []), drawingWithPoints]
      };

      setSlideData(prevSlideData => ({
        ...prevSlideData,
        [currentSlide]: updatedSlideData
      }));

      // Clear current drawing
      setCurrentDrawing(null);
      setIsDrawing(false);
    }
  }, [
    setIsDraggingCanvas,
    isDrawingMode,
    currentDrawing,
    rectToPoints,
    slideData,
    currentSlide,
    setSlideData,
    setCurrentDrawing,
    setIsDrawing
  ]);

  // Touch handlers for mobile
  const handleCanvasTouch = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleCanvasMouseDown(mouseEvent);
  }, [handleCanvasMouseDown]);

  const handleCanvasTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleCanvasMouseMove(mouseEvent);
  }, [handleCanvasMouseMove]);

  const handleCanvasTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleCanvasMouseUp();
  }, [handleCanvasMouseUp]);

  // Long press detection for mobile
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleTouchStart = useCallback((e) => {
    const timer = setTimeout(() => {
      setIsLongPress(true);
      // Trigger context menu or special action for long press
    }, 500); // 500ms for long press detection

    setLongPressTimer(timer);
    handleCanvasTouch(e);
  }, [handleCanvasTouch]);

  const handleTouchMove = useCallback((e) => {
    // Cancel long press if user moves finger
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setIsLongPress(false);
    }
    handleCanvasTouchMove(e);
  }, [longPressTimer, handleCanvasTouchMove]);

  const handleTouchEnd = useCallback((e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isLongPress) {
      // Regular touch end
      handleCanvasTouchEnd(e);
    }

    setIsLongPress(false);
  }, [longPressTimer, isLongPress, handleCanvasTouchEnd]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isDrawingMode) {
        setCurrentDrawing(null);
        setIsDrawing(false);
      }
    } else if (e.key === 'd' || e.key === 'D') {
      // Toggle drawing mode with 'd' key
      // This would need to be connected to the parent component's drawing mode toggle
    }
  }, [isDrawingMode, setCurrentDrawing, setIsDrawing]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    // This would need to be connected to the parent component's zoom functionality
  }, []);

  const zoomOut = useCallback(() => {
    // This would need to be connected to the parent component's zoom functionality
  }, []);

  const resetZoom = useCallback(() => {
    // This would need to be connected to the parent component's zoom functionality
  }, []);

  return {
    // Mouse handlers
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,

    // Touch handlers
    handleCanvasTouch,
    handleCanvasTouchMove,
    handleCanvasTouchEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Keyboard handlers
    handleKeyDown,

    // Zoom functions
    zoomIn,
    zoomOut,
    resetZoom,

    // Long press state
    isLongPress
  };
};