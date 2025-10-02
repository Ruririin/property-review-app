import { useState } from 'react';

/**
 * Custom hook for managing UI-related state
 */
export const useUIState = () => {
  // UI visibility states
  const [showToolbar, setShowToolbar] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSlidesBar, setShowSlidesBar] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showRatings, setShowRatings] = useState(true);

  // Dropdown states
  const [showPopupDropdown, setShowPopupDropdown] = useState(false);
  const [isLroDropdownOpen, setIsLroDropdownOpen] = useState(false);

  // Zoom and view state
  const [zoomLevel, setZoomLevel] = useState(100);

  // Form and field states
  const [selectedField, setSelectedField] = useState(null);
  const [lroSearchTerm, setLroSearchTerm] = useState('');

  // Text formatting states
  const [fontSizes, setFontSizes] = useState({
    insuredName: 96,
    premiseLocation: 37,
    website: 37,
    description: 30,
    lineBusiness: 30,
  });

  const [textAlignments, setTextAlignments] = useState({
    fireStationName: 'left',
    fireStationDistance: 'left',
  });

  return {
    // UI visibility
    showToolbar,
    setShowToolbar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    showSlidesBar,
    setShowSlidesBar,
    showWebsite,
    setShowWebsite,
    showRatings,
    setShowRatings,

    // Dropdowns
    showPopupDropdown,
    setShowPopupDropdown,
    isLroDropdownOpen,
    setIsLroDropdownOpen,

    // Zoom and view
    zoomLevel,
    setZoomLevel,

    // Form and field
    selectedField,
    setSelectedField,
    lroSearchTerm,
    setLroSearchTerm,

    // Text formatting
    fontSizes,
    setFontSizes,
    textAlignments,
    setTextAlignments,
  };
};