import { useState, useCallback, useEffect } from 'react';

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
  setZoomLevel,
  canvasRef,
  currentDrawing,
  slideData,
  setSlideData,
  currentSlide,
  rectToPoints
) => {
  // Debug logging for missing functions
  if (!setIsDraggingCanvas) {
    console.warn('⚠️ useCanvasInteraction: setIsDraggingCanvas is not provided');
  }
  // console.log('🚀 useCanvasInteraction hook called with zoomLevel:', zoomLevel);
  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e) => {
    if (isDrawingMode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const startY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);

      if (setIsDrawing) setIsDrawing(true);
      if (setCurrentDrawing) {
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
      }
      e.preventDefault();
      e.stopPropagation(); // Prevent other interactions
    } else if (canvasRef.current) {
      // Check if the click is inside a slide container - if so, don't start dragging
      const slideContainer = e.target.closest('[data-slide-id]');
      if (slideContainer) {
        return; // Don't start dragging if clicking inside slide
      }
      const dragStartPos = {
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      };

      if (setIsDraggingCanvas) setIsDraggingCanvas(true);
      if (setDragStart) setDragStart(dragStartPos);

      // Add document-level mouse move and mouse up listeners for proper drag handling
      const handleDocumentMouseMove = (moveEvent) => {
        if (setCanvasOffset && typeof setCanvasOffset === 'function') {
          const newOffset = {
            x: moveEvent.clientX - dragStartPos.x,
            y: moveEvent.clientY - dragStartPos.y
          };
          setCanvasOffset(newOffset);
          moveEvent.preventDefault();
        }
      };

      const handleDocumentMouseUp = (upEvent) => {
        if (setIsDraggingCanvas) setIsDraggingCanvas(false);
        
        // Remove document listeners
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        upEvent.preventDefault();
      };

      // Add document listeners
      document.addEventListener('mousemove', handleDocumentMouseMove, { passive: false });
      document.addEventListener('mouseup', handleDocumentMouseUp, { passive: false });
      
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
    if (isDrawingMode && currentDrawing && canvasRef.current && setCurrentDrawing) {
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
    } else if (isDraggingCanvas && dragStart && setCanvasOffset) {
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
    if (setIsDraggingCanvas) {
      setIsDraggingCanvas(false);
    }

    // Handle drawing mode
    if (isDrawingMode && currentDrawing) {

      // Convert to point-based format for new drawings
      const drawingWithPoints = {
        ...currentDrawing,
        points: rectToPoints && rectToPoints(currentDrawing)
      };

      // Save the completed drawing to the current slide
      if (slideData && currentSlide && setSlideData) {
        const updatedSlideData = {
          ...slideData[currentSlide],
          drawings: [...(slideData[currentSlide]?.drawings || []), drawingWithPoints]
        };

        setSlideData(prevSlideData => ({
          ...prevSlideData,
          [currentSlide]: updatedSlideData
        }));
      }

      // Clear current drawing
      if (setCurrentDrawing) setCurrentDrawing(null);
      if (setIsDrawing) setIsDrawing(false);
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

  // Scroll-to-zoom functionality
  useEffect(() => {
    if (!canvasRef?.current) {

      return;
    }



    const wheelHandler = (e) => {
      console.log('🔍 Wheel event triggered:', e.deltaY, 'Current zoom:', zoomLevel);
      
      if (!canvasRef.current) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = canvasRef.current.getBoundingClientRect();

      // Get mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom change (smooth increments)
      const zoomDelta = e.deltaY > 0 ? -15 : 15;
      const newZoomLevel = Math.max(25, Math.min(400, zoomLevel + zoomDelta));



      if (newZoomLevel !== zoomLevel) {
        // Calculate zoom factor for smooth zoom towards mouse position
        const zoomFactor = newZoomLevel / zoomLevel;

        // Calculate new offset to zoom towards mouse position
        const newOffset = {
          x: mouseX - (mouseX - (canvasOffset?.x || 0)) * zoomFactor,
          y: mouseY - (mouseY - (canvasOffset?.y || 0)) * zoomFactor
        };

        if (setZoomLevel) setZoomLevel(newZoomLevel);
        if (setCanvasOffset) setCanvasOffset(newOffset);
      }
    };

    // Attach directly to the canvas element instead of window
    const canvasElement = canvasRef.current;
    canvasElement.addEventListener('wheel', wheelHandler, { passive: false });



    return () => {

      canvasElement.removeEventListener('wheel', wheelHandler);
    };
  }, [canvasRef, zoomLevel, setZoomLevel, canvasOffset, setCanvasOffset]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoomLevel = Math.min(400, zoomLevel + 25);
    setZoomLevel(newZoomLevel);
  }, [zoomLevel, setZoomLevel]);

  const zoomOut = useCallback(() => {
    const newZoomLevel = Math.max(25, zoomLevel - 25);
    setZoomLevel(newZoomLevel);
  }, [zoomLevel, setZoomLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(100);
    setCanvasOffset({ x: 0, y: 0 });
  }, [setZoomLevel, setCanvasOffset]);

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