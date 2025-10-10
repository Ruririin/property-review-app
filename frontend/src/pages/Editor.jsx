import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDevice } from "../hooks/useDevice";
import ProjectLoadingScreen from "../components/ProjectLoadingScreen";
import Sidebar from "../components/Sidebar";
import "../styles/mobile.css";

// Slide components
import SlideOne from "./slides/SlideOne";
import SlideTwo from "./slides/SlideTwo";
import SlideThree from "./slides/SlideThree";
import StreetView from "./slides/StreetView";
import Interior from "./slides/Interior";
import OnlinePresence from "./slides/OnlinePresence";
import License from "./slides/License";
import Comments from "./slides/Comments";
import FireHazard from "./slides/FireHazard";
import CrimeRate from "./slides/CrimeRate";
import NearestFireStation from "./slides/NearestFireStation";
import Website from "./slides/Website";
import Ratings from "./slides/Ratings";

// Services and utilities
import { exportToPDF } from "../utils/pdfExport";
import { exportAllSlidesToPDF } from "../utils/newPdfExport";
import FieldEditorTag from "../components/FieldEditorTag";
import LocationIndicator from "../components/LocationIndicator";
import EditorNavbar from "../components/editor/EditorNavbar";
import SlidesBar from "../components/editor/SlidesBar";
import SavingPopup from "../components/SavingPopup";

// Constants
const NAVBAR_HEIGHT = 72;
const SIDEBAR_WIDTH = 350;
const SLIDES_BAR_HEIGHT = 160;

// Button styles from main branch
const BUTTON_STYLES = {
  slideToggle: {
    position: "absolute",
    top: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60px",
    height: "20px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderBottom: "none",
    borderRadius: "6px 6px 0 0",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  }
};

// Debug utilities (removed for production)

// Custom hooks - this is where the magic happens!
import { useDrawing } from "../hooks/useDrawing";
import { useProjectManager } from "../hooks/useProjectManager";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction";
import { useSlideManager } from "../hooks/useSlideManager";
import { useProjectState } from "../hooks/useProjectState";
import { useUIState } from "../hooks/useUIState";
import { useEditorState } from "../hooks/useEditorState";
import { useSlidesBar } from "../hooks/useSlidesBar";
import { useHeaderToolbar } from "../hooks/useHeaderToolbar";
import { useNavigationProtection } from "../hooks/useNavigationProtection";

// Context
import { EditorProvider } from "../contexts/EditorContext";

// Slide component mapping
const slideComponents = {
  cover: SlideOne,
  'slide-2': SlideTwo,
  'slide-3': SlideThree,
  street_view: StreetView,
  interior: Interior,
  online_presence: OnlinePresence,
  license: License,
  comments: Comments,
  fire_hazard: FireHazard,
  crime_rate: CrimeRate,
  nearest_fire_station: NearestFireStation,
  website: Website,
  ratings: Ratings
};

export default function Editor({ sessionUser }) {
  const device = useDevice();
  const { projectId } = useParams(); // Get project ID from URL
  
  // Canvas ref for interaction handling
  const canvasRef = useRef(null);
  const slideRefs = useRef({});
  const addButtonRef = useRef(null);
  const slidesContainerRef = useRef(null);

  // Use all the custom hooks to replace hundreds of lines of inline logic
  const editorState = useEditorState();
  const uiState = useUIState();
  const projectState = useProjectState();
  const slidesBar = useSlidesBar();
  const headerToolbar = useHeaderToolbar(sessionUser, projectState.currentProjectId);

  // Main branch state variables  
  const [showPopupDropdown, setShowPopupDropdown] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  // Note: showSlidesBar and showRatings are now from uiState hook

  // Navigation protection using custom hook
  useNavigationProtection(projectState.isProjectModified, () => projectManager.saveProject());

  // Set project ID from URL parameter
  useEffect(() => {
    if (projectId && projectId !== projectState.currentProjectId) {
      projectState.setCurrentProjectId(projectId);
    }
  }, [projectId, projectState.currentProjectId, projectState.setCurrentProjectId]);

  // Load LRO forms on component mount
  useEffect(() => {
    headerToolbar.loadLroForms();
  }, [headerToolbar.loadLroForms]);

  // Project management functions
  const projectManager = useProjectManager(
    sessionUser,
    editorState.slides,
    editorState.setSlides,
    editorState.slideData,
    editorState.setSlideData,
    editorState.globalLocationData,
    editorState.setGlobalLocationData,
    editorState.multipleLocationsMode,
    editorState.setMultipleLocationsMode,
    editorState.slideTypeCounts,
    editorState.setSlideTypeCounts,
    editorState.nextSlideId,
    editorState.setNextSlideId,
    editorState.setCurrentSlide,
    editorState.fieldPositions,
    editorState.setFieldPositions,
    projectState.setIsLoadingProject,
    projectState.setLoadingMessage,
    projectState.currentProjectId,
    projectState.setCurrentProjectId,
    projectState.setCurrentProjectStatus,
    projectState.setIsProjectModified,
    projectState.setLastSaveTime,
    uiState.setShowWebsite
  );

  // Load project when URL parameter changes
  useEffect(() => {
    console.log('📥 Editor effect - projectId from URL:', projectId, 'currentProjectId:', projectState.currentProjectId);
    if (projectId && projectId !== projectState.currentProjectId && projectManager?.loadProject) {
      console.log('📥 Auto-loading project:', projectId);
      projectManager.loadProject(projectId).catch(console.error);
    }
  }, [projectId, projectState.currentProjectId, projectManager?.loadProject]);

  // Drawing and interaction hooks (these need the state from above)
  const drawing = useDrawing(
    editorState.slideData,
    editorState.setSlideData,
    editorState.currentSlide,
    uiState.zoomLevel,
    uiState.canvasOffset
  );
  
  // Debug logging for canvas interaction props
  // Canvas interaction is working properly now

  const canvasInteraction = useCanvasInteraction(
    drawing?.isDrawingMode || false,
    drawing?.setIsDrawing,
    drawing?.setCurrentDrawing,
    uiState?.setIsDraggingCanvas || (() => console.warn('setIsDraggingCanvas not available')),
    uiState?.setDragStart || (() => console.warn('setDragStart not available')),
    uiState?.isDraggingCanvas || false,
    uiState?.dragStart || { x: 0, y: 0 },
    uiState?.canvasOffset || { x: 0, y: 0 },
    uiState?.setCanvasOffset || (() => console.warn('setCanvasOffset not available')),
    uiState?.zoomLevel || 100,
    uiState?.setZoomLevel || (() => console.warn('setZoomLevel not available')),
    canvasRef,
    drawing?.currentDrawing || null,
    editorState?.slideData || {},
    editorState?.setSlideData,
    editorState?.currentSlide || 1,
    drawing?.rectToPoints || (() => {})
  );
  const slideManager = useSlideManager(
    editorState.slides,
    editorState.setSlides,
    editorState.slideData,
    editorState.setSlideData,
    editorState.globalLocationData,
    editorState.setGlobalLocationData,
    editorState.multipleLocationsMode,
    editorState.selectedLocationIndex,
    editorState.slideTypeCounts,
    editorState.setSlideTypeCounts,
    editorState.nextSlideId,
    editorState.setNextSlideId,
    editorState.currentSlide,
    editorState.setCurrentSlide,
    editorState.fieldPositions,
    editorState.setFieldPositions,
    sessionUser,
    projectState.currentProjectId,
    projectState.setIsProjectModified
  );



  // Create context value with all the state and functions
  const contextValue = {
    // Editor state
    ...editorState,
    // UI state
    ...uiState,
    // Project state
    ...projectState,
    // Project manager functions
    ...projectManager,
    // Drawing functions
    ...drawing,
    // Canvas interaction
    ...canvasInteraction,
    // Slide manager
    ...slideManager,
    // Header toolbar functions
    ...headerToolbar,
    lroForms: headerToolbar.lroForms,
    isLoadingLroForms: headerToolbar.isLoadingLroForms,
    handleLroFormSelect: (formId) => {
      headerToolbar.handleLroFormSelect(formId, {
        setCurrentFormId: (id) => console.log('Set current form ID:', id),
        updateSlideFormData: slideManager.updateSlideFormData,
        setGlobalLocationData: editorState.setGlobalLocationData,
        getSlideData: slideManager.getSlideData,
        findIsoCodeByNumber: () => null,
        multipleLocationsMode: editorState.multipleLocationsMode,
        selectedLocationIndex: editorState.selectedLocationIndex,
        locationDataService: editorState.locationDataService
      });
      uiState.setIsLroDropdownOpen(false);
    },
    handleExportToPDF: () => {
      // Use the headerToolbar's export function to get proper loading states
      headerToolbar.handleExportPdf(
        editorState.slides,
        editorState.slideData,
        editorState.globalLocationData,
        {
          syncPositionsToDom: () => console.log('Syncing positions to DOM before export'),
          sessionUser: sessionUser,
          currentSlide: editorState.currentSlide,
          setCurrentSlide: editorState.setCurrentSlide
        }
      );
    },
    saveProject: () => {
      headerToolbar.handleSaveProject(() => projectManager.saveProject(false));
    },
    currentProjectStatus: projectState.currentProjectStatus,
    showStatusDropdown: projectState.showStatusDropdown,
    setShowStatusDropdown: projectState.setShowStatusDropdown,
    updateProjectStatus: (status) => {
      projectState.setCurrentProjectStatus(status);
      headerToolbar.handleUpdateProjectStatus(status);
    },
    getStatusDisplay: (status) => {
      const displays = {
        'draft': 'Draft',
        'approved': 'Approved', 
        'denied': 'Denied',
        'conditional': 'Conditional'
      };
      return displays[status] || 'Draft';
    },
    // Services
    apiService: projectState.apiService,
    editorApiService: projectState.editorApiService,
    locationDataService: projectState.locationDataService,
    // Utility functions
    exportToPDF,
    slideComponents,
    device
  };

  // Main branch variables and functions
  const { slides, currentSlide, slideData, nextSlideId, slideTypeCounts, setSlides, setCurrentSlide, setSlideData, setNextSlideId, setSlideTypeCounts } = editorState;
  const { multipleLocationsMode, selectedLocationIndex } = editorState;

  // SlideOptions from main branch
  const slideOptions = [
    'Street View',
    'Aerial View - Google', 
    'Aerial View - Bing',
    'Interior',
    'Online Presence',
    'License',
    'Comments',
    'Fire Hazard',
    'Crime Rate',
    'Nearest Fire Station',
    'Website',
    'Ratings'
  ];

  // Add slide function from main branch
  const addSlide = (slideType) => {
    const slideTypeKey = slideType.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    
    // Handle special cases
    let actualSlideType = slideTypeKey;
    let slideTitle = slideType;
    
    if (slideTypeKey === 'street_view') {
      const newCount = slideTypeCounts.street_view + 1;
      slideTitle = `Street View ${newCount}`;
      actualSlideType = `street_view_${newCount}`;
      
      setSlideTypeCounts(prev => ({
        ...prev,
        street_view: newCount
      }));
    } else if (slideType === 'Aerial View - Google') {
      actualSlideType = 'slide-2';
      slideTitle = 'Google Aerial View';
    } else if (slideType === 'Aerial View - Bing') {
      actualSlideType = 'slide-3';
      slideTitle = 'Bing Aerial View';
    }

    // Create new slide
    const newSlide = {
      id: nextSlideId,
      type: actualSlideType,
      title: slideTitle,
      locationIndex: multipleLocationsMode ? selectedLocationIndex : 0
    };

    // Add slide and switch to it
    setSlides([...slides, newSlide]);
    setCurrentSlide(newSlide.id);
    setNextSlideId(nextSlideId + 1);
    setShowPopupDropdown(false);
  };

  // Delete slide function
  const deleteSlide = (slideId) => {
    if (slides.length > 1) {
      const slideToDelete = slides.find(slide => slide.id === slideId);
      const updatedSlides = slides.filter(slide => slide.id !== slideId);
      
      // Update counters if needed
      if (slideToDelete && slideToDelete.type.startsWith('street_view')) {
        setSlideTypeCounts(prev => ({
          ...prev,
          street_view: Math.max(0, prev.street_view - 1)
        }));
      }
      
      setSlides(updatedSlides);
      
      // Remove slide data
      setSlideData(prev => {
        const newData = { ...prev };
        delete newData[slideId];
        return newData;
      });
      
      if (currentSlide === slideId) {
        setCurrentSlide(updatedSlides[0].id);
      }
    }
  };

  // Get slide data function - use slideManager's version for proper global data merging
  const getSlideData = slideManager.getSlideData;

  // Position dropdown based on button position
  useEffect(() => {
    if (showPopupDropdown && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      const isNearBottom = rect.bottom > window.innerHeight - 220;
      const isNearRight = rect.right > window.innerWidth - 200;
      
      setPopupPosition({
        top: isNearBottom ? rect.top - 200 : rect.bottom + 5,
        left: isNearRight ? rect.left - 180 : rect.left
      });
    }
  }, [showPopupDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPopupDropdown && 
          addButtonRef.current && 
          !addButtonRef.current.contains(event.target) &&
          !event.target.closest('.dropdown-item')) {
        setShowPopupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopupDropdown]);

  // Show loading screen if loading project
  if (projectState.isLoadingProject) {
    return <ProjectLoadingScreen message={projectState.loadingMessage} />;
  }

  // Get current slide component
  const currentSlideData = editorState.slides?.find(s => s.id === editorState.currentSlide);
  
  // Handle dynamic slide type mapping (e.g., street_view_1, street_view_2, etc.)
  let slideType = currentSlideData?.type;
  if (slideType && slideType.startsWith('street_view_')) {
    slideType = 'street_view';
  }
  
  const SlideComponent = currentSlideData ? slideComponents[slideType] : SlideOne;

  return (
    <EditorProvider value={contextValue}>
      {/* Saving Popup */}
      <SavingPopup 
        isVisible={headerToolbar.isSaving || headerToolbar.isExporting || projectState.isLoadingProject} 
        message={
          headerToolbar.isExporting ? "Exporting PDF..." :
          headerToolbar.isSaving ? "Saving project..." :
          projectState.isLoadingProject ? projectState.loadingMessage :
          "Processing..."
        } 
      />
      
      <div className={`editor-page position-relative ${device.isMobile ? 'mobile-layout' : ''} ${device.isTablet ? 'tablet-layout' : ''}`} style={{ height: "100vh", overflow: "hidden" }}>
      
      {/* Unsaved Changes Indicator */}
      {projectState.isProjectModified && (
        <div
          style={{
            position: "fixed",
            top: NAVBAR_HEIGHT + 10,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ffc107",
            color: "#212529",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            zIndex: 1001,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "2px solid #ffca28"
          }}
        >
          ⚠️ Unsaved changes - Save before leaving (Ctrl+S)
        </div>
      )}
      
      {/* Mobile Sidebar Toggle Button */}
      {device.isMobile && (
        <button
          onClick={() => uiState.setIsMobileSidebarOpen(!uiState.isMobileSidebarOpen)}
          style={{
            position: "fixed",
            top: NAVBAR_HEIGHT + 20,
            right: 20,
            width: "50px",
            height: "50px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "50%",
            fontSize: "20px",
            zIndex: 1100,
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {uiState.isMobileSidebarOpen ? "×" : "☰"}
        </button>
      )}

      {/* Main Branch Navbar */}
      <EditorNavbar />

      {/* Editor Layout */}
      <div className="d-flex" style={{ height: "100vh", paddingTop: NAVBAR_HEIGHT }}>
        
        {/* Desktop/Tablet Sidebar */}
        {!device.isMobile && (
          <div
            className="editor-sidebar bg-light border-end p-3 shadow custom-scrollbar"
            style={{
              position: "fixed",
              top: NAVBAR_HEIGHT,
              bottom: uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
              left: 0,
              width: SIDEBAR_WIDTH,
              zIndex: 1000,
              transition: "left 0.3s ease-in-out, bottom 0.3s ease",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "#c1c1c1 #f1f1f1",
            }}
          >
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar */}
        {device.isMobile && (
          <div
            className={`mobile-sidebar bg-light border-start p-3 shadow custom-scrollbar ${uiState.isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}
            style={{
              position: "fixed",
              top: NAVBAR_HEIGHT,
              right: uiState.isMobileSidebarOpen ? 0 : -SIDEBAR_WIDTH,
              width: SIDEBAR_WIDTH,
              height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
              zIndex: 1050,
              transition: "right 0.3s ease-in-out",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "#c1c1c1 #f1f1f1",
            }}
          >
            <Sidebar />
          </div>
        )}

        {/* Main Content Area */}
        <div 
          ref={canvasRef}
          className="flex-fill"
          style={{
            marginLeft: !device.isMobile ? SIDEBAR_WIDTH : 0,
            marginBottom: uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
            paddingTop: "20px",
            paddingLeft: "20px",
            paddingRight: "20px",
            height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0}px)`,
            overflow: "hidden",
            position: "relative",
            cursor: uiState.isDraggingCanvas ? 'grabbing' : 'grab',
            touchAction: 'none',
            transition: "margin 0.3s ease, height 0.3s ease"
          }}
          tabIndex={0}
          onMouseDown={canvasInteraction?.handleCanvasMouseDown || (() => {})}
          onMouseMove={canvasInteraction?.handleCanvasMouseMove || (() => {})}
          onMouseUp={canvasInteraction?.handleCanvasMouseUp || (() => {})}
          onTouchStart={canvasInteraction?.handleTouchStart || (() => {})}
          onTouchMove={canvasInteraction?.handleTouchMove || (() => {})}
          onTouchEnd={canvasInteraction?.handleTouchEnd || (() => {})}
        >
          {/* Current Slide Display */}
          {SlideComponent && (
            <div 
              id={`slide-container-${editorState.currentSlide}`}
              data-slide-id={editorState.currentSlide}
              style={{
                transform: `translate(${(uiState.canvasOffset?.x || 0)}px, ${(uiState.canvasOffset?.y || 0)}px) scale(${uiState.zoomLevel / 100})`,
                transformOrigin: 'top left',
                transition: uiState.isDraggingCanvas ? 'none' : 'transform 0.1s ease',
                width: '1280px',
                height: '720px',
                position: 'relative',
                marginBottom: '20px',
                background: 'white',
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              <SlideComponent
                key={editorState.currentSlide}
                slideId={editorState.currentSlide}
                device={device}
                formData={getSlideData(editorState.currentSlide)?.formData || {}}
                globalFormData={editorState.slideData || {}}
                setFormData={slideManager.updateSlideFormData.bind(null, editorState.currentSlide)}
                fontSizes={uiState.fontSizes || {}}
                showWebsite={uiState.showWebsite || true}
                setShowWebsite={uiState.setShowWebsite}
                multipleLocationsMode={editorState.multipleLocationsMode}
                setMultipleLocationsMode={editorState.setMultipleLocationsMode}
                selectedLocationIndex={editorState.selectedLocationIndex}
                fieldPositions={editorState.fieldPositions}
                setFieldPositions={editorState.setFieldPositions}
                zoomLevel={uiState.zoomLevel || 100}
                sessionUser={sessionUser}
                currentFormId={editorState.currentSlide}
                selectedField={uiState.selectedField || null}
                onSelect={uiState.setSelectedField}
                // Additional props required by SlideTwo and SlideThree
                slideData={editorState.slideData?.[editorState.currentSlide] || {}}
                updateSlideData={(newData) => {
                  const currentData = editorState.slideData?.[editorState.currentSlide] || {};
                  editorState.setSlideData({
                    ...editorState.slideData,
                    [editorState.currentSlide]: {
                      ...currentData,
                      ...newData
                    }
                  });
                }}
                allSlideData={editorState.slideData || {}}
                slides={editorState.slides || []}
                isActiveSlide={true}
              />
            </div>
          )}



          {/* Field Editor Tags */}
          <FieldEditorTag />

          {/* Location Indicator */}
          <LocationIndicator />
        </div>
      </div>

      {/* Proper SlidesBar Component */}
      <SlidesBar
        slides={editorState.slides || []}
        currentSlide={editorState.currentSlide}
        onSlideSelect={(slideId) => editorState.setCurrentSlide(slideId)}
        onSlideDelete={(slideId) => deleteSlide(slideId)}
        isVisible={uiState.showSlidesBar}
        onToggleVisibility={() => uiState.setShowSlidesBar(!uiState.showSlidesBar)}
        // Main branch dropdown props
        showPopupDropdown={showPopupDropdown}
        setShowPopupDropdown={setShowPopupDropdown}
        popupPosition={popupPosition}
        slideOptions={slideOptions}
        addSlide={addSlide}
        addButtonRef={addButtonRef}
        showWebsite={uiState.showWebsite}
        showRatings={uiState.showRatings}
        getSlideData={getSlideData}
        // Zoom controls
        zoomLevel={uiState.zoomLevel}
        onZoomIn={() => {
          const newZoom = Math.min(uiState.zoomLevel + 10, 200);
          uiState.setZoomLevel(newZoom);
        }}
        onZoomOut={() => {
          const newZoom = Math.max(uiState.zoomLevel - 10, 50);
          uiState.setZoomLevel(newZoom);
        }}
        onZoomReset={() => {
          uiState.setZoomLevel(100);
          uiState.setCanvasOffset({ x: 0, y: 0 });
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {device.isMobile && uiState.isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
          onClick={() => uiState.setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
    </EditorProvider>
  );
}