import { useState } from 'react';

export const useUIStateSimple = () => {
  const [showSlidesBar, setShowSlidesBar] = useState(true);
  const [showRatings, setShowRatings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showWebsite, setShowWebsite] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [fontSizes, setFontSizes] = useState({
    insuredName: 96,
    premiseLocation: 37,
    website: 37,
    description: 30,
    lineBusiness: 30,
  });
  const [isLroDropdownOpen, setIsLroDropdownOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [textAlignments, setTextAlignments] = useState({
    fireStationName: 'left',
    fireStationDistance: 'left'
  });

  return {
    showSlidesBar,
    setShowSlidesBar,
    showRatings,
    setShowRatings,
    zoomLevel,
    setZoomLevel,
    canvasOffset,
    setCanvasOffset,
    isDraggingCanvas,
    setIsDraggingCanvas,
    dragStart,
    setDragStart,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    showWebsite,
    setShowWebsite,
    selectedField,
    setSelectedField,
    fontSizes,
    setFontSizes,
    isLroDropdownOpen,
    setIsLroDropdownOpen,
    showStatusDropdown,
    setShowStatusDropdown,
    textAlignments,
    setTextAlignments
  };
};