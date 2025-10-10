import { useCallback, useEffect } from 'react';

export const useCanvasInteractionSimple = (
  uiState,
  canvasRef
) => {
  const {
    setIsDraggingCanvas,
    setDragStart,
    isDraggingCanvas,
    dragStart,
    canvasOffset,
    setCanvasOffset,
    zoomLevel,
    setZoomLevel
  } = uiState;



  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left mouse button
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
    }
  }, [canvasOffset, setIsDraggingCanvas, setDragStart]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isDraggingCanvas) {
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDraggingCanvas, dragStart, setCanvasOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
  }, [setIsDraggingCanvas]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDraggingCanvas(true);
      setDragStart({ x: touch.clientX - canvasOffset.x, y: touch.clientY - canvasOffset.y });
    }
  }, [canvasOffset, setIsDraggingCanvas, setDragStart]);

  const handleTouchMove = useCallback((e) => {
    if (isDraggingCanvas && e.touches.length === 1) {
      const touch = e.touches[0];
      setCanvasOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDraggingCanvas, dragStart, setCanvasOffset]);

  const handleTouchEnd = useCallback(() => {
    setIsDraggingCanvas(false);
  }, [setIsDraggingCanvas]);

  // Handle wheel events with useEffect to avoid passive listener issues
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomDirection = e.deltaY > 0 ? -10 : 10;
      const newZoom = Math.max(50, Math.min(200, zoomLevel + zoomDirection));
      setZoomLevel(newZoom);
    };

    // Add non-passive wheel event listener
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, setZoomLevel, canvasRef]);

  return {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Handle wheel via React prop (sometimes more reliable than addEventListener)
    handleWheel: useCallback((e) => {
      e.preventDefault();
      const zoomDirection = e.deltaY > 0 ? -10 : 10;
      const newZoom = Math.max(50, Math.min(200, zoomLevel + zoomDirection));
      setZoomLevel(newZoom);
    }, [zoomLevel, setZoomLevel]),

    // Provide canvas props for easy spreading
    canvasProps: {
      onMouseDown: handleCanvasMouseDown,
      onMouseMove: handleCanvasMouseMove,
      onMouseUp: handleCanvasMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
      // Note: wheel events handled via useEffect with addEventListener for proper preventDefault support
    }
  };
};