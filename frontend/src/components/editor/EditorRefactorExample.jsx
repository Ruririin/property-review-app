/**
 * Editor Refactor Example
 * Demonstrates how to use the new modular toolbar components
 * This shows how the Editor.jsx can be simplified
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import the new modular components
import { HeaderToolbar, SidebarToolbar, SlidesBar } from './index';
import LocationIndicator from '../LocationIndicator';

// Import the custom hooks
import { useHeaderToolbar } from '../../hooks/useHeaderToolbar';
import { useSidebarToolbar } from '../../hooks/useSidebarToolbar';
import { useSlidesBar } from '../../hooks/useSlidesBar';

// Import services
import { apiService, projectSaveService } from '../../services/serviceFactory';
import locationDataService from '../../services/locationDataService';

const EditorRefactorExample = ({ sessionUser }) => {
  const navigate = useNavigate();
  
  // Core editor state
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [slides, setSlides] = useState([
    { id: 1, title: "Property Information", type: "property_info" }
  ]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideData, setSlideData] = useState({});
  const [globalLocationData, setGlobalLocationData] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [fontSizes, setFontSizes] = useState({});
  const [showWebsite, setShowWebsite] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [multipleLocationsMode, setMultipleLocationsMode] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [currentFormId, setCurrentFormId] = useState(null);

  // Initialize custom hooks
  const headerToolbar = useHeaderToolbar(sessionUser, currentProjectId);
  const sidebarToolbar = useSidebarToolbar();
  const slidesBar = useSlidesBar();

  // Helper functions that would be extracted from original Editor.jsx
  const getSlideData = (slideId) => slideData[slideId] || {};
  const updateSlideFormData = (slideId, data) => {
    setSlideData(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        formData: { ...prev[slideId]?.formData, ...data }
      }
    }));
  };

  const syncPositionsToDom = () => {
    // Implementation would sync all slide positions
    console.log('Syncing positions to DOM for PDF export');
  };

  const findIsoCodeByNumber = async (isoCode) => {
    // Implementation would search ISO codes
    console.log('Finding ISO code:', isoCode);
    return null;
  };

  // Save project function
  const saveProject = async (isAutoSave = false) => {
    if (!currentProjectId) return;
    
    const projectData = {
      slides,
      slideData,
      formData: globalLocationData,
      fontSizes,
      showWebsite,
      multipleLocationsMode,
      selectedLocationIndex,
      status: 'editing',
      sessionUser
    };

    await projectSaveService.saveProject(currentProjectId, projectData);
    console.log(isAutoSave ? '🔄 Auto-saved project' : '💾 Manually saved project');
  };

  // Setup header toolbar callbacks
  const headerCallbacks = {
    setCurrentFormId,
    updateSlideFormData,
    setGlobalLocationData,
    getSlideData,
    findIsoCodeByNumber,
    multipleLocationsMode,
    selectedLocationIndex,
    locationDataService
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header Toolbar */}
      <HeaderToolbar
        lroForms={headerToolbar.lroForms}
        isLoadingLroForms={headerToolbar.isLoadingLroForms}
        onLroFormSelect={(formId) => headerToolbar.handleLroFormSelect(formId, headerCallbacks)}
        onLoadLroForms={headerToolbar.loadLroForms}
        onExportPdf={() => headerToolbar.handleExportPdf(slides, slideData, globalLocationData, { syncPositionsToDom })}
        onSaveProject={() => headerToolbar.handleSaveProject(saveProject)}
        onUpdateProjectStatus={headerToolbar.handleUpdateProjectStatus}
        projectTitle="Property Review Maker"
        isExporting={headerToolbar.isExporting}
        isSaving={headerToolbar.isSaving}
      />

      {/* Location Indicator */}
      <LocationIndicator
        multipleLocationsMode={multipleLocationsMode}
        selectedLocationIndex={selectedLocationIndex}
        totalLocations={multipleLocationsMode && globalLocationData.premiseLocation ? 2 : 1}
        currentLocationName={multipleLocationsMode ? `Location ${selectedLocationIndex + 1}` : 'Single Location'}
        onLocationChange={setSelectedLocationIndex}
      />

      {/* Main Content Area */}
      <div className="d-flex" style={{ height: '100vh', paddingTop: '72px' }}>
        
        {/* Sidebar Toolbar */}
        <SidebarToolbar
          selectedField={selectedField}
          fontSizes={fontSizes}
          onFontSizeChange={(value) => sidebarToolbar.handleFontSizeChange(value, selectedField, setFontSizes)}
          showWebsite={showWebsite}
          onToggleWebsite={() => setShowWebsite(!showWebsite)}
          websiteUrl={globalLocationData.website}
          onVisitWebsite={() => sidebarToolbar.handleVisitWebsite(globalLocationData.website)}
          onOpenGoogleMaps={() => sidebarToolbar.handleOpenGoogleMaps(
            globalLocationData, multipleLocationsMode, selectedLocationIndex, slides, currentSlide
          )}
          onOpenBingMaps={() => sidebarToolbar.handleOpenBingMaps(
            globalLocationData, multipleLocationsMode, selectedLocationIndex, slides, currentSlide
          )}
          zoomLevel={zoomLevel}
          onZoomIn={() => sidebarToolbar.handleZoomIn(zoomLevel, setZoomLevel)}
          onZoomOut={() => sidebarToolbar.handleZoomOut(zoomLevel, setZoomLevel)}
          onResetZoom={() => sidebarToolbar.handleResetZoom(setZoomLevel)}
          isDrawingMode={sidebarToolbar.isDrawingMode}
          onToggleDrawingMode={sidebarToolbar.toggleDrawingMode}
          onClearDrawings={() => sidebarToolbar.handleClearDrawings(currentSlide, setSlideData)}
          hasDrawings={slideData[currentSlide]?.drawings?.length > 0}
          multipleLocationsMode={multipleLocationsMode}
          onToggleMultipleLocations={() => sidebarToolbar.handleToggleMultipleLocations(
            currentProjectId, multipleLocationsMode, setMultipleLocationsMode, apiService
          )}
          isVisible={sidebarToolbar.showToolbar}
          onToggleVisibility={() => sidebarToolbar.setShowToolbar(!sidebarToolbar.showToolbar)}
        />

        {/* Main Slide Area */}
        <div 
          className="editor-body" 
          style={{
            flex: 1,
            marginLeft: sidebarToolbar.showToolbar ? '350px' : '0',
            marginBottom: slidesBar.showSlidesBar ? '160px' : '0',
            transition: 'margin 0.3s ease',
            overflow: 'hidden',
            height: 'calc(100vh - 72px)'
          }}
        >
          <div className="p-4">
            <div className="text-center">
              <h3>Slide Content Goes Here</h3>
              <p>Current Slide: {currentSlide}</p>
              <p>Zoom: {zoomLevel}%</p>
              <p>Drawing Mode: {sidebarToolbar.isDrawingMode ? 'ON' : 'OFF'}</p>
              <p>Multiple Locations: {multipleLocationsMode ? 'ON' : 'OFF'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slides Bar */}
      <SlidesBar
        slides={slides}
        currentSlide={currentSlide}
        onSlideSelect={(slideId) => slidesBar.handleSlideSelect(slideId, setCurrentSlide)}
        onSlideDelete={(slideId) => slidesBar.handleSlideDelete(
          slideId, slides, setSlides, currentSlide, setCurrentSlide, setSlideData
        )}
        onAddSlide={() => {
          const newSlide = slidesBar.handleAddSlide(slides, setSlides);
          if (newSlide) {
            setCurrentSlide(newSlide.id);
          }
        }}
        isVisible={slidesBar.showSlidesBar}
        onToggleVisibility={() => slidesBar.setShowSlidesBar(!slidesBar.showSlidesBar)}
      />
    </div>
  );
};

export default EditorRefactorExample;