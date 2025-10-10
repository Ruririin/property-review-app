import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDeviceSimple } from "../hooks/useDeviceSimple";
import { useEditorStateSimple } from "../hooks/useEditorStateSimple";
import { useUIStateSimple } from "../hooks/useUIStateSimple";
import { useProjectManagerSimple } from "../hooks/useProjectManagerSimple";
import { useHeaderToolbarSimple } from "../hooks/useHeaderToolbarSimple";
import { useCanvasInteractionSimple } from "../hooks/useCanvasInteractionSimple";
import { useAuth } from "../contexts/AuthContext";
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

// Remove duplicate hook imports - using simplified hooks already imported above

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

export default function Editor() {
  const { user } = useAuth(); // Get user from authentication context
  const sessionUser = user; // Map user to sessionUser for compatibility
  const device = useDeviceSimple(); // Testing with simplified hook
  const { projectId } = useParams(); // Get project ID from URL
  
  // Canvas ref for interaction handling
  const canvasRef = useRef(null);
  const slideRefs = useRef({});
  const addButtonRef = useRef(null);
  const slidesContainerRef = useRef(null);

  // Use simplified custom hooks that avoid the React instance conflicts
  const editorState = useEditorStateSimple();
  const uiState = useUIStateSimple();
  const projectManager = useProjectManagerSimple(
    sessionUser, 
    projectId, 
    editorState.slides, 
    editorState.slideData, 
    editorState.globalLocationData, 
    editorState.fieldPositions, 
    editorState.multipleLocationsMode,
    editorState.setIsProjectModified,
    editorState.setLastSaveTime
  );
  const headerToolbar = useHeaderToolbarSimple(sessionUser, projectId);
  const canvasInteraction = useCanvasInteractionSimple(uiState, canvasRef);

  // Main branch state variables  
  const [showPopupDropdown, setShowPopupDropdown] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  // Note: showSlidesBar and showRatings are now from uiState hook

  // Navigation protection using custom hook - temporarily disabled due to React Hook conflicts
  // useNavigationProtection(projectState.isProjectModified, () => projectManager.saveProject());

  // Project ID is handled by URL parameter - no additional state needed

  // Load LRO forms on component mount
  useEffect(() => {
    headerToolbar.loadLroForms();
  }, [headerToolbar.loadLroForms]);

  // Project management functions now working via useProjectManagerSimple hook (defined above)

  // Load project when URL parameter changes
  useEffect(() => {
    console.log('📥 Editor effect - projectId from URL:', projectId);
    if (projectId && projectManager?.loadProject) {
      console.log('📥 Auto-loading project:', projectId);
      projectManager.loadProject(projectId).catch(console.error);
    }
  }, [projectId, projectManager?.loadProject]);

  // Update editor state when project is loaded
  useEffect(() => {
    if (projectManager?.currentProject) {
      const project = projectManager.currentProject;
      console.log('📋 Updating editor state with loaded project:', project);

      // Data comes pre-transformed from cleanProjectService
      if (project.slides && project.slides.length > 0) {
        console.log('📋 Using pre-transformed slides:', project.slides);
        console.log('📋 Using pre-transformed slideData:', project.slideData);

        editorState.setSlides(project.slides);
        editorState.setSlideData(project.slideData || {});
        
        // Set current slide to first slide
        if (project.slides[0]?.id) {
          editorState.setCurrentSlide(project.slides[0].id);
        }
      } else if (project.slides && project.slides.length === 0 && editorState.slides?.length > 0) {
        // Don't overwrite existing slides with empty data (like during status updates)
        console.log('📋 Preserving existing slides during project update');
      }

      // Update global location data if available (cleanProjectService provides this)
      if (project.formData) {
        console.log('📋 Setting global location data:', project.formData);
        editorState.setGlobalLocationData(project.formData);
      }

      // Update project settings
      if (project.multiple_locations_mode !== undefined) {
        editorState.setMultipleLocationsMode(project.multiple_locations_mode);
      }
    }
  }, [projectManager?.currentProject]);

  // Drawing and interaction hooks - temporarily disabled due to React Hook conflicts
  // const drawing = useDrawing(...);
  const drawing = {
    isDrawingMode: false,
    setIsDrawing: () => {},
    setCurrentDrawing: () => {},
    currentDrawing: null,
    rectToPoints: () => {}
  };

  // Canvas interaction hook already declared above
  // const slideManager = useSlideManager(...); - temporarily disabled due to React Hook conflicts
  const slideManager = {
    updateSlideFormData: (slideId, newFormData) => {
      console.log('📝 Updating slide form data:', slideId, newFormData);
      
      const currentSlideData = editorState.slideData[slideId] || {};
      const updatedSlideData = {
        ...currentSlideData,
        formData: {
          ...currentSlideData.formData,
          ...newFormData
        }
      };
      
      editorState.setSlideData({
        ...editorState.slideData,
        [slideId]: updatedSlideData
      });
      
      // If this is slide 1 (cover slide), also update global location data
      if (slideId === 1) {
        console.log('📝 Updating global location data from slide 1:', newFormData);
        editorState.setGlobalLocationData({
          ...editorState.globalLocationData,
          ...newFormData
        });
      }
    },
    getSlideData: (slideId) => editorState.slideData[slideId] || {},
    // Add other slideManager methods as needed
  };



  // Create context value with all the state and functions
  const contextValue = {
    // Editor state
    ...editorState,
    // UI state
    ...uiState,
    // Project state
    currentProjectId: projectId,
    isProjectModified: false,
    currentProjectStatus: projectManager?.currentProject?.status || 'draft',
    showStatusDropdown: uiState.showStatusDropdown,
    setShowStatusDropdown: uiState.setShowStatusDropdown,
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
    lroSearchTerm: headerToolbar.lroSearchTerm,
    setLroSearchTerm: headerToolbar.setLroSearchTerm,
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
    updateProjectStatus: async (status) => {
      try {
        await headerToolbar.handleUpdateProjectStatus(status);
        // Update the local project state while preserving all existing data
        if (projectManager?.currentProject) {
          console.log('📊 Preserving project data during status update');
          projectManager.setCurrentProject({
            ...projectManager.currentProject,
            status: status,
            // Ensure slides and slideData are preserved
            slides: projectManager.currentProject.slides || editorState.slides,
            slideData: projectManager.currentProject.slideData || editorState.slideData,
            formData: projectManager.currentProject.formData || editorState.globalLocationData
          });
        }
        // Close the dropdown
        uiState.setShowStatusDropdown(false);
      } catch (error) {
        console.error('Failed to update project status:', error);
      }
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
    // Utility functions
    exportToPDF,
    slideComponents,
    device,
    // User info
    sessionUser,
    user,
    // Font size handler
    handleFontSizeChange: (e) => {
      const newSize = parseInt(e.target.value);
      if (uiState.selectedField && !isNaN(newSize)) {
        uiState.setFontSizes({
          ...uiState.fontSizes,
          [uiState.selectedField]: newSize
        });
      }
    }
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
  if (projectManager.isLoading) {
    return <ProjectLoadingScreen message="Loading project..." />;
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
        isVisible={headerToolbar.isSaving || headerToolbar.isExporting || projectManager.isLoading} 
        message={
          headerToolbar.isExporting ? "Exporting PDF..." :
          headerToolbar.isSaving ? "Saving project..." :
          projectManager.isLoading ? "Loading project..." :
          "Processing..."
        } 
      />
      
      <div className={`editor-page position-relative ${device.isMobile ? 'mobile-layout' : ''} ${device.isTablet ? 'tablet-layout' : ''}`} style={{ height: "100vh", overflow: "hidden" }}>
      
      {/* Unsaved Changes Indicator */}
      {false && (
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
          {...(canvasInteraction?.canvasProps || {})}
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
                formData={{
                  // Global fields that should be shared across all slides
                  insuredName: editorState.globalLocationData?.insuredName || '',
                  premiseLocation: editorState.globalLocationData?.premiseLocation || '',
                  website: editorState.globalLocationData?.website || '',
                  // Slide-specific fields
                  ...(getSlideData(editorState.currentSlide)?.formData || {}),
                  // Global fields override slide-specific ones for consistency
                  insuredName: editorState.globalLocationData?.insuredName || '',
                  premiseLocation: editorState.globalLocationData?.premiseLocation || '',
                  website: editorState.globalLocationData?.website || '',
                }}
                globalFormData={editorState.globalLocationData || {}}
                setFormData={(updates) => {
                  console.log(`📝 Slide ${editorState.currentSlide} form update:`, updates);
                  
                  // Identify global fields that should be shared across all slides
                  const globalFields = ['insuredName', 'premiseLocation', 'website'];
                  const globalUpdates = {};
                  const slideUpdates = {};
                  
                  // Split updates into global and slide-specific
                  Object.keys(updates).forEach(key => {
                    if (globalFields.includes(key)) {
                      globalUpdates[key] = updates[key];
                    } else {
                      slideUpdates[key] = updates[key];
                    }
                  });
                  
                  // Update global location data for global fields
                  if (Object.keys(globalUpdates).length > 0) {
                    console.log('📝 Updating global location data:', globalUpdates);
                    editorState.setGlobalLocationData({
                      ...editorState.globalLocationData,
                      ...globalUpdates
                    });
                  }
                  
                  // Always update slide-specific data
                  slideManager.updateSlideFormData(editorState.currentSlide, updates);
                }}
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