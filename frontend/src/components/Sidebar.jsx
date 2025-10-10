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
    <div className="sidebar">
      {/* Always visible panels */}
      <div className="sidebar-panel">
        <FontSizePanel />
      </div>
      <div className="sidebar-panel">
        <WebsitePanel />
      </div>
      <div className="sidebar-panel">
        <MapsPanel />
      </div>
      <div className="sidebar-panel">
        <RatingsPanel />
      </div>
      <div className="sidebar-panel">
        <MultipleLocationsPanel />
      </div>
      
      {/* Drawing Mode Controls - only when drawing is enabled */}
      <div className="sidebar-panel">
        <DrawingModeControlsPanel />
      </div>
      
      {/* Text Alignment Controls - only for fire station slides */}
      {slideType === 'nearest_fire_station' && (
        <div className="sidebar-panel">
          <TextAlignmentControlsPanel />
        </div>
      )}
      
      {/* Interior Builder - Only for interior slides */}
      {slideType === 'interior' && (
        <div className="sidebar-panel">
          <InteriorBuilderPanel />
        </div>
      )}
      
      {/* Sidebar Toggle Button - at bottom */}
      <div className="sidebar-panel">
        <SidebarToggleButton />
      </div>
      
      {/* Slide-specific options - Only show for matching slide types */}
      {slideType === 'comments' && (
        <div className="sidebar-panel">
          <CommentsSlideOptionsPanel />
        </div>
      )}
      {slideType === 'fire_hazard' && (
        <div className="sidebar-panel">
          <FireHazardSlideOptionsPanel />
        </div>
      )}
      {slideType === 'nearest_fire_station' && (
        <div className="sidebar-panel">
          <FireStationSlideOptionsPanel />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
