import React from 'react';
import { useEditor } from '../contexts/EditorContext';

// Import our extracted components
import FontSizePanel from './sidebar/FontSizePanel';
import WebsitePanel from './sidebar/WebsitePanel';
import MapsPanel from './sidebar/MapsPanel';
import RatingsPanel from './sidebar/RatingsPanel';
import MultipleLocationsPanel from './sidebar/MultipleLocationsPanel';
import InteriorBuilderPanel from './sidebar/InteriorBuilderPanel';
import CommentsSlideOptionsPanel from './sidebar/CommentsSlideOptionsPanel';
import FireHazardSlideOptionsPanel from './sidebar/FireHazardSlideOptionsPanel';
import FireStationSlideOptionsPanel from './sidebar/FireStationSlideOptionsPanel';
import DrawingModeControlsPanel from './sidebar/DrawingModeControlsPanel';
import TextAlignmentControlsPanel from './sidebar/TextAlignmentControlsPanel';
import SidebarToggleButton from './sidebar/SidebarToggleButton';

const Sidebar = () => {
  const { currentSlide, slides } = useEditor();
  
  // Get current slide data for conditional rendering
  const currentSlideData = slides?.find(s => s.id === currentSlide);
  const slideType = currentSlideData?.type;

  return (
    <>
      {/* Always visible panels */}
        <FontSizePanel />
        <WebsitePanel />
        <MapsPanel />
        <RatingsPanel />
        <MultipleLocationsPanel />
        
        {/* Drawing Mode Controls - only when drawing is enabled */}
        <DrawingModeControlsPanel />
        
        {/* Text Alignment Controls - only for fire station slides */}
        {slideType === 'nearest_fire_station' && <TextAlignmentControlsPanel />}
        
        {/* Interior Builder - Only for interior slides */}
        {slideType === 'interior' && <InteriorBuilderPanel />}
        
        {/* Sidebar Toggle Button - at bottom */}
        <SidebarToggleButton />
        
        {/* Slide-specific options - Only show for matching slide types */}
        {slideType === 'comments' && <CommentsSlideOptionsPanel />}
        {slideType === 'fire_hazard' && <FireHazardSlideOptionsPanel />}
        {slideType === 'nearest_fire_station' && <FireStationSlideOptionsPanel />}
        
    </>
  );
};

export default Sidebar;
