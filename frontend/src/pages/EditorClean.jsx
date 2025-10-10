import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Components
import ProjectLoadingScreen from "../components/ProjectLoadingScreen";
import Sidebar from "../components/Sidebar";
import EditorNavbar from "../components/editor/EditorNavbar";
import SlidesBar from "../components/editor/SlidesBar";
import SavingPopup from "../components/SavingPopup";
import FieldEditorTag from "../components/FieldEditorTag";
import LocationIndicator from "../components/LocationIndicator";

// Slide Components
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

// Simplified Hooks - Clean & Efficient
import { useDeviceSimple } from "../hooks/useDeviceSimple";
import { useEditorStateSimple } from "../hooks/useEditorStateSimple";
import { useUIStateSimple } from "../hooks/useUIStateSimple";
import { useProjectManagerSimple } from "../hooks/useProjectManagerSimple";
import { useHeaderToolbarSimple } from "../hooks/useHeaderToolbarSimple";
import { useCanvasInteractionSimple } from "../hooks/useCanvasInteractionSimple";

// Context
import { EditorProvider } from "../contexts/EditorContext";

// Constants
const NAVBAR_HEIGHT = 72;
const SIDEBAR_WIDTH = 350;
const SLIDES_BAR_HEIGHT = 160;

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
  const { user } = useAuth();
  const { projectId } = useParams();
  const device = useDeviceSimple();
  const canvasRef = useRef(null);

  // Core state management with simplified hooks
  const editorState = useEditorStateSimple();
  const uiState = useUIStateSimple();
  const projectManager = useProjectManagerSimple(user, projectId);
  const headerToolbar = useHeaderToolbarSimple(user, projectId);
  const canvasInteraction = useCanvasInteractionSimple(canvasRef, uiState);

  // Load project when URL changes
  useEffect(() => {
    if (projectId) {
      projectManager.loadProject(projectId);
    }
  }, [projectId]);

  // Load LRO forms on mount
  useEffect(() => {
    headerToolbar.loadLroForms();
  }, []);

  // Create context value for all child components
  const contextValue = {
    // State
    ...editorState,
    ...uiState,
    
    // Managers
    ...projectManager,
    ...headerToolbar,
    ...canvasInteraction,
    
    // Utility
    device,
    slideComponents,
    
    // User
    user,
    sessionUser: user?.username || user?.email,
    
    // Project ID
    currentProjectId: projectId,
    
    // Status functions
    getStatusDisplay: (status) => {
      const displays = {
        'draft': 'Draft',
        'approved': 'Approved', 
        'denied': 'Denied',
        'conditional': 'Conditional'
      };
      return displays[status] || 'Draft';
    }
  };

  // Show loading if project is loading
  if (projectManager.isLoading) {
    return <ProjectLoadingScreen message="Loading project..." />;
  }

  // Get current slide component
  const currentSlideData = editorState.slides?.find(s => s.id === editorState.currentSlide);
  const slideType = currentSlideData?.type?.startsWith('street_view_') 
    ? 'street_view' 
    : currentSlideData?.type;
  const SlideComponent = slideComponents[slideType] || SlideOne;

  return (
    <EditorProvider value={contextValue}>
      {/* Loading/Saving Indicators */}
      <SavingPopup 
        isVisible={headerToolbar.isSaving || headerToolbar.isExporting} 
        message={headerToolbar.isExporting ? "Exporting PDF..." : "Saving project..."} 
      />

      <div className={`editor-page ${device.isMobile ? 'mobile-layout' : ''}`} 
           style={{ height: "100vh", overflow: "hidden" }}>
        
        {/* Navbar */}
        <EditorNavbar />

        {/* Mobile Sidebar Toggle */}
        {device.isMobile && (
          <button
            onClick={() => uiState.setIsMobileSidebarOpen(!uiState.isMobileSidebarOpen)}
            style={{
              position: "fixed", top: NAVBAR_HEIGHT + 20, right: 20,
              width: "50px", height: "50px", backgroundColor: "#007bff",
              color: "white", border: "none", borderRadius: "50%",
              zIndex: 1100, fontSize: "20px"
            }}
          >
            {uiState.isMobileSidebarOpen ? "×" : "☰"}
          </button>
        )}

        {/* Main Layout */}
        <div className="d-flex" style={{ height: "100vh", paddingTop: NAVBAR_HEIGHT }}>
          
          {/* Sidebar */}
          <div
            className={`${device.isMobile ? 'mobile-sidebar' : 'editor-sidebar'} bg-light border-end p-3`}
            style={{
              position: "fixed",
              top: NAVBAR_HEIGHT,
              bottom: uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
              [device.isMobile ? 'right' : 'left']: device.isMobile 
                ? (uiState.isMobileSidebarOpen ? 0 : -SIDEBAR_WIDTH) 
                : 0,
              width: SIDEBAR_WIDTH,
              zIndex: device.isMobile ? 1050 : 1000,
              transition: "all 0.3s ease",
              overflowY: "auto"
            }}
          >
            <Sidebar />
          </div>

          {/* Canvas Area */}
          <div 
            ref={canvasRef}
            className="flex-fill"
            style={{
              marginLeft: !device.isMobile ? SIDEBAR_WIDTH : 0,
              marginBottom: uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
              padding: "20px",
              height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${uiState.showSlidesBar ? SLIDES_BAR_HEIGHT : 0}px)`,
              overflow: "hidden",
              position: "relative",
              cursor: uiState.isDraggingCanvas ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
            {...canvasInteraction.canvasProps}
          >
            {/* Current Slide */}
            <div 
              style={{
                transform: `translate(${uiState.canvasOffset?.x || 0}px, ${uiState.canvasOffset?.y || 0}px) scale(${(uiState.zoomLevel || 100) / 100})`,
                transformOrigin: 'top left',
                width: '1280px', height: '720px',
                background: 'white', position: 'relative',
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              <SlideComponent
                key={editorState.currentSlide}
                slideId={editorState.currentSlide}
                device={device}
                formData={editorState.slideData?.[editorState.currentSlide]?.formData || {}}
                setFormData={(data) => editorState.updateSlideData(editorState.currentSlide, { formData: data })}
                slideData={editorState.slideData?.[editorState.currentSlide] || {}}
                updateSlideData={(data) => editorState.updateSlideData(editorState.currentSlide, data)}
                zoomLevel={uiState.zoomLevel || 100}
                sessionUser={user?.username || user?.email}
                isActiveSlide={true}
              />
            </div>

            {/* UI Overlays */}
            <FieldEditorTag />
            <LocationIndicator />
          </div>
        </div>

        {/* Slides Bar */}
        <SlidesBar />

        {/* Mobile Overlay */}
        {device.isMobile && uiState.isMobileSidebarOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0,0,0,0.5)', zIndex: 1040
            }}
            onClick={() => uiState.setIsMobileSidebarOpen(false)}
          />
        )}
      </div>
    </EditorProvider>
  );
}
