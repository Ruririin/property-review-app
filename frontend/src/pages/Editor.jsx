import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDevice } from "../hooks/useDevice";
import ProjectLoadingScreen from "../components/ProjectLoadingScreen";
import Sidebar from "../components/Sidebar";
import "../styles/mobile.css";
import SlideOne from "./slides/SlideOne";
import SlideTwo from "./slides/SlideTwo";
import SlideThree from "./slides/SlideThree";
import StreetView from "./slides/StreetView";
import Interior from "./slides/Interior";
import OnlinePresence from "./slides/OnlinePresence";
import Inspection from "./slides/Inspection";
import Comments from "./slides/Comments";
import FireHazard from "./slides/FireHazard";
import CrimeRate from "./slides/CrimeRate";
import NearestFireStation from "./slides/NearestFireStation";
import Website from "./slides/Website";
import Ratings from "./slides/Ratings";
import AerialView from "./slides/AerialView";
// Using screenshot-based PDF export for pixel-perfect results
import { exportToPDFScreenshot, previewPDFScreenshot } from "../utils/pdfExportScreenshot";
import exportedItemsService from "../services/exportedItemsService";
import userActivityService from "../services/userActivityService";
import fieldActivityService from "../services/fieldActivityService";
import apiService from "../services/apiService";
import editorApiService from "../services/editorApiService";
import projectSaveService from "../services/projectSaveService";
import locationDataService from "../services/locationDataService";
import LocationIndicator from "../components/LocationIndicator";
import PDFPreviewModal from "../components/PDFPreviewModal";
import { cleanupPDFPreview } from "../services/pdfPreviewService";
import { useAuth } from "../contexts/AuthContext";

const NAVBAR_HEIGHT = 72;
const SIDEBAR_WIDTH = 350; // Increased to accommodate wider comment options
const SLIDES_BAR_HEIGHT = 160; // Increased height to show scroll bar properly
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

// CACHE-BUSTER: New Best Places function to force browser refresh
const handleBestPlacesClickSept4_2025_FINAL = (globalLocationData, multipleLocationsMode, parseMultipleLocations, slides, currentSlide, selectedLocationIndex) => {
  console.log('BRAND NEW FUNCTION EXECUTED - SEPT 4 2025! 🆕🆕🆕');
  alert('SUCCESS! New function is working!');
  
  console.log('� Parameters:', { globalLocationData, multipleLocationsMode, slides, currentSlide, selectedLocationIndex });
  
  let location = '';
  if (multipleLocationsMode && globalLocationData.premiseLocation) {
    const locations = parseMultipleLocations(globalLocationData.premiseLocation);
    const currentSlideInfo = slides.find(s => s.id === currentSlide);
    
    if (locations.length > 1) {
      if (currentSlideInfo && typeof currentSlideInfo.locationIndex === 'number') {
        location = locations[currentSlideInfo.locationIndex] || locations[0];
      } else {
        location = locations[selectedLocationIndex] || locations[0];
      }
    } else {
      location = locations[0] || globalLocationData.premiseLocation;
    }
  } else {
    location = globalLocationData.premiseLocation;
  }
  
  if (location) {
    console.log('FRESH Best Places - Processing location:', location);
    const zipMatch = location.match(/\b(\d{5})/);
    
    if (zipMatch) {
      const zipCode = zipMatch[1];
      const bestPlacesUrl = `https://www.bestplaces.net/search/?q=${zipCode}`;
      console.log('FRESH Best Places - Zip code:', zipCode);
      console.log('FRESH Best Places - URL:', bestPlacesUrl);
      window.open(bestPlacesUrl, '_blank');
    } else {
      console.log('FRESH Best Places - No zip code found in:', location);
      alert('Could not extract zip code from the location.');
    }
  } else {
    alert('Please enter a location first');
  }
};

const BUTTON_STYLES = {
  toggleArrow: {
    position: "absolute",
    width: "20px",
    height: "60px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "0 6px 6px 0",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  zoomButton: {
    width: "28px",
    height: "28px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold"
  },
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

const SlidePreview = ({ slide, index, isActive, onClick, onDelete, canDelete, multipleLocationsMode, slideLocationIndex }) => (
  <div
    className={`position-relative cursor-pointer border ${isActive ? "border-primary border-2" : "border-light"}`}
    onClick={() => onClick(slide.id)}
    style={{
      width: "130px", // Fixed width instead of minWidth
      height: "80px", // Fixed height
      cursor: "pointer",
      borderRadius: "8px",
      background: isActive ? "#f8f9ff" : "#f8f9fa",
      margin: "10px 8px 10px 8px",
      flexShrink: 0, // Crucial for horizontal scrolling
      boxShadow: isActive ? "0 2px 8px rgba(0,123,255,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease"
    }}
  >
    {/* Location indicator for multiple locations mode */}
    {multipleLocationsMode && slideLocationIndex !== undefined && (
      <div
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          backgroundColor: "#8B9A5B",
          color: "white",
          fontSize: "10px",
          padding: "2px 6px",
          borderRadius: "10px",
          fontWeight: "bold",
          zIndex: 10
        }}
      >
        L{slideLocationIndex + 1}
      </div>
    )}
    
    <div className="h-100 d-flex align-items-center justify-content-center p-2">
      <small 
        className="text-center" 
        style={{ 
          fontSize: "10px", 
          lineHeight: "1.2",
          fontWeight: isActive ? "600" : "normal",
          color: isActive ? "#0d6efd" : "#6c757d",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 3, // Allow max 3 lines
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word"
        }}
      >
        {slide.title}
      </small>
    </div>
    <span
      className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
      style={{ 
        top: "5px", left: "5px", // Moved inside the container
        width: "20px", height: "20px", 
        fontSize: "10px", 
        fontWeight: "bold",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }}
    >
      {index + 1}
    </span>
    {canDelete && (
      <button
        className="btn btn-sm position-absolute"
        style={{
          backgroundColor: '#2d5016',
          borderColor: '#2d5016',
          color: 'white',
          bottom: "5px", right: "5px", // Moved to bottom-right corner
          width: "20px", height: "20px",
          fontSize: "12px", padding: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          border: "2px solid white"
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(slide.id);
        }}
        title="Delete slide"
      >
        ×
      </button>
    )}
  </div>
);

export default function Editor() {
  const device = useDevice();
  const { user } = useAuth();
  const sessionUser = user?.username || user?.email;
  const isAdmin = user?.is_staff === true;
  const { projectId: urlProjectId } = useParams();
  const [slides, setSlides] = useState([{ id: 1, type: 'cover', title: 'Cover Page' }]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [nextSlideId, setNextSlideId] = useState(2); // Track next available ID
  
  // Project save state
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading project...");

  // PDF preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  
  // Drawing tool state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [isSquareEditMode, setIsSquareEditMode] = useState(false); // New state for square editing after drawing
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggingPointIndex, setDraggingPointIndex] = useState(null); // 0=topLeft, 1=topRight, 2=bottomLeft, 3=bottomRight
  // Automatically enable square edit mode when exiting drawing mode if squares exist
  useEffect(() => {
    if (!isDrawingMode && !isSquareEditMode) {
      const currentSlideDrawings = getSlideData(currentSlide)?.drawings || [];
      if (currentSlideDrawings.length > 0) {
        setIsSquareEditMode(true);
      }
    }
  }, [isDrawingMode, currentSlide]);

  // Helper function to convert rectangle to points (for backward compatibility)
  const rectToPoints = (drawing) => {
    if (drawing.points) {
      return drawing.points; // Already has points
    }
    
    // Convert old rectangle format to points
    const minX = Math.min(drawing.startX, drawing.endX);
    const minY = Math.min(drawing.startY, drawing.endY);
    const maxX = Math.max(drawing.startX, drawing.endX);
    const maxY = Math.max(drawing.startY, drawing.endY);
    
    return [
      { x: minX, y: minY },     // topLeft
      { x: maxX, y: minY },     // topRight  
      { x: minX, y: maxY },     // bottomLeft
      { x: maxX, y: maxY }      // bottomRight
    ];
  };

  // Helper function to get bounds from points (for rendering)
  const getPointsBounds = (points) => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  };

  // Start dragging individual point
  const startPointDrag = (e, drawingIndex, pointIndex) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDraggingPoint(true);
    setDraggingPointIndex(pointIndex);
    setSelectedDrawingIndex(drawingIndex);
    setIsResizing(false); // Disable other resize modes
  };

  // Update point position during drag
  const updatePointPosition = (drawingIndex, pointIndex, newX, newY) => {
    const updatedDrawings = [...(slideData[currentSlide]?.drawings || [])];
    const drawing = updatedDrawings[drawingIndex];
    
    if (drawing) {
      // Ensure drawing has points array
      if (!drawing.points) {
        drawing.points = rectToPoints(drawing);
      }
      
      // Update the specific point
      drawing.points[pointIndex] = { x: newX, y: newY };
      
      // Update slide data
      setSlideData(prev => ({
        ...prev,
        [currentSlide]: {
          ...prev[currentSlide],
          drawings: updatedDrawings
        }
      }));
    }
  };
  
  // Multiple locations state
  const [multipleLocationsMode, setMultipleLocationsMode] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0); // User-selected location for next slide
  
  // Track counts for slide types that allow multiples
  const [slideTypeCounts, setSlideTypeCounts] = useState({
    street_view: 0
  });
  
  // Global location data shared across all slides
  const [globalLocationData, setGlobalLocationData] = useState({
    premiseLocation: "",
  });
  
  // Slide-specific data (everything except premiseLocation)
  const [slideData, setSlideData] = useState({
    1: {
      type: 'cover',  // CRITICAL: Include type for renderSlide
      title: 'Cover Page',
      formData: {
        insuredName: "",
        website: "",
        description: "",
        lineBusiness: "",
        websiteInfo: "",
      },
      imageData: null,
      imagePosition: { top: 300, left: 400 },
      drawings: [], // Initialize drawings array
      fieldPositions: {
        insuredName: { top: 180, right: 124 }, // Adjusted for removed transform
        premiseLocation: { top: 310, right: 124 }, // Adjusted for removed transform
        website: { top: 370, right: 124 }, // Adjusted for removed transform
        description: { top: 430, right: 124 }, // Adjusted for removed transform
        lineBusiness: { top: 526, right: 124 }, // Adjusted for removed transform, aligned with ISO
        isoClass: { top: 490, right: 124 }, // Adjusted for removed transform
      }
    }
  });
  const [showWebsite, setShowWebsite] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [businessesAtLocation, setBusinessesAtLocation] = useState([]);
  const [showRatings, setShowRatings] = useState(true); // Show by default until search proves no business
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
  const [showToolbar, setShowToolbar] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSlidesBar, setShowSlidesBar] = useState(true);
  const [showPopupDropdown, setShowPopupDropdown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Undo history stack
  const undoStackRef = useRef([]);
  const isUndoingRef = useRef(false);
  const undoDebounceRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const MAX_UNDO = 30;

  // Refs to always access latest state for undo snapshots
  const slideDataForUndo = useRef(slideData);
  const currentSlideForUndo = useRef(currentSlide);
  const globalLocationDataForUndo = useRef(globalLocationData);
  const slidesForUndo = useRef(slides);
  useEffect(() => { slideDataForUndo.current = slideData; }, [slideData]);
  useEffect(() => { currentSlideForUndo.current = currentSlide; }, [currentSlide]);
  useEffect(() => { globalLocationDataForUndo.current = globalLocationData; }, [globalLocationData]);
  useEffect(() => { slidesForUndo.current = slides; }, [slides]);

  const pushUndoState = useCallback(() => {
    if (isUndoingRef.current) return;
    const snapshot = {
      slideData: JSON.parse(JSON.stringify(slideDataForUndo.current)),
      currentSlide: currentSlideForUndo.current,
      globalLocationData: JSON.parse(JSON.stringify(globalLocationDataForUndo.current)),
      slides: JSON.parse(JSON.stringify(slidesForUndo.current)),
    };
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO - 1)), snapshot];
    setCanUndo(true);
  }, []);

  const pushUndoDebounced = useCallback(() => {
    if (undoDebounceRef.current) clearTimeout(undoDebounceRef.current);
    undoDebounceRef.current = setTimeout(() => {
      pushUndoState();
    }, 800);
  }, [pushUndoState]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    isUndoingRef.current = true;
    const prev = undoStackRef.current.pop();
    setSlideData(prev.slideData);
    setCurrentSlide(prev.currentSlide);
    setGlobalLocationData(prev.globalLocationData);
    setSlides(prev.slides);
    setCanUndo(undoStackRef.current.length > 0);
    // Allow state to settle before accepting new undo pushes
    setTimeout(() => { isUndoingRef.current = false; }, 100);
  }, []);

  // Add keyboard support for deleting selected drawings and undo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((isDrawingMode || isSquareEditMode) && selectedDrawingIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteDrawing(selectedDrawingIndex);
        setSelectedDrawingIndex(null);
        e.preventDefault();
      }

      // ESC to exit square edit mode
      if (e.key === 'Escape' && isSquareEditMode) {
        setIsSquareEditMode(false);
        setSelectedDrawingIndex(null);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, isSquareEditMode, selectedDrawingIndex, handleUndo]);

  // Project status state (null until loaded from project data)
  const [currentProjectStatus, setCurrentProjectStatus] = useState(null);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  // Interior View Builder State
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [waterStainStatus, setWaterStainStatus] = useState('none');
  const [isInteriorBuilderVisible, setIsInteriorBuilderVisible] = useState(false);
  
  // Custom comment state
  const [customCommentText, setCustomCommentText] = useState('');
  const [showCustomCommentInput, setShowCustomCommentInput] = useState(false);
  
  // Autosave state
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Export tracking state
  const [lastExportTime, setLastExportTime] = useState(null);
  const [hasChangedSinceExport, setHasChangedSinceExport] = useState(true);
  
  const addButtonRef = useRef(null);
  const canvasRef = useRef(null);
  const slideRefs = useRef({});
  const slideComponentRefs = useRef({});
  const slidesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Initialize project when sessionUser changes
  useEffect(() => {
    const initializeProject = async () => {
      // Initialize projectSaveService after authentication
      await projectSaveService.init();

      // First check if we already have a project ID
      let projectId = currentProjectId || urlProjectId;

    if (sessionUser) {

      // If we have a project ID from URL, try to load it
      if (urlProjectId && !currentProjectId) {
        // Set project ID immediately to prevent race conditions
        setCurrentProjectId(urlProjectId);
        // Always try to load project from URL (database or cache)
        console.log('Loading project from URL:', urlProjectId);
        const loadResult = await loadProject(urlProjectId);
        if (loadResult) {
          return; // Exit early only if project was successfully loaded
        }
        // If load failed, continue to create new project
      }
        
        // Create new project
        console.log('Creating new project');
        
        // Create initial project save with cleaned up data structure
        const initialProjectData = {
          title: 'New Property Review',
          name: 'New Property Review',
          description: '',
          sessionUser: sessionUser,
          multipleLocationsMode: false, // Include at top level
          selectedLocationIndex: 0,
          status: 'editing',
          formData: {
            insuredName: "",
            website: "",
            description: ""
          },
          slideData: {
            1: {
              formData: {},
              imageData: null,
              imagePosition: { top: 300, left: 400 },
              drawings: [],
              fieldPositions: {}
            },
            // Include application state in slideData for consistency
            _appState: {
              showWebsite: false,
              multipleLocationsMode: false,
              fontSizes: fontSizes
            }
          },
          slides: [{ id: 1, type: 'cover', title: 'Cover Page' }]
        };
        
        try {
          // IMPORTANT: Generate ID first, then use projectSaveService for localStorage fallback
          projectId = projectSaveService.generateProjectId(null, sessionUser);
          console.log('Created new project:', projectId);
          setCurrentProjectId(projectId); // Set the current project ID immediately

          // Save initial project data using projectSaveService (handles localStorage fallback)
          await projectSaveService.saveProject(projectId, initialProjectData);

          // Initialize location data service for the new project
          locationDataService.initializeFromProject(initialProjectData, initialProjectData.multipleLocationsMode);
          console.log('Initialized location data service for new project');

          window.history.replaceState({}, '', `/editor/${projectId}`);

          // Track project-level editing activity for new projects
          if (sessionUser && projectId) {
            fieldActivityService.startEditingField(
              sessionUser,
              `project-${projectId}`,
              'Project: New Property Review'
            );
          }
        } catch (error) {
          console.error('Failed to create project:', error);
          return; // Exit early if project creation fails
        }
      }

      // Only proceed if we have a valid project ID
      if (projectId) {
        setCurrentProjectId(projectId);

        const currentFormData = getSlideData(1)?.formData;
        const projectName = currentFormData?.insuredName?.trim() || 'New Property Review';

        userActivityService.startWorking(sessionUser, projectId, projectName);

        // Capture projectId in closure for heartbeat
        const capturedProjectId = projectId;

        // Set up heartbeat to keep activity alive
        const heartbeatInterval = setInterval(() => {
          userActivityService.updateHeartbeat(sessionUser, capturedProjectId);
        }, 30000); // Every 30 seconds
      
        // Cleanup when component unmounts or user changes
        return () => {
          // IMPORTANT: Save project before cleanup to prevent data loss
          if (capturedProjectId && sessionUser) {
            try {
              saveProject();
              console.log('Project saved on component unmount');
            } catch (error) {
              console.error('Failed to save on unmount:', error);
            }
          }

          userActivityService.stopWorking(sessionUser, capturedProjectId);
        clearInterval(heartbeatInterval);

          // Clean up project-level field activity tracking
          if (capturedProjectId) {
            fieldActivityService.stopEditingField(sessionUser, `project-${capturedProjectId}`);
          }

        // Clean up form-level field activity tracking
        if (currentFormId) {
          fieldActivityService.stopEditingField(sessionUser, `form-${currentFormId}`);
        }

        // Also clean up field heartbeat
        if (fieldHeartbeatInterval) {
          clearInterval(fieldHeartbeatInterval);
        }
      };
      }
    }
    
    initializeProject();
  }, [sessionUser]);

  // Unified auto-save system - triggers on data changes with smart debouncing
  useEffect(() => {
    if (sessionUser && currentProjectId && (slideData || globalLocationData) && slides.length > 0) {
      // Debounce auto-save to avoid excessive saves (10 seconds for auto-save to reduce DB load)
      const timeoutId = setTimeout(async () => {
        // Auto-save triggered
        await saveProject(true); // Pass 'true' to indicate this is an auto-save
      }, 10000); // 10 second debounce for auto-save (reduced frequency to prevent localStorage quota issues)
      
      return () => clearTimeout(timeoutId);
    } else {
      // console.log('Auto-save skipped - missing requirements:', {
      //   sessionUser: !!sessionUser,
      //   currentProjectId: !!currentProjectId,
      //   hasSlideData: !!slideData,
      //   hasGlobalLocationData: !!globalLocationData
      // });
    }
  }, [sessionUser, currentProjectId, slideData, globalLocationData, slides]);

  // Set up mouse wheel event listener for slides container
  useEffect(() => {
    const slidesContainer = slidesContainerRef.current;
    if (!slidesContainer) return;

    const handleWheel = (e) => {
      // Check if we're over a dropdown - be more specific about dropdown detection
      const isOverDropdown = e.target.closest('.dropdown-item') ||
                            e.target.closest('[role="menu"]') ||
                            (e.target.closest('[style*="position: fixed"]') && 
                             e.target.closest('[style*="zIndex: 5000"]'));

      // Only convert vertical mouse wheel to horizontal scroll if not over dropdown
      if (!isOverDropdown) {
        e.preventDefault();
        e.stopPropagation();
        
        // Use a multiplier to make scrolling more responsive
        const scrollAmount = e.deltaY * 2;
        slidesContainer.scrollLeft += scrollAmount;
      }
    };

    // Add event listener with { passive: false } to allow preventDefault
    slidesContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      slidesContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Current form being edited (for field tracking)
  const [currentFormId, setCurrentFormId] = useState(null);
  const [fieldHeartbeatInterval, setFieldHeartbeatInterval] = useState(null);

  // Handle LRO form selection
  // Add document event listeners for canvas dragging
  useEffect(() => {
    const handleDocumentMouseMove = (e) => {
      if (isDraggingCanvas) {
        const newOffset = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        };
        setCanvasOffset(newOffset);
        e.preventDefault();
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDraggingCanvas) {
        setIsDraggingCanvas(false);
      }
    };

    if (isDraggingCanvas) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      };
    }
  }, [isDraggingCanvas, dragStart]);

  useEffect(() => {
    if (showPopupDropdown && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 180;
      const viewportWidth = window.innerWidth;
      
      // Calculate if dropdown would go off-screen
      let leftPosition = rect.left;
      if (rect.left + dropdownWidth > viewportWidth - 20) {
        // Position from right edge of button if it would overflow
        leftPosition = rect.right - dropdownWidth;
      }
      
      setPopupPosition({
        top: rect.top - 210,
        left: Math.max(20, leftPosition), // Ensure minimum 20px from left edge
      });
    }
  }, [showPopupDropdown]);

  // Handle wheel events with non-passive listener to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e) => {
      // Check if mouse is over a dropdown (same logic as handleWheel)
      const isInDropdown = e.target.closest('[role="button"]') || 
                          e.target.closest('.dropdown-menu') || 
                          e.target.closest('[style*="maxHeight"]');
      
      if (isInDropdown) {
        return;
      }
      
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevel + delta));
      
      if (newZoom !== zoomLevel) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        zoomAtPoint(newZoom, mouseX, mouseY);
      }
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [zoomLevel, canvasOffset]); // Dependencies needed for zoomAtPoint

  // Set up backup autosave interval (every 5 minutes) - less frequent to reduce database load
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 300000); // 5 minutes - backup autosave (increased from 2 minutes)

    return () => clearInterval(interval);
  }, [sessionUser, currentProjectId, hasUnsavedChanges]); // Re-run when these change

  // Handle page refresh/close - save before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && sessionUser && currentProjectId) {
        // Try to save the project (async but browser may not wait)
        try {
          saveProject();
          // console.log('Project saved before page unload');
        } catch (error) {
          console.error('Failed to save before unload:', error);
        }
        
        // Show browser confirmation dialog
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, sessionUser, currentProjectId]);

  // Track if user made actual changes after project loaded
  const userMadeChanges = useRef(false);

  // Track changes to mark as unsaved
  useEffect(() => {
    // Only mark as unsaved if project is fully loaded
    if (!isLoadingProject && currentProjectId) {
      setHasUnsavedChanges(true);
      userMadeChanges.current = true;
    }
  }, [slideData, globalLocationData, slides, fontSizes, showWebsite, multipleLocationsMode, isLoadingProject, currentProjectId]);

  // Reset userMadeChanges when loading a new project
  useEffect(() => {
    if (isLoadingProject) {
      userMadeChanges.current = false;
    }
  }, [isLoadingProject, currentProjectId]);

  // Save immediately when navigating away (component unmount)
  // Use refs to capture latest values without recreating cleanup function
  const saveOnUnmountRef = useRef({
    sessionUser,
    currentProjectId,
    slideData,
    globalLocationData,
    slides,
    hasUnsavedChanges,
    isLoadingProject,
    userMadeChanges: userMadeChanges.current
  });

  useEffect(() => {
    saveOnUnmountRef.current = {
      sessionUser,
      currentProjectId,
      slideData,
      globalLocationData,
      slides,
      hasUnsavedChanges,
      isLoadingProject,
      userMadeChanges: userMadeChanges.current
    };
  }, [sessionUser, currentProjectId, slideData, globalLocationData, slides, hasUnsavedChanges, isLoadingProject]);

  useEffect(() => {
    return () => {
      // Cleanup: Save before unmounting if there are changes
      const { sessionUser, currentProjectId, slideData, globalLocationData, slides, hasUnsavedChanges, isLoadingProject, userMadeChanges } = saveOnUnmountRef.current;

      // Don't save if project is still loading
      if (isLoadingProject) {
        console.log('⚠️ Project still loading - skipping save on unmount');
        return;
      }

      // Don't save if user didn't make any changes after project loaded
      if (!userMadeChanges) {
        console.log('⚠️ No user changes after load - skipping save on unmount');
        return;
      }

      // Check if project still exists before saving (don't recreate deleted projects)
      const projectStillExists = projectSaveService.projects.has(currentProjectId);

      // Only save if:
      // 1. User made actual changes after project loaded
      // 2. We have unsaved changes
      // 3. We have a real project with actual content (slides exist and have data)
      // 4. The project still exists in the service (hasn't been deleted)
      // 5. The project is fully loaded
      const hasActualContent = slides && slides.length > 0 && Object.keys(slideData || {}).length > 1; // More than just _appState

      if (sessionUser && currentProjectId && projectStillExists && hasUnsavedChanges && hasActualContent) {
        console.log('💾 Component unmounting - saving project:', currentProjectId);
        // Use projectSaveService directly with the captured projectId from ref
        // This prevents creating new projects if currentProjectId state was cleared
        const projectData = {
          sessionUser,
          slides,
          slideData,
          formData: globalLocationData,
          fieldPositions: {},
          fontSizes: {},
          _savedToDatabase: true,
          databaseId: currentProjectId
        };
        projectSaveService.saveProject(currentProjectId, projectData)
          .catch(err => console.error('Failed to save on unmount:', err));
      } else if (currentProjectId && !projectStillExists) {
        console.log('⚠️ Project was deleted - skipping save on unmount');
      } else if (!hasUnsavedChanges) {
        console.log('⚠️ No unsaved changes - skipping save on unmount');
      } else if (!hasActualContent) {
        console.log('⚠️ No actual content - skipping save on unmount');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - cleanup function never changes, always uses latest values from ref

  // Automatically check for businesses when premise location changes
  useEffect(() => {
    if (globalLocationData.premiseLocation) {
      checkForBusinessAtLocation(globalLocationData.premiseLocation);
    }
  }, [globalLocationData.premiseLocation]);

  // Initialize location data service when multiple locations mode is enabled
  useEffect(() => {
    if (multipleLocationsMode && globalLocationData.premiseLocation) {
      // Ensure location data service is properly initialized
      if (locationDataService.getLocationCount() === 0) {
        console.log('Auto-initializing location data service');
        locationDataService.initializeFromProject({
          formData: globalLocationData
        }, multipleLocationsMode);
      }
    }
  }, [multipleLocationsMode, globalLocationData]);

  const slideOptions = [
    'Aerial View - Google', 'Aerial View - Bing', 'Aerial View - Apple', 'Street View', 'Interior', 'Online Presence', 'Inspection',
    'Comments', 'Nearest Fire Station', 'Fire Hazard', 'Crime Rate', 'Ratings', 'Website'
  ];

  // Simplified business search using backend API
  const searchBusinessRatings = async (location, businessName = null) => {
    if (!location) {
      alert('Please enter a location first');
      return;
    }
    
    if (currentProjectId) {
      await editorApiService.openBusinessSearch(currentProjectId);
    } else {
      // Fallback for when no project ID is available
      const cleanLocation = location.replace(/^Location\s+\d+:\s*/, '').trim();
      const searchQuery = businessName ? `"${businessName}" "${cleanLocation}" reviews` : cleanLocation;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      window.open(googleSearchUrl, '_blank');
    }
  };

  // Simplified business detection - always show ratings for simplicity
  // Complex heuristics removed since backend handles location-based logic
  const checkForBusinessAtLocation = async (location) => {
    if (!location || location.trim() === '') {
      setShowRatings(false);
      return;
    }
    
    // Simplified: always show ratings option for any location
    setShowRatings(true);
    setBusinessesAtLocation([]);
  };

  const handleFontSizeChange = async (e) => {
    const size = parseInt(e.target.value);
    if (selectedField && !isNaN(size)) {
      setFontSizes((prev) => {
        const newFontSizes = { ...prev, [selectedField]: size };
        
        // Save to backend if we have a current project
        if (currentProjectId) {
          apiService.updateAppState(currentProjectId, { fontSizes: newFontSizes })
            .then(() => console.log('Font size saved to backend:', selectedField, size))
            .catch(error => console.error('Failed to save font size:', error));
        }
        
        return newFontSizes;
      });
    }
  };

  // Parse multiple locations from premise location text field
  // Helper function to check if a point is inside a rectangle

  const parseMultipleLocations = (premiseLocationText) => {
    if (!premiseLocationText || !multipleLocationsMode) return [];
    
    const lines = premiseLocationText.split('\n').filter(line => line.trim());
    const locations = [];
    
    lines.forEach((line, index) => {
      if (index >= 5) return; // Limit to 5 locations
      
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Check if line starts with "Location X:" pattern
        const locationMatch = trimmedLine.match(/^Location\s+\d+:\s*(.+)$/i);
        if (locationMatch) {
          locations.push(locationMatch[1].trim());
        } else {
          // If not in the expected format, treat the whole line as a location
          locations.push(trimmedLine);
        }
      }
    });
    
    return locations;
  };

  // Generate slides for multiple locations
  const generateMultipleLocationSlides = (slideType, locations) => {
    const newSlides = [];
    
    locations.forEach((location, index) => {
      if (index >= 5) return; // Limit to 5 locations
      
      const slideTypeKey = slideType.toLowerCase().replace(/\s+/g, '_');
      let slideTitle = `${slideType} - Location ${index + 1}`;
      let actualSlideType = slideTypeKey;
      
      // Handle street view numbering
      if (slideTypeKey === 'street_view') {
        const newCount = slideTypeCounts.street_view + index + 1;
        slideTitle = `Street View ${newCount} - Location ${index + 1}`;
        actualSlideType = `street_view_${newCount}`;
      }
      
      const newSlide = {
        id: nextSlideId + index,
        type: actualSlideType,
        title: slideTitle,
        locationIndex: index,
        specificLocation: location
      };
      
      newSlides.push(newSlide);
    });
    
    return newSlides;
  };

  // Helper function to check if a point is inside a rectangle
  const isPointInRectangle = (x, y, rect) => {
    const minX = Math.min(rect.startX, rect.endX);
    const maxX = Math.max(rect.startX, rect.endX);
    const minY = Math.min(rect.startY, rect.endY);
    const maxY = Math.max(rect.startY, rect.endY);
    
    const isInside = x >= minX && x <= maxX && y >= minY && y <= maxY;
    // Point in rectangle check
    
    return isInside;
  };

  // Function to delete a drawing
  const deleteDrawing = (drawingIndex) => {
    // Push undo state immediately before deleting
    pushUndoState();

    const updatedDrawings = (slideData[currentSlide]?.drawings || []).filter((_, index) => index !== drawingIndex);

    setSlideData(prev => ({
      ...prev,
      [currentSlide]: {
        ...prev[currentSlide],
        drawings: updatedDrawings
      }
    }));
  };

  // Function to start resizing a drawing
  const startResize = (e, drawingIndex, handle) => {
    console.log('🔧 Starting resize:', drawingIndex, handle);
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedDrawingIndex(drawingIndex);
    setIsResizing(true);
    setResizeHandle(handle);
    
    // Store initial mouse position and drawing bounds
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
    const mouseY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
    
    // Store initial drawing bounds for resize calculation
    const drawing = slideData[currentSlide]?.drawings[drawingIndex];
    if (drawing) {
      setCurrentDrawing({
        ...drawing,
        initialMouseX: mouseX,
        initialMouseY: mouseY,
        originalStartX: drawing.startX,
        originalStartY: drawing.startY,
        originalEndX: drawing.endX,
        originalEndY: drawing.endY
      });
    }
  };

  // Function to update drawing during resize
  const updateDrawingSize = (drawingIndex, newStartX, newStartY, newEndX, newEndY) => {
    const updatedDrawings = [...(slideData[currentSlide]?.drawings || [])];
    if (updatedDrawings[drawingIndex]) {
      updatedDrawings[drawingIndex] = {
        ...updatedDrawings[drawingIndex],
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY
      };
      
      setSlideData(prev => ({
        ...prev,
        [currentSlide]: {
          ...prev[currentSlide],
          drawings: updatedDrawings
        }
      }));
    }
  };

  // Canvas drag handlers
  const handleCanvasMouseDown = (e) => {
    if (isDrawingMode) {
      // In drawing mode, allow drawing anywhere in the canvas area
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const startY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
      
      setIsDrawing(true);
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
      e.preventDefault();
      e.stopPropagation(); // Prevent other interactions
    } else if (e.target === canvasRef.current) {
      // Only start dragging if clicking on the canvas container itself (background area)
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y
      });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    // Update mouse position for zoom functionality
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    // Handle drawing
    if (isDrawing && currentDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const endY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
      
      setCurrentDrawing(prev => ({
        ...prev,
        endX,
        endY
      }));
      e.preventDefault();
      e.stopPropagation(); // Prevent other interactions while drawing
    }

    // Handle resizing
    if (isResizing && currentDrawing && selectedDrawingIndex !== null && resizeHandle) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const mouseY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
      
      const deltaX = mouseX - currentDrawing.initialMouseX;
      const deltaY = mouseY - currentDrawing.initialMouseY;
      
      let newStartX = currentDrawing.originalStartX;
      let newStartY = currentDrawing.originalStartY;
      let newEndX = currentDrawing.originalEndX;
      let newEndY = currentDrawing.originalEndY;
      
      // Apply resize based on handle
      switch (resizeHandle) {
        case 'nw': // Top-left corner
          newStartX += deltaX;
          newStartY += deltaY;
          break;
        case 'ne': // Top-right corner
          newEndX += deltaX;
          newStartY += deltaY;
          break;
        case 'sw': // Bottom-left corner
          newStartX += deltaX;
          newEndY += deltaY;
          break;
        case 'se': // Bottom-right corner
          newEndX += deltaX;
          newEndY += deltaY;
          break;
        case 'n': // Top edge
          newStartY += deltaY;
          break;
        case 's': // Bottom edge
          newEndY += deltaY;
          break;
        case 'w': // Left edge
          newStartX += deltaX;
          break;
        case 'e': // Right edge
          newEndX += deltaX;
          break;
      }
      
      // Update the drawing in real-time
      updateDrawingSize(selectedDrawingIndex, newStartX, newStartY, newEndX, newEndY);
      
      e.preventDefault();
      e.stopPropagation();
    }

    // Handle individual point dragging
    if (isDraggingPoint && draggingPointIndex !== null && selectedDrawingIndex !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
      const mouseY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
      
      updatePointPosition(selectedDrawingIndex, draggingPointIndex, mouseX, mouseY);
      
      e.preventDefault();
      e.stopPropagation();
    }

    // Handle canvas dragging
    if (isDraggingCanvas) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setCanvasOffset(newOffset);
      e.preventDefault();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    
    // Handle drawing mode
    if (isDrawingMode && isDrawing && currentDrawing) {
      console.log('Saving drawing with coordinates:', {
        startX: currentDrawing.startX,
        startY: currentDrawing.startY,
        endX: currentDrawing.endX,
        endY: currentDrawing.endY
      });
      
      // Convert to point-based format for new drawings
      const drawingWithPoints = {
        ...currentDrawing,
        points: rectToPoints(currentDrawing)
      };
      
      // Save the completed drawing to the current slide
      const updatedSlideData = {
        ...slideData[currentSlide],
        drawings: [...(slideData[currentSlide]?.drawings || []), drawingWithPoints]
      };

      // Push undo state immediately when drawing is complete
      pushUndoState();

      setSlideData(prev => ({
        ...prev,
        [currentSlide]: updatedSlideData
      }));

      setIsDrawing(false);
      setCurrentDrawing(null);
    }

    // Handle point dragging mode
    if (isDraggingPoint) {
      setIsDraggingPoint(false);
      setDraggingPointIndex(null);
    }

    // Handle resize mode
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setCurrentDrawing(null);
    }
  };

  // Touch event handlers for mobile/tablet support
  const handleCanvasTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch - treat as mouse down
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      handleCanvasMouseDown(syntheticEvent);
    }
    // preventDefault is handled by the non-passive event listener
  };

  const handleCanvasTouchMove = (e) => {
    if (e.touches.length === 1) {
      // Single touch - treat as mouse move
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      handleCanvasMouseMove(syntheticEvent);
    }
    // preventDefault is handled by the non-passive event listener
  };

  const handleCanvasTouchEnd = (e) => {
    handleCanvasMouseUp();
    // preventDefault is handled by the non-passive event listener
  };

  // Add non-passive touch event listeners to prevent scrolling during canvas interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        handleCanvasTouchStart(e);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        handleCanvasTouchMove(e);
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault(); // Prevent scrolling
      handleCanvasTouchEnd(e);
    };

    // Add non-passive event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasOffset, zoomLevel, isDrawingMode, isDraggingCanvas]);

  // Long press handler for paste functionality on touch devices
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressTarget, setLongPressTarget] = useState(null);

  const handleLongPressStart = (e, target) => {
    const timer = setTimeout(() => {
      // Show paste context menu or trigger paste
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && target && target.focus) {
            target.focus();
            // For input/textarea elements
            if (target.setSelectionRange) {
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const value = target.value;
              target.value = value.substring(0, start) + text + value.substring(end);
              target.setSelectionRange(start + text.length, start + text.length);
              
              // Trigger change event
              const event = new Event('input', { bubbles: true });
              target.dispatchEvent(event);
            }
          }
        }).catch(err => {
          console.log('Clipboard read failed:', err);
        });
      }
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
    setLongPressTarget(target);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressTarget(null);
  };

  // Mouse-centered zoom functions
  const zoomAtPoint = (newZoomLevel, mouseX, mouseY) => {
    const oldZoom = zoomLevel / 100;
    const newZoom = newZoomLevel / 100;
    
    // Calculate the zoom factor change
    const zoomFactor = newZoom / oldZoom;
    
    // Calculate new offset to keep the mouse position fixed
    const newOffsetX = mouseX - (mouseX - canvasOffset.x) * zoomFactor;
    const newOffsetY = mouseY - (mouseY - canvasOffset.y) * zoomFactor;
    
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    setZoomLevel(newZoomLevel);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX);
    zoomAtPoint(newZoom, mousePosition.x, mousePosition.y);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN);
    zoomAtPoint(newZoom, mousePosition.x, mousePosition.y);
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    setCanvasOffset({ x: 0, y: 0 });
  };


  const getSlideData = (slideId) => {
    const defaultFormData = {
      insuredName: "",
      website: "",
      description: "",
      lineBusiness: "",
      websiteInfo: "",
      premiseLocation: "",
      isoClass: "",
      originalLroFormId: "",
    };

    const slideSpecific = slideData[slideId] || {
      formData: { ...defaultFormData },
      imageData: null,
      imagePosition: { top: 300, left: 400 },
      fieldPositions: {
        insuredName: { top: 200, right: 124 },
        premiseLocation: { top: 330, right: 124 },
        website: { top: 390, right: 124 },
        description: { top: 450, right: 124 },
        lineBusiness: { top: 546, right: 124 }, // Aligned with ISO
        isoClass: { top: 510, right: 124 },
      }
    };
    
    // Determine which location data to use
    let locationData;
    let slideLocationIndex = selectedLocationIndex; // Default to current selection
    
    // Check if slide has a specific location assigned
    if (slideSpecific.locationIndex !== undefined) {
      slideLocationIndex = slideSpecific.locationIndex;
    }
    
    if (multipleLocationsMode && slideLocationIndex !== undefined) {
      // Ensure location data service is initialized
      if (locationDataService.getLocationCount() === 0) {
        locationDataService.initializeFromProject({
          formData: globalLocationData
        }, multipleLocationsMode);
      }
      
      // Get data for the slide's location
      const hasLocationData = locationDataService.getLocationCount() > slideLocationIndex;
      if (hasLocationData) {
        locationData = locationDataService.getLocationData(slideLocationIndex);
        
        // If location data is empty, populate it from global data
        if (!locationData || Object.keys(locationData).length === 0) {
          const premiseLocation = getLocationFromPremiseText(globalLocationData.premiseLocation, slideLocationIndex);
          locationData = {
            ...globalLocationData,
            premiseLocation: premiseLocation
          };
          
          // Update location data service
          Object.entries(locationData).forEach(([field, value]) => {
            locationDataService.updateLocationData(slideLocationIndex, field, value);
          });
        }
        
        // Using location-specific data
      } else {
        // Location service not properly initialized or index out of range, use global data
        locationData = globalLocationData;
        console.warn(`Location ${slideLocationIndex} not found, using global data`);
      }
    } else if (slideSpecific.specificLocation) {
      // Use specific location for this slide if available
      locationData = { premiseLocation: slideSpecific.specificLocation };
    } else {
      // Fall back to global location data
      locationData = globalLocationData;
    }
    
    // Combine slide-specific data with location data and ensure all values are strings
    const combinedFormData = {
      ...slideSpecific.formData,
      ...locationData
    };
    
    // Ensure all form data values are strings to prevent controlled/uncontrolled input warnings
    Object.keys(combinedFormData).forEach(key => {
      if (combinedFormData[key] === null || combinedFormData[key] === undefined) {
        combinedFormData[key] = "";
      }
    });
    
    return {
      ...slideSpecific,
      formData: combinedFormData,
      // Store which location this slide is for
      locationIndex: slideLocationIndex
    };
  };

  const updateSlideData = (slideId, updates) => {
    // Immediate undo for image/frame changes, debounced for text
    const isImageOrFrameChange = updates.frameImages || updates.frameMeta || updates.frameLayout !== undefined;
    if (isImageOrFrameChange) {
      pushUndoState(); // Immediate
    } else {
      pushUndoDebounced(); // Debounced for other changes
    }

    setSlideData(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        ...updates
      }
    }));
    // Mark as changed since last export
    setHasChangedSinceExport(true);
  };

  const updateFieldPositions = (slideId, positions) => {
    setSlideData(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        fieldPositions: positions
      }
    }));
    // Mark as changed since last export
    setHasChangedSinceExport(true);
  };

  const updateSlideFormData = (slideId, formUpdates) => {
    pushUndoDebounced();
    // Mark as changed since last export
    setHasChangedSinceExport(true);

    if (multipleLocationsMode && selectedLocationIndex !== undefined) {
      // In multiple locations mode, update the location-specific data
      Object.entries(formUpdates).forEach(([field, value]) => {
        locationDataService.updateLocationData(selectedLocationIndex, field, value);
      });

      // Only update globalLocationData if premiseLocation changed to avoid infinite loops
      if ('premiseLocation' in formUpdates) {
        const allLocationData = locationDataService.getAllLocationData();
        setGlobalLocationData(prev => ({
          ...prev,
          ...allLocationData
        }));
      }
    } else {
      // Single location mode - handle SlideOne (property info) specially
      const isPropertyInfoSlide = slideId === 1;
      
      if (isPropertyInfoSlide) {
        // For property info slide, ALL updates go to globalLocationData
        // Updating global data for property info slide
        setGlobalLocationData(prev => ({
          ...prev,
          ...formUpdates
        }));
        
        // Also update slide data for consistency
        setSlideData(prev => ({
          ...prev,
          [slideId]: {
            ...prev[slideId],
            formData: {
              ...prev[slideId]?.formData,
              ...formUpdates
            }
          }
        }));
      } else {
        // For other slides, use original logic
        const locationFields = {};
        const slideSpecificFields = {};
        
        Object.entries(formUpdates).forEach(([field, value]) => {
          if (field === 'premiseLocation') {
            locationFields[field] = value;
          } else {
            slideSpecificFields[field] = value;
          }
        });
        
        // Update global location data if there are location updates
        if (Object.keys(locationFields).length > 0) {
          setGlobalLocationData(prev => ({
            ...prev,
            ...locationFields
          }));
        }
        
        // Update slide-specific data if there are non-location updates
        if (Object.keys(slideSpecificFields).length > 0) {
          setSlideData(prev => ({
            ...prev,
            [slideId]: {
              ...prev[slideId],
              // Replace formData entirely with slideSpecificFields
              // This allows deletion of fields by simply not including them
              formData: slideSpecificFields
            }
          }));
        }
      }
    }
  };

  // Load saved project data
  const loadProject = async (projectId) => {
    try {
      // Show loading screen
      setIsLoadingProject(true);
      setLoadingMessage("Loading project data...");

      // Set current project ID immediately to prevent race conditions
      setCurrentProjectId(projectId);

      // Update loading message
      setLoadingMessage("Fetching project details...");

      // IMPORTANT: Use projectSaveService instead of apiService to get localStorage fallback
      const savedProject = await projectSaveService.loadProject(projectId);
      if (savedProject) {
        console.log(`Loading project: ${savedProject.title}`, savedProject);
        
        // Load project status
        if (savedProject.status) {
          console.log('📋 Loading project with status:', savedProject.status);
          setCurrentProjectStatus(savedProject.status);
        } else {
          console.log('⚠️ Project has no status, defaulting to personal_draft');
          setCurrentProjectStatus('personal_draft'); // Default status for new projects
        }
      
      // Restore all project data
      if (savedProject.slides) {
        setSlides(savedProject.slides);
        
        // Update slide type counts and nextSlideId based on loaded slides
        const maxId = Math.max(...savedProject.slides.map(s => s.id));
        setNextSlideId(maxId + 1);
        
        const counts = { street_view: 0 };
        savedProject.slides.forEach(slide => {
          if (slide.type === 'street_view') {
            counts.street_view++;
          }
        });
        setSlideTypeCounts(counts);
      }
      
      if (savedProject.slideData) {
        // Extract app state and slides from enhanced slideData
        const { _appState, _slides, ...actualSlideData } = savedProject.slideData;
        const restoredSlideData = { ...actualSlideData };
        
        // Restore slides if embedded in slideData
        if (_slides && Array.isArray(_slides)) {
          setSlides(_slides);
          
          // Update slide counts and nextSlideId
          const maxId = Math.max(..._slides.map(s => s.id));
          setNextSlideId(maxId + 1);
          
          const counts = { street_view: 0 };
          _slides.forEach(slide => {
            if (slide.type === 'street_view') {
              counts.street_view++;
            }
          });
          setSlideTypeCounts(counts);
        }
        
        // Restore app state if embedded in slideData
        if (_appState) {
          // Load basic app state
          if (typeof _appState.showWebsite === 'boolean') {
            setShowWebsite(_appState.showWebsite);
          }
          if (_appState.fontSizes && typeof _appState.fontSizes === 'object') {
            setFontSizes(prev => ({ ...prev, ..._appState.fontSizes }));
          }
          
          // Check for complete globalLocationData first, then fallback to just premiseLocation
          if (_appState.globalLocationData && typeof _appState.globalLocationData === 'object') {
            console.log('Migration: Found complete globalLocationData in _appState:', _appState.globalLocationData);
            setGlobalLocationData(_appState.globalLocationData);
          } else if (_appState.premiseLocation) {
            setGlobalLocationData(prev => ({
              ...prev,
              premiseLocation: _appState.premiseLocation
            }));
          }
        }
        
        // console.log('LOAD DEBUG - Original slideData from saved project:', savedProject.slideData);
        // console.log('LOAD DEBUG - Saved fieldPositions from project:', savedProject.fieldPositions);
        
        // If we have fieldPositions saved separately, merge them back into slideData
        if (savedProject.fieldPositions) {
          Object.entries(savedProject.fieldPositions).forEach(([slideKey, positions]) => {
            // Handle both old format (field names) and new format (slide_X)
            if (slideKey.startsWith('slide_')) {
              // New format: "slide_2" -> "2"
              const slideId = slideKey.replace('slide_', '');
              // console.log('LOAD DEBUG - Processing slide ${slideKey} -> ${slideId}:`, positions);
              if (restoredSlideData[slideId]) {
                restoredSlideData[slideId] = {
                  ...restoredSlideData[slideId],
                  fieldPositions: positions
                };
                // console.log('LOAD DEBUG - Updated slideData[${slideId}].fieldPositions:`, restoredSlideData[slideId].fieldPositions);
              } else {
                console.warn(`LOAD DEBUG - No slideData found for slideId: ${slideId}`);
              }
            } else {
              // Old format: field names directly - assume these belong to the Comments slide (slide 2)
              // console.log('LOAD DEBUG - Processing legacy field ${slideKey}:`, positions);
              if (restoredSlideData['2']) {
                if (!restoredSlideData['2'].fieldPositions) {
                  restoredSlideData['2'].fieldPositions = {};
                }
                restoredSlideData['2'].fieldPositions[slideKey] = positions;
                // console.log('LOAD DEBUG - Added legacy field ${slideKey} to slide 2`);
              }
            }
          });
        }
        
        // console.log('LOAD DEBUG - Final restored slideData:', restoredSlideData);
        setSlideData(restoredSlideData);
        // console.log('📍 Restored fieldPositions from saved project:', savedProject.fieldPositions);
      }
      
      // Initialize globalLocationData from saved project data (only if not already set by _appState)
      setGlobalLocationData(currentGlobalData => {
        // If _appState already set complete data, don't overwrite it
        if (currentGlobalData.insuredName || currentGlobalData.website || currentGlobalData.description) {
          console.log('Migration: globalLocationData already set by _appState, keeping existing data');
          return currentGlobalData;
        }
        
        // Otherwise, build from multiple sources for backward compatibility
        const slide1FormData = savedProject.slideData?.[1]?.formData || {};
        const savedFormData = savedProject.formData || {};
        const savedPremiseLocation = savedProject.premiseLocation || '';
        
        // Combine all sources to get complete form data
        const completeFormData = {
          insuredName: slide1FormData.insuredName || savedFormData.insuredName || '',
          premiseLocation: slide1FormData.premiseLocation || savedFormData.premiseLocation || savedPremiseLocation,
          description: slide1FormData.description || savedFormData.description || '',
          website: slide1FormData.website || savedFormData.website || '',
          lineBusiness: slide1FormData.lineBusiness || savedFormData.lineBusiness || '',
          isoClass: slide1FormData.isoClass || savedFormData.isoClass || '',
          originalLroFormId: slide1FormData.originalLroFormId || savedFormData.originalLroFormId || ''
        };
        
        console.log('Migration: Initializing globalLocationData from saved project sources:', completeFormData);
        return completeFormData;
      });
      
      if (typeof savedProject.multipleLocationsMode === 'boolean') {
        setMultipleLocationsMode(savedProject.multipleLocationsMode);
        
        // Initialize location data service
        locationDataService.initializeFromProject(savedProject, savedProject.multipleLocationsMode);
        console.log('Initialized location data service with', locationDataService.getLocationCount(), 'locations');
      }
      
      if (typeof savedProject.selectedLocationIndex === 'number') {
        setSelectedLocationIndex(savedProject.selectedLocationIndex);
      }
      
      if (typeof savedProject.showWebsite === 'boolean') {
        setShowWebsite(savedProject.showWebsite);
      }
      
      if (savedProject.fontSizes && typeof savedProject.fontSizes === 'object') {
        setFontSizes(prev => ({ ...prev, ...savedProject.fontSizes }));
      }
      
      // Set the current slide to the first slide or stay on slide 1
      if (savedProject.slides && savedProject.slides.length > 0) {
        setCurrentSlide(savedProject.slides[0].id);
      }
      
      setCurrentProjectId(projectId);

      // Initialize export tracking for loaded project
      // If project has been exported before, check lastExportTime from saved data
      console.log('🔍 LOAD DEBUG - savedProject.lastExportTime:', savedProject.lastExportTime);
      console.log('🔍 LOAD DEBUG - savedProject keys:', Object.keys(savedProject));

      if (savedProject.lastExportTime) {
        setLastExportTime(savedProject.lastExportTime);
        setHasChangedSinceExport(false); // Assume no changes since it was just loaded
      } else {
        setLastExportTime(null);
        setHasChangedSinceExport(true); // Never exported, so mark as changed
      }

      // Track project-level editing activity when project is loaded
      if (sessionUser) {
        // console.log('Tracking project-level activity: project-${projectId} for user ${sessionUser}`);
        fieldActivityService.startEditingField(
          sessionUser, 
          `project-${projectId}`, 
          `Project: ${savedProject.title}`
        );
        
        // Also track form-level activity if this project came from an LRO form
        const originalLroFormId = savedProject.slideData?.[1]?.formData?.originalLroFormId;
        if (originalLroFormId) {
          // console.log('Tracking form-level activity for loaded project: form-${originalLroFormId} for user ${sessionUser}`);
          fieldActivityService.startEditingField(
            sessionUser, 
            `form-${originalLroFormId}`, 
            `Form: ${savedProject.title}`
          );
          setCurrentFormId(originalLroFormId);
        }
      }
      
        // console.log(`Successfully loaded project: ${savedProject.title}`);
        setLoadingMessage("Project loaded successfully!");
        
        // Hide loading screen
        setTimeout(() => {
          setIsLoadingProject(false);
        }, 500);
        
        return true;
      } else {
        console.log(`No project found for ID: ${projectId}`);
        setIsLoadingProject(false);
        return false;
      }
    } catch (error) {
      console.error(`Failed to load project ${projectId}:`, error);
      
      // If loading failed, create a new project to prevent white screen
      if (sessionUser) {
        console.log('Creating new project due to load failure');
        const initialProjectData = {
          title: 'New Property Review',
          insuredName: '',
          premiseLocation: '',
          description: '',
          formData: {},
          slideData: slideData
        };
        
        try {
          const newProject = await apiService.createProject(initialProjectData);
          const newProjectId = newProject.id;
          setCurrentProjectId(newProjectId);
          
          // Update URL to reflect the new project
          const newUrl = `/editor/${newProjectId}`;
          window.history.replaceState({}, '', newUrl);
          
          console.log('Created new project after load failure:', newProjectId);
          setIsLoadingProject(false);
          return true;
        } catch (createError) {
          console.error('Failed to create new project:', createError);
          setIsLoadingProject(false);
        }
      }
      
      setIsLoadingProject(false);
      return false;
    }
  };



  // Manual save function
  const saveProject = async (isAutoSave = false) => {
    const saveType = isAutoSave ? 'AUTO-SAVE' : 'MANUAL SAVE';
    // Save initiated

    if (!sessionUser) {
      console.error(`${saveType} FAILED: No session user`);
      if (!isAutoSave) alert('Save failed: No user session');
      return false;
    }

    // Prevent saving empty slides over existing project data
    if (slides.length === 0 && isAutoSave) {
      console.warn(`${saveType} SKIPPED: No slides loaded yet - preventing data loss`);
      return false;
    }
    
    // If no project ID, attempt to create one
    if (!currentProjectId) {
      try {
        const initialProjectData = {
          title: 'New Property Review',
          insuredName: globalLocationData?.insuredName || '',
          premiseLocation: globalLocationData?.premiseLocation || '',
          description: globalLocationData?.description || '',
          formData: globalLocationData || {},
          slideData: slideData || {},
          status: 'editing',
          sessionUser: sessionUser
        };
        
        const newProject = await apiService.createProject(initialProjectData);
        if (newProject?.id) {
          setCurrentProjectId(newProject.id);
          window.history.replaceState({}, '', `/editor/${newProject.id}`);
          console.log('Created new project ID:', newProject.id);
        } else {
          console.error(`${saveType} FAILED: Could not create new project`);
          if (!isAutoSave) alert('Save failed: Could not create new project');
          return false;
        }
      } catch (error) {
        console.error(`${saveType} FAILED: Error creating new project`, error);
        if (!isAutoSave) alert('Save failed: Could not create new project');
        return false;
      }
    }
    
    if (sessionUser && currentProjectId) {
      // Use globalLocationData as the primary source for form data
      // This ensures consistency between what user sees and what gets saved
      const currentFormData = {
        ...globalLocationData,
        // Fallback to slide data if globalLocationData is incomplete
        ...(getSlideData(1)?.formData || {})
      };
      
      // Using current form data for save
      
      // Create comprehensive slideData that includes all app state
      const enhancedSlideData = {
        ...slideData,
        // Store additional app state within slideData for now
        _appState: {
          showWebsite: showWebsite,
          fontSizes: fontSizes,
          premiseLocation: currentFormData.premiseLocation || '',
          globalLocationData: globalLocationData, // Save complete global data
          sessionUser: sessionUser, // Store session user for homepage display
          fieldPositions: Object.keys(slideData).reduce((acc, slideId) => {
            if (slideData[slideId]?.fieldPositions) {
              acc[`slide_${slideId}`] = slideData[slideId].fieldPositions;
            }
            return acc;
          }, {})
        },
        // Include slides data within slideData
        _slides: slides
      };
      
      const projectData = {
        title: currentFormData.insuredName || 'Untitled Project',
        name: currentFormData.insuredName || 'Untitled Project',
        description: currentFormData.description || '',
        formData: currentFormData,
        slideData: enhancedSlideData,
        // Also save at top level for backward compatibility
        premiseLocation: currentFormData.premiseLocation || '',
        insuredName: currentFormData.insuredName || '',
        website: currentFormData.website || '',
        isoClass: currentFormData.isoClass || ''
      };

      console.log(`💾 ${saveType} - Saving project with status:`, currentProjectStatus || 'personal_draft');

      try {
        // CRITICAL: Get existing project to preserve _savedToDatabase flag
        const existingProject = projectSaveService.projects.get(currentProjectId);

        // IMPORTANT: Use projectSaveService instead of apiService to enable localStorage fallback
        const result = await projectSaveService.saveProject(currentProjectId, {
          ...projectData,
          // Preserve critical database flags from existing project to prevent duplicate creation
          ...(existingProject?._savedToDatabase && {
            _savedToDatabase: existingProject._savedToDatabase,
            databaseId: existingProject.databaseId
          }),
          sessionUser: sessionUser,
          slides: slides,
          multipleLocationsMode: multipleLocationsMode,
          selectedLocationIndex: selectedLocationIndex,
          status: currentProjectStatus || 'personal_draft', // Use valid status
          showWebsite: showWebsite,
          fontSizes: fontSizes,
          lastExportTime: lastExportTime
        });

        // Save completed successfully
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());

        // Only show success message for manual saves
        if (!isAutoSave) {
          alert('Project saved successfully!');
        }
        return true;
      } catch (error) {
        console.error(`${saveType} ERROR:`, error);
        if (!isAutoSave) {
          alert('Save failed: ' + error.message);
        }
        return false;
      }
    }
    return false;
  };

  // Unified auto-save function (now just calls the main saveProject with auto-save flag)
  const autoSave = async () => {
    if (sessionUser && currentProjectId && hasUnsavedChanges) {
      // Interval auto-save triggered
      setIsAutoSaving(true);
      try {
        const success = await saveProject(true); // true = isAutoSave
        if (success) {
          // Interval auto-save completed
        }
      } catch (error) {
        console.error('Interval auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }
  };

  const addSlide = (slideType) => {
    pushUndoState();
    // Mark as changed since last export
    setHasChangedSinceExport(true);

    const slideTypeKey = slideType.toLowerCase().replace(/\s+/g, '_');

    // Check if this slide type has a maximum limit
    if (slideTypeKey === 'street_view') {
      if (slideTypeCounts.street_view >= 7) {
        alert('Maximum of 7 Street View slides allowed');
        setShowPopupDropdown(false);
        return;
      }
    }
    
    // Create the new slide with proper numbering
    let slideTitle = slideType;
    let actualSlideType = slideTypeKey;
    
    if (slideTypeKey === 'street_view') {
      const newCount = slideTypeCounts.street_view + 1;
      slideTitle = `Street View ${newCount}`;
      actualSlideType = `street_view_${newCount}`;
      
      // Update the counter
      setSlideTypeCounts(prev => ({
        ...prev,
        street_view: newCount
      }));
    }

    const newSlide = {
      id: nextSlideId,
      type: actualSlideType,
      title: slideTitle,
      // Track which location this slide is for
      locationIndex: multipleLocationsMode ? selectedLocationIndex : 0
    };
    
    // Initialize data for new slide - use location-specific data if in multiple locations mode
    let initialFormData;
    
    if (multipleLocationsMode && selectedLocationIndex !== undefined) {
      // Ensure location data service is properly initialized
      if (locationDataService.getLocationCount() === 0) {
        locationDataService.initializeFromProject({
          formData: globalLocationData
        }, multipleLocationsMode);
      }
      
      // Get data for the selected location
      initialFormData = locationDataService.getLocationData(selectedLocationIndex);
      
      // If no specific data exists for this location, use global data as fallback
      if (!initialFormData || Object.keys(initialFormData).length === 0) {
        initialFormData = {
          ...globalLocationData,
          // Parse the specific location from premise location if available
          premiseLocation: getLocationFromPremiseText(globalLocationData.premiseLocation, selectedLocationIndex)
        };
        
        // Update location data service with this data
        Object.entries(initialFormData).forEach(([field, value]) => {
          locationDataService.updateLocationData(selectedLocationIndex, field, value);
        });
      }
    } else {
      // Single location mode or fallback
      initialFormData = {
        insuredName: globalLocationData.insuredName || "",
        website: globalLocationData.website || "",
        description: globalLocationData.description || "",
        lineBusiness: globalLocationData.lineBusiness || "",
        websiteInfo: globalLocationData.websiteInfo || "",
        premiseLocation: globalLocationData.premiseLocation || "",
      };
    }

    console.log(`Creating new slide for Location ${selectedLocationIndex + 1}:`, initialFormData);

    // Set default field positions for Comments slides
    let defaultFieldPositions = {};
    if (actualSlideType === 'comments') {
      defaultFieldPositions = {
        websiteInfo: { top: 630, right: 1.2 }, // Original bottom-right positioning
        premiseLocation: { top: 670, right: 1.2 }  // Original bottom-right positioning
      };
    }

    setSlideData(prev => ({
      ...prev,
      [newSlide.id]: {
        type: actualSlideType,  // CRITICAL: Include type for renderSlide
        title: slideTitle,
        formData: initialFormData,
        imageData: null,
        imagePosition: { top: 300, left: 400 },
        drawings: [],
        fieldPositions: defaultFieldPositions,
        frameLayout: 1,
        frameImages: {},
        frameMeta: {},
        // Store the location index this slide belongs to
        locationIndex: newSlide.locationIndex
      }
    }));
    
    setSlides([...slides, newSlide]);
    setCurrentSlide(newSlide.id);
    setNextSlideId(nextSlideId + 1);
    setShowPopupDropdown(false);
  };

  // Helper function to get specific location from premise location text
  const getLocationFromPremiseText = (premiseLocationText, locationIndex) => {
    if (!premiseLocationText || !multipleLocationsMode) return premiseLocationText;
    
    const lines = premiseLocationText.split('\n').filter(line => line.trim());
    return lines[locationIndex] || lines[0] || premiseLocationText;
  };

  // Helper function to get current location (eliminates duplicated parsing logic)
  const getCurrentLocation = () => {
    const premiseLocation = globalLocationData?.premiseLocation || getSlideData(1)?.formData?.premiseLocation || '';
    
    if (!premiseLocation.trim()) return '';
    
    if (multipleLocationsMode) {
      const locations = parseMultipleLocations(premiseLocation);
      if (locations.length > selectedLocationIndex) {
        return locations[selectedLocationIndex];
      }
      return locations[0] || '';
    } else {
      // Single location mode - use the first line only
      const firstLine = premiseLocation.split('\n')[0]?.trim() || '';
      return firstLine.replace(/^Location\s+\d+:\s*/, '').trim();
    }
  };

  const deleteSlide = (slideId) => {
    pushUndoState();
    // Mark as changed since last export
    setHasChangedSinceExport(true);

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

  const handleExportToPDF = async () => {
    try {
      // Check if there have been changes since last export
      console.log('🔍 EXPORT CHECK - lastExportTime:', lastExportTime);
      console.log('🔍 EXPORT CHECK - hasChangedSinceExport:', hasChangedSinceExport);

      if (lastExportTime && !hasChangedSinceExport) {
        console.log('⚠️ Blocking export - no changes detected');
        alert('This project has not been modified since the last export. Please make changes before exporting again.');
        return;
      }

      // Get slide elements in order
      const slideElements = slides
        .map(slide => slideRefs.current[slide.id])
        .filter(Boolean);

      if (slideElements.length === 0) {
        alert('No slides found to export. Please make sure slides are loaded.');
        return;
      }

      // Sync current positions to DOM before PDF export
      slides.forEach(slide => {
        const slideComponentRef = slideComponentRefs.current[slide.id];
        if (slideComponentRef && slideComponentRef.syncPositionsToDom) {
          slideComponentRef.syncPositionsToDom();
        }
      });

      // Wait a moment for any state updates to apply to DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate filename using insured name and project modified date
      const insuredName = getSlideData(1)?.formData?.insuredName?.trim();

      // Get project modified date from projectSaveService
      const project = currentProjectId ? projectSaveService.projects.get(currentProjectId) : null;

      const modifiedDate = project?.lastModified ? new Date(project.lastModified) : new Date();
      const dateStr = `${modifiedDate.getMonth() + 1}-${modifiedDate.getDate()}-${modifiedDate.getFullYear()}`;

      const filename = insuredName
        ? `Property Review ${insuredName} ${dateStr}.pdf`
        : `Property Review ${dateStr}.pdf`;

      // console.log(`Exporting ${slideElements.length} slides to: ${filename}`);
      
      // Show loading state
      const button = document.querySelector('.export-pdf-btn');
      const originalText = button?.textContent;
      if (button) {
        button.textContent = 'Generating PDF...';
        button.disabled = true;
      }

      // Use screenshot-based export for pixel-perfect results
      const pdfBlob = await exportToPDFScreenshot(slideElements, slideData, filename);

      // PDF exported successfully - upload to backend for the exported items panel
      if (pdfBlob) {
        try {
          const exportedItem = await exportedItemsService.addExportedItem({
            pdfBlob: pdfBlob,
            filename: filename,
            project_name: insuredName || 'Untitled Project',
            project_id: currentProjectId || null
          });
          console.log('Exported item saved to backend:', exportedItem);

          // Mark export timestamp and reset change flag
          setLastExportTime(Date.now());
          setHasChangedSinceExport(false);
        } catch (error) {
          console.error('Failed to save exported item:', error);
        }
      }

      // Show success message
      alert(`PDF exported successfully as: ${filename}`);

    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      // Restore button state
      const button = document.querySelector('.export-pdf-btn');
      if (button) {
        button.textContent = 'Export to PDF';
        button.disabled = false;
      }
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setIsPreviewing(true);

      // Cleanup previous preview URL
      if (previewPdfUrl) {
        cleanupPDFPreview(previewPdfUrl);
        setPreviewPdfUrl(null);
      }

      // Get slide elements in order
      const slideElements = slides
        .map(slide => slideRefs.current[slide.id])
        .filter(Boolean);

      if (slideElements.length === 0) {
        alert('No slides found to preview. Please make sure slides are loaded.');
        return;
      }

      // Sync current positions to DOM before PDF preview
      slides.forEach(slide => {
        const slideComponentRef = slideComponentRefs.current[slide.id];
        if (slideComponentRef && slideComponentRef.syncPositionsToDom) {
          slideComponentRef.syncPositionsToDom();
        }
      });

      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use screenshot-based preview for pixel-perfect results
      const pdfUrl = await previewPDFScreenshot(slideElements, slideData, 'Property Review Preview.pdf');
      setPreviewPdfUrl(pdfUrl);
      setShowPreviewModal(true);

    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Failed to generate PDF preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const cleanupPreview = () => {
    if (previewPdfUrl) {
      cleanupPDFPreview(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };


  const renderSlide = (slideId) => {
    const slideData = slides.find(s => s.id === slideId);
    if (!slideData) {
      console.error(`❌ No slide found with id ${slideId}. Available slides:`, slides);
      return null;
    }

    // Safety check: ensure slideData has a type
    if (!slideData.type) {
      console.error(`❌ Slide ${slideId} missing type:`, slideData);
      console.error(`❌ All slides:`, slides);
      return null;
    }

    const slideSpecificData = getSlideData(slideId);

    // For SlideOne (property information slide), use globalLocationData instead of slideSpecificData.formData
    // This ensures LRO database loading shows up correctly in the text fields
    const isPropertyInfoSlide = slideId === 1 || slideData.type === 'cover' || slideData.type === 'property_info';
    const formDataToUse = isPropertyInfoSlide ? globalLocationData : slideSpecificData.formData;
    
    // Debug logging for SlideOne data flow (reduced logging)
    if (isPropertyInfoSlide && (!formDataToUse.insuredName || !formDataToUse.website)) {
      // Debug output removed to reduce console clutter
    }

    const slideProps = {
      formData: formDataToUse,
      setFormData: (updates) => updateSlideFormData(slideId, updates),
      onSelect: setSelectedField,
      selectedField: slideId === currentSlide ? selectedField : null,
      fontSizes,
      textAlignments,
      showWebsite,
      setShowWebsite, // Add this for LRO form handling
      multipleLocationsMode,
      setMultipleLocationsMode,
      projectId: currentProjectId, // Add project ID for backend uploads
      selectedLocationIndex,
      slideId,
      currentProjectId, // Add project ID for backend API calls
      sessionUser, // Add session user for field tracking
      currentFormId, // Add current form ID for specific field tracking
      slideData: slideSpecificData,
      updateSlideData: (updates) => updateSlideData(slideId, updates),
      fieldPositions: slideSpecificData.fieldPositions || {},
      setFieldPositions: (positions) => updateFieldPositions(slideId, positions),
      zoomLevel: zoomLevel,
      isActiveSlide: slideId === currentSlide,
      allSlideData: slideData, // Pass all slide data for cross-slide logic  
      slides: slides // Pass slides array to check slide types
    };

    // Debug logging for Comments slide (disabled)
    // if (slideData.type === 'comments') {
    //   console.log('💬 Comments slideProps:', {
    //     hasFormData: !!formDataToUse,
    //     formData: formDataToUse,
    //     hasFieldPositions: !!(slideSpecificData.fieldPositions),
    //     fieldPositions: slideSpecificData.fieldPositions,
    //     slideSpecificData: slideSpecificData
    //   });
    // }

    // Handle all street view variants (street_view_1, street_view_2, etc.)
    if (slideData.type.startsWith('street_view')) {
      return <StreetView
        key={slideId}
        {...slideProps}
        ref={(el) => { slideComponentRefs.current[slideId] = el; }}
      />;
    }

    switch (slideData.type) {
      case 'cover':
        return <SlideOne
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'aerial_view_-_google':
        return <SlideTwo
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'aerial_view_-_bing':
        return <SlideThree
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'aerial_view_-_apple':
        return <AerialView
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'interior':
        return <Interior
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'online_presence':
        return <OnlinePresence
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'inspection':
        return <Inspection
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'comments':
        return <Comments
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'fire_hazard':
        return <FireHazard
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'crime_rate':
        return <CrimeRate
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'nearest_fire_station':
        return <NearestFireStation
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'website':
        // Pass website data from slide 1 (first slide) using getSlideData function
        const slide1FormData = getSlideData(1)?.formData || {};
        const websiteData = slide1FormData.website || '';
        return <Website
          key={slideId}
          {...slideProps}
          websiteUrl={websiteData}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'ratings':
        return <Ratings
          key={slideId}
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      default:
        // If it's slide 1, always render as SlideOne (property information)
        if (slideId === 1) {
          return <SlideOne
            key={slideId}
            {...slideProps}
            ref={(el) => { slideComponentRefs.current[slideId] = el; }}
          />;
        }
        
        return (
          <div className="d-flex justify-content-center align-items-center h-100" style={{ width: '1280px', height: '720px' }}>
            <div className="text-center text-muted">
              <h3>{slideData.title}</h3>
              <p>This slide will be implemented soon</p>
            </div>
          </div>
        );
    }
  };

  const renderCurrentSlide = () => {
    return renderSlide(currentSlide);
  };

  // Show loading screen while project is loading
  if (isLoadingProject) {
    return (
      <ProjectLoadingScreen
        projectTitle={globalLocationData?.insuredName || "Property Project"}
        message={loadingMessage}
      />
    );
  }

  return (
    <div className={`editor-page position-relative ${device.isMobile ? 'mobile-layout' : ''} ${device.isTablet ? 'tablet-layout' : ''}`} style={{ height: "100vh", overflow: "hidden" }}>
      
      {/* Mobile Sidebar Toggle Button */}
      {device.isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
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
          {isMobileSidebarOpen ? "×" : "☰"}
        </button>
      )}
      


      {/* Custom scrollbar styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
          }
          .slides-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #c1c1c1 #f1f1f1;
          }
          /* Only show horizontal scrollbar */
          .slides-scrollbar::-webkit-scrollbar {
            width: 0; /* Hide vertical */
            height: 10px; /* Show horizontal */
          }
          .slides-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 5px;
          }
          .slides-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 5px;
          }
          .slides-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
          }
        `}
      </style>
      {/* Professional Navbar */}
      <nav className={`navbar navbar-light bg-white shadow-sm px-3 py-0 d-flex justify-content-between align-items-center position-fixed w-100`} style={{ top: 0, zIndex: 1003, height: NAVBAR_HEIGHT }}>
        {/* Left - Logo & Brand */}
        <div 
          className="d-flex align-items-center py-2" 
          style={{ 
            cursor: "pointer",
            transition: "opacity 0.2s ease",
            borderRadius: "6px",
            padding: "8px 12px",
            margin: "-8px -12px"
          }}
          onClick={() => {
            navigate("/");
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <img 
            src="/NeitClemLogo.png" 
            alt="Logo" 
            style={{ width: "32px", height: "32px", marginRight: "8px" }} 
          />
          <span className="fw-semibold text-dark" style={{ fontSize: "16px" }}>
            Property Review Maker
          </span>
        </div>
        
        {/* Right - Actions Toolbar */}
        <div className="d-flex align-items-center" style={{ gap: "4px" }}>

          {/* Preview Button */}
          <button
            className="btn btn-sm d-flex align-items-center preview-pdf-btn"
            onClick={handlePreviewPDF}
            disabled={isPreviewing}
            style={{
              backgroundColor: '#6c757d',
              borderColor: '#6c757d',
              color: 'white',
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px"
            }}
          >
            <i className={`bi ${isPreviewing ? 'bi-hourglass-split' : 'bi-eye'} me-1`} style={{ fontSize: "12px", color: "white" }}></i>
            <span className="d-none d-md-inline">{isPreviewing ? 'Previewing...' : 'Preview PDF'}</span>
            <span className="d-md-none">{isPreviewing ? '...' : 'Preview'}</span>
          </button>

          {/* Export Button */}
          <button
            className="btn btn-sm d-flex align-items-center export-pdf-btn"
            onClick={handleExportToPDF}
            disabled={isPreviewing}
            style={{
              backgroundColor: '#2d5016',
              borderColor: '#2d5016',
              color: 'white',
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px"
            }}
          >
            <i className="bi bi-file-earmark-pdf me-1" style={{ fontSize: "12px", color: "white" }}></i>
            <span className="d-none d-md-inline">Export PDF</span>
            <span className="d-md-none">PDF</span>
          </button>
          
          {/* Save Button */}
          <button 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center" 
            onClick={async () => {
              await saveProject(); // Manual save (isAutoSave = false by default)
            }}
            title="Save project manually"
            style={{ 
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px",
              borderColor: "#6c757d",
              color: "#6c757d"
            }}
          >
            <i className="bi bi-save me-1" style={{ fontSize: "12px", color: "#6c757d" }}></i>
            <span className="d-none d-md-inline">Save</span>
          </button>
        </div>
      </nav>

      {/* Location Indicator - Shows which location is being edited */}
      <LocationIndicator
        multipleLocationsMode={multipleLocationsMode}
        selectedLocationIndex={selectedLocationIndex}
        totalLocations={multipleLocationsMode && globalLocationData.premiseLocation 
          ? parseMultipleLocations(globalLocationData.premiseLocation).length 
          : 1
        }
        currentLocationName={multipleLocationsMode && globalLocationData.premiseLocation
          ? `Location ${selectedLocationIndex + 1}`
          : 'Single Location'
        }
        onLocationChange={(newIndex) => {
          console.log(`Switching to location ${newIndex + 1}`);
          setSelectedLocationIndex(newIndex);
          
          // Initialize location data service for all locations if not already done
          if (locationDataService.getLocationCount() === 0) {
            locationDataService.initializeFromProject({
              formData: globalLocationData
            }, multipleLocationsMode);
          }
          
          // Force re-render of current slide with new location data
          if (currentSlide) {
            const currentSlideData = slideData[currentSlide];
            if (currentSlideData) {
              // Update the slide's location index
              setSlideData(prev => ({
                ...prev,
                [currentSlide]: {
                  ...currentSlideData,
                  locationIndex: newIndex
                }
              }));
            }
          }
        }}
      />

      {/* Editor Layout */}
      <div className="d-flex" style={{ height: "100vh", paddingTop: NAVBAR_HEIGHT }}>
        {/* Desktop/Tablet Sidebar */}
        {!device.isMobile && (
          <div
            className="editor-sidebar bg-light border-end p-3 shadow custom-scrollbar"
            style={{
              position: "fixed",
              top: NAVBAR_HEIGHT,
              bottom: showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
              left: showToolbar ? 0 : -SIDEBAR_WIDTH,
              width: SIDEBAR_WIDTH,
              zIndex: 1000,
              transition: "left 0.3s ease-in-out, bottom 0.3s ease",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "#c1c1c1 #f1f1f1",
            }}
          >
            <Sidebar 
              getCurrentLocation={getCurrentLocation}
              showRatings={showRatings}
              businessesAtLocation={businessesAtLocation}
              searchBusinessRatings={searchBusinessRatings}
              multipleLocationsMode={multipleLocationsMode}
              selectedLocationIndex={selectedLocationIndex}
              globalLocationData={globalLocationData}
              parseMultipleLocations={parseMultipleLocations}
              slides={slides}
              currentSlide={currentSlide}
              slideData={slideData}
              getSlideData={getSlideData}
              updateSlideData={updateSlideData}
              setSelectedLocationIndex={setSelectedLocationIndex}
              setMultipleLocationsMode={setMultipleLocationsMode}
              locationDataService={locationDataService}
              currentProjectId={currentProjectId}
              apiService={apiService}
              setBusinessesAtLocation={setBusinessesAtLocation}
              selectedField={selectedField}
              fontSizes={fontSizes}
              handleFontSizeChange={handleFontSizeChange}
              showWebsite={showWebsite}
              setShowWebsite={setShowWebsite}
              updateSlideFormData={updateSlideFormData}
              showCustomCommentInput={showCustomCommentInput}
              setShowCustomCommentInput={setShowCustomCommentInput}
              customCommentText={customCommentText}
              setCustomCommentText={setCustomCommentText}
              isInteriorBuilderVisible={isInteriorBuilderVisible}
              setIsInteriorBuilderVisible={setIsInteriorBuilderVisible}
              textAlignments={textAlignments}
              setTextAlignments={setTextAlignments}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              isSquareEditMode={isSquareEditMode}
              setIsSquareEditMode={setIsSquareEditMode}
              selectedDrawingIndex={selectedDrawingIndex}
              setSelectedDrawingIndex={setSelectedDrawingIndex}
              setSlideData={setSlideData}
              showToolbar={showToolbar}
              setShowToolbar={setShowToolbar}
              BUTTON_STYLES={BUTTON_STYLES}
              setFontSizes={setFontSizes}
              editorApiService={editorApiService}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          </div>
        )}

        {/* Mobile Sidebar */}
        {device.isMobile && (
          <div
            className={`mobile-sidebar bg-light border-start p-3 shadow custom-scrollbar ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}
            style={{
              position: "fixed",
              top: NAVBAR_HEIGHT,
              right: isMobileSidebarOpen ? 0 : -SIDEBAR_WIDTH,
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
            <Sidebar 
              getCurrentLocation={getCurrentLocation}
              showRatings={showRatings}
              businessesAtLocation={businessesAtLocation}
              searchBusinessRatings={searchBusinessRatings}
              multipleLocationsMode={multipleLocationsMode}
              selectedLocationIndex={selectedLocationIndex}
              globalLocationData={globalLocationData}
              parseMultipleLocations={parseMultipleLocations}
              slides={slides}
              currentSlide={currentSlide}
              slideData={slideData}
              getSlideData={getSlideData}
              updateSlideData={updateSlideData}
              setSelectedLocationIndex={setSelectedLocationIndex}
              setMultipleLocationsMode={setMultipleLocationsMode}
              locationDataService={locationDataService}
              currentProjectId={currentProjectId}
              apiService={apiService}
              setBusinessesAtLocation={setBusinessesAtLocation}
              selectedField={selectedField}
              fontSizes={fontSizes}
              handleFontSizeChange={handleFontSizeChange}
              showWebsite={showWebsite}
              setShowWebsite={setShowWebsite}
              updateSlideFormData={updateSlideFormData}
              showCustomCommentInput={showCustomCommentInput}
              setShowCustomCommentInput={setShowCustomCommentInput}
              customCommentText={customCommentText}
              setCustomCommentText={setCustomCommentText}
              isInteriorBuilderVisible={isInteriorBuilderVisible}
              setIsInteriorBuilderVisible={setIsInteriorBuilderVisible}
              textAlignments={textAlignments}
              setTextAlignments={setTextAlignments}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              isSquareEditMode={isSquareEditMode}
              setIsSquareEditMode={setIsSquareEditMode}
              selectedDrawingIndex={selectedDrawingIndex}
              setSelectedDrawingIndex={setSelectedDrawingIndex}
              setSlideData={setSlideData}
              showToolbar={isMobileSidebarOpen}
              setShowToolbar={setIsMobileSidebarOpen}
              BUTTON_STYLES={BUTTON_STYLES}
              setFontSizes={setFontSizes}
              editorApiService={editorApiService}
              isMobile={true}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div 
          ref={canvasRef}
          className="flex-fill"
          style={{
            marginLeft: showToolbar ? SIDEBAR_WIDTH : 0,
            marginBottom: showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
            transition: "margin 0.3s ease",
            overflow: "hidden",
            position: "relative",
            cursor: isDraggingCanvas ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          <div
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: '0 0',
              transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease-out',
              position: 'relative'
            }}
          >
            {renderSlide(currentSlide)}
            
            {/* Drawing Overlay */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1280px",
                height: "720px",
                pointerEvents: (isDrawingMode || isSquareEditMode) ? "auto" : "none",
                zIndex: 1000
              }}
            >
              {/* Render saved drawings for current slide */}
              {(getSlideData(currentSlide)?.drawings || []).map((drawing, index) => {
                const isSelected = selectedDrawingIndex === index;
                const points = rectToPoints(drawing); // Convert to points if needed
                
                return (
                  <g key={index}>
                    {/* Main drawing shape - now as a polygon for flexibility */}
                    <polygon
                      points={`${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[3].x},${points[3].y} ${points[2].x},${points[2].y}`}
                      fill={drawing.fill || "none"}
                      stroke={drawing.stroke || "red"}
                      strokeWidth={drawing.strokeWidth || 3}
                      style={{ 
                        cursor: (isDrawingMode || isSquareEditMode) ? "pointer" : "default",
                        opacity: isSelected ? 0.8 : 1,
                        filter: isSquareEditMode && !isDrawingMode ? "drop-shadow(0 0 4px rgba(0, 123, 255, 0.5))" : "none"
                      }}
                      onClick={(e) => {
                        if (isDrawingMode || isSquareEditMode) {
                          e.stopPropagation();
                          setSelectedDrawingIndex(isSelected ? null : index);
                        }
                      }}
                    />
                    
                    {/* Individual draggable points when selected */}
                    {isSelected && (isDrawingMode || isSquareEditMode) && (
                      <>
                        {points.map((point, pointIndex) => (
                          <circle
                            key={pointIndex}
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill="blue"
                            stroke="white"
                            strokeWidth="2"
                            style={{ 
                              cursor: "move",
                              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
                            }}
                            onMouseDown={(e) => startPointDrag(e, index, pointIndex)}
                          />
                        ))}
                        
                        {/* Point labels for clarity */}
                        {points.map((point, pointIndex) => (
                          <text
                            key={`label-${pointIndex}`}
                            x={point.x + (pointIndex === 0 || pointIndex === 2 ? -12 : 12)}
                            y={point.y + (pointIndex === 0 || pointIndex === 1 ? -8 : 16)}
                            fontSize="10"
                            fill="blue"
                            fontWeight="bold"
                            style={{ pointerEvents: "none", userSelect: "none" }}
                          >
                            {pointIndex + 1}
                          </text>
                        ))}
                      </>
                    )}
                  </g>
                );
              })}
              
              {/* Current drawing being created */}
              {isDrawing && currentDrawing && (
                <rect
                  x={Math.min(currentDrawing.startX, currentDrawing.endX)}
                  y={Math.min(currentDrawing.startY, currentDrawing.endY)}
                  width={Math.abs(currentDrawing.endX - currentDrawing.startX)}
                  height={Math.abs(currentDrawing.endY - currentDrawing.startY)}
                  fill={currentDrawing.fill || "none"}
                  stroke={currentDrawing.stroke || "red"}
                  strokeWidth={currentDrawing.strokeWidth || 3}
                  strokeDasharray="5,5"
                  opacity="0.7"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Slides */}
      <div
        className="bg-white border-top custom-scrollbar"
        style={{
          position: "fixed",
          bottom: showSlidesBar ? 0 : -SLIDES_BAR_HEIGHT,
          left: 0,
          right: 0,
          transition: "bottom 0.3s ease",
          zIndex: 1002,
          height: SLIDES_BAR_HEIGHT,
          padding: "12px 20px",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)"
        }}
      >
        {/* Floating Zoom Controls */}
        <div style={{
          position: "absolute",
          top: "8px",
          right: "100px",
          display: "flex",
          gap: "4px",
          alignItems: "center",
          zIndex: 1004
        }}>
          <button 
            className="btn btn-sm btn-light border"
            onClick={handleZoomOut}
            disabled={zoomLevel <= ZOOM_MIN}
            style={BUTTON_STYLES.zoomButton}
            title="Zoom Out"
          >
            −
          </button>
          <span 
            className="small fw-bold px-2 py-1 bg-white border rounded" 
            style={{ 
              minWidth: "45px", 
              textAlign: "center",
              fontSize: "11px"
            }}
          >
            {zoomLevel}%
          </span>
          <button 
            className="btn btn-sm btn-light border"
            onClick={handleZoomIn}
            disabled={zoomLevel >= ZOOM_MAX}
            style={BUTTON_STYLES.zoomButton}
            title="Zoom In"
          >
            +
          </button>
          <button 
            className="btn btn-sm btn-outline-primary ms-1"
            onClick={handleZoomReset}
            style={{ fontSize: "10px", padding: "2px 6px" }}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
        
        {/* Toggle Button for Slides Bar */}
        <button
          onClick={() => setShowSlidesBar(!showSlidesBar)}
          style={{
            ...BUTTON_STYLES.slideToggle,
            zIndex: 1003,
          }}
        >
          <span style={{ fontSize: "0.8rem" }}>{showSlidesBar ? "↓" : "↑"}</span>
        </button>
        
        <div className="d-flex align-items-center justify-content-between" style={{ height: "20px", marginBottom: "8px" }}>
          <small className="fw-bold text-muted" style={{ fontSize: "11px" }}>SLIDES</small>
          <span className="badge bg-secondary" style={{ fontSize: "9px", padding: "2px 6px" }}>
            {slides.length} slide{slides.length !== 1 ? "s" : ""}
          </span>
        </div>
        
        <div 
          ref={slidesContainerRef}
          className="slides-scrollbar" 
          style={{ 
            display: "flex",
            gap: "8px",
            alignItems: "center",
            overflowX: "scroll",
            overflowY: "hidden", // Completely prevent vertical scrolling
            paddingBottom: "12px",
            marginTop: "5px",
            scrollBehavior: "smooth",
            minHeight: "100px",
            height: "110px",
            width: "100%",
            maxWidth: "100%"
          }}
        >
          {slides.map((slide, index) => {
            const currentSlideData = getSlideData(slide.id);
            return (
              <SlidePreview
                key={slide.id}
                slide={slide}
                index={index}
                isActive={currentSlide === slide.id}
                onClick={(slideId) => { pushUndoState(); setCurrentSlide(slideId); }}
                onDelete={deleteSlide}
                canDelete={slides.length > 1}
                multipleLocationsMode={multipleLocationsMode}
                slideLocationIndex={currentSlideData.locationIndex}
              />
            );
          })}

          {/* Add Slide Button */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowPopupDropdown(!showPopupDropdown)}
              ref={addButtonRef}
              style={{ whiteSpace: "nowrap" }}
            >
              ＋ Add
            </button>
          </div>
        </div>

        {/* Dropdown positioned outside of scroll container */}
        {showPopupDropdown && (
          <div
            className="position-fixed bg-white border rounded shadow"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              width: "180px",
              maxHeight: "200px",
              overflowY: "auto",
              zIndex: 5000,
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            {slideOptions.filter(option => {
              // Show Website option if showWebsite is true and there's website data in slide 1
              // Allow multiple website slides like street view
              if (option === 'Website') {
                const slide1FormData = getSlideData(1)?.formData || {};
                const websiteValue = slide1FormData.website || '';
                const hasWebsiteData = showWebsite && websiteValue && websiteValue.trim() !== '';
                return hasWebsiteData;
              }
              // Show Ratings option only if showRatings is true
              if (option === 'Ratings') {
                return showRatings;
              }
              return true;
            }).map(option => (
              <div
                key={option}
                className="dropdown-item text-dark"
                style={{ cursor: "pointer", padding: "8px 12px" }}
                onClick={() => addSlide(option)}
                onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden slides for PDF export - positioned off-screen but still rendered */}
      <div style={{ 
        position: 'fixed', 
        left: '-2000px', 
        top: '0px',
        pointerEvents: 'none',
        zIndex: -9999,
        opacity: 0,
        visibility: 'hidden'
      }}>
        {slides.map(slide => {
          const slideData = slides.find(s => s.id === slide.id);
          if (!slideData) return null;

          const slideSpecificData = getSlideData(slide.id);
          const slideSpecificType = slideData.type || slideSpecificData.type;
          if (!slideSpecificType) return null;

          const slideProps = {
            formData: slideSpecificData.formData,
            setFormData: (updates) => updateSlideFormData(slide.id, updates),
            onSelect: setSelectedField,
            selectedField: null, // No field selection in PDF area
            fontSizes,
            textAlignments,
            showWebsite,
            multipleLocationsMode,
            selectedLocationIndex,
            slideId: slide.id,
            projectId: currentProjectId,
            currentProjectId,
            sessionUser,
            slideData: slideSpecificData,
            updateSlideData: (updates) => updateSlideData(slide.id, updates),
            fieldPositions: slideSpecificData.fieldPositions,
            setFieldPositions: (positions) => updateFieldPositions(slide.id, positions),
            allSlideData: slideData,
            slides: slides,
          };

          return (
            <div
              key={`pdf-${slide.id}`}
              ref={(el) => {
                if (el) {
                  slideRefs.current[slide.id] = el;
                }
              }}
              style={{
                width: '1280px',
                height: '720px',
                position: 'relative',
                marginBottom: '20px',
                background: 'white',
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              {/* Render slide components directly without calling renderSlide to avoid ref conflicts */}
              {slideSpecificType.startsWith('street_view') && (
                <StreetView {...slideProps} />
              )}
              {slideSpecificType === 'cover' && (
                <SlideOne {...slideProps} />
              )}
              {slideSpecificType === 'aerial_view_-_google' && (
                <SlideTwo {...slideProps} />
              )}
              {slideSpecificType === 'aerial_view_-_bing' && (
                <SlideThree {...slideProps} />
              )}
              {slideSpecificType === 'aerial_view_-_apple' && (
                <AerialView {...slideProps} />
              )}
              {slideSpecificType === 'interior' && (
                <Interior {...slideProps} />
              )}
              {slideSpecificType === 'online_presence' && (
                <OnlinePresence {...slideProps} />
              )}
              {slideSpecificType === 'inspection' && (
                <Inspection {...slideProps} />
              )}
              {slideSpecificType === 'comments' && (
                <Comments {...slideProps} />
              )}
              {slideSpecificType === 'fire_hazard' && (
                <FireHazard {...slideProps} />
              )}
              {slideSpecificType === 'crime_rate' && (
                <CrimeRate {...slideProps} />
              )}
              {slideSpecificType === 'nearest_fire_station' && (
                <NearestFireStation {...slideProps} />
              )}
              {slideSpecificType === 'website' && (
                (() => {
                  const slide1FormData = getSlideData(1)?.formData || {};
                  const websiteInfo = slide1FormData.website || '';
                  return <Website
                    {...slideProps}
                    websiteUrl={websiteInfo}
                  />
                })()
              )}
              {slideSpecificType === 'ratings' && (
                <Ratings {...slideProps} />
              )}
              
              {/* Drawing Overlay for PDF */}
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1280px",
                  height: "720px",
                  pointerEvents: "none",
                  zIndex: 1000
                }}
              >
                {/* Render saved drawings for this slide */}
                {(getSlideData(slide.id)?.drawings || []).map((drawing, index) => {
                  const points = rectToPoints(drawing); // Convert to points if needed
                  return (
                    <polygon
                      key={index}
                      points={`${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[3].x},${points[3].y} ${points[2].x},${points[2].y}`}
                      fill={drawing.fill || "none"}
                      stroke={drawing.stroke || "red"}
                      strokeWidth={drawing.strokeWidth || 3}
                    />
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          cleanupPreview();
        }}
        pdfUrl={previewPdfUrl}
        filename="Property Review Preview.pdf"
        isGenerating={isPreviewing}
        onExport={handleExportToPDF}
      />

    </div>
  );
}