import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../hooks/useDevice";
import MobileToolbar from "../components/MobileToolbar";
import "../styles/mobile.css";
import SlideOne from "./slides/SlideOne";
import SlideTwo from "./slides/SlideTwo";
import SlideThree from "./slides/SlideThree";
import StreetView from "./slides/StreetView";
import Interior from "./slides/Interior";
import OnlinePresence from "./slides/OnlinePresence";
import Comments from "./slides/Comments";
import FireHazard from "./slides/FireHazard";
import CrimeRate from "./slides/CrimeRate";
import NearestFireStation from "./slides/NearestFireStation";
import Website from "./slides/Website";
import Ratings from "./slides/Ratings";
import { exportToPDF } from "../utils/pdfExport";
import lroDataService from "../services/lroDataService";
import { loadIsoCodes, findBestMatch } from "../services/isoCodeService";
import userActivityService from "../services/userActivityService";
import fieldActivityService from "../services/fieldActivityService";
import apiService from "../services/apiService";
import editorApiService from "../services/editorApiService";
import FieldEditorTag from "../components/FieldEditorTag";
import locationDataService from "../services/locationDataService";
import LocationIndicator from "../components/LocationIndicator";

const NAVBAR_HEIGHT = 72;
const SIDEBAR_WIDTH = 350; // Increased to accommodate wider comment options
const SLIDES_BAR_HEIGHT = 160; // Increased height to show scroll bar properly
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

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

export default function Editor({ sessionUser }) {
  const device = useDevice();
  const [slides, setSlides] = useState([{ id: 1, type: 'cover', title: 'Cover Page' }]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [nextSlideId, setNextSlideId] = useState(2); // Track next available ID
  
  // Project save state
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  // Drawing tool state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'

  // Add keyboard support for deleting selected drawings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDrawingMode && selectedDrawingIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteDrawing(selectedDrawingIndex);
        setSelectedDrawingIndex(null);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, selectedDrawingIndex]);
  
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
  const [showSlidesBar, setShowSlidesBar] = useState(true);
  const [showPopupDropdown, setShowPopupDropdown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // LRO form selection states
  const [isLroDropdownOpen, setIsLroDropdownOpen] = useState(false);
  const [lroForms, setLroForms] = useState([]);
  const [lroSearchTerm, setLroSearchTerm] = useState('');
  const [isLoadingLroForms, setIsLoadingLroForms] = useState(false);
  
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
  
  const addButtonRef = useRef(null);
  const canvasRef = useRef(null);
  const slideRefs = useRef({});
  const slideComponentRefs = useRef({});
  const slidesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Load LRO forms and check for existing project on component mount
  useEffect(() => {
    loadLroForms();
    
    // URL project loading is handled in the next useEffect to avoid race conditions
  }, [sessionUser]);

  // Initialize project when sessionUser changes
  useEffect(() => {
    const initializeProject = async () => {
    if (sessionUser) {
      // First check if we already have a project ID
      let projectId = currentProjectId;
      
      // If no current project ID, try to get it from URL
      if (!projectId) {
        const urlParams = new URLSearchParams(window.location.search);
        let urlProjectId = urlParams.get('projectId');
        if (!urlProjectId) {
          // Check for 'project' parameter for backward compatibility
          urlProjectId = urlParams.get('project');
        }
        
        if (urlProjectId) {
          // Set project ID immediately to prevent race conditions
          projectId = urlProjectId;
          setCurrentProjectId(urlProjectId);
        }
        
        if (urlProjectId) {
          // Always try to load project from URL (database or cache)
          console.log('🔄 Loading project from URL:', urlProjectId);
          setCurrentProjectId(urlProjectId); // Set this immediately to prevent race conditions
          const loadResult = await loadProject(urlProjectId);
          if (loadResult) {
            return; // Exit early only if project was successfully loaded
          }
          // If load failed, continue to create new project
        }
        
        // Create new project
        console.log('🆕 Creating new project');
        
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
          const newProject = await apiService.createProject(initialProjectData);
          projectId = newProject.id;
          console.log('✅ Created new project:', projectId);
          setCurrentProjectId(projectId); // Set the current project ID immediately
          
          // Initialize location data service for the new project
          locationDataService.initializeFromProject(initialProjectData, initialProjectData.multipleLocationsMode);
          console.log('🏗️ Initialized location data service for new project');
          
          window.history.replaceState({}, '', `/editor?projectId=${projectId}`); // Fixed URL parameter name to match loadProject
        } catch (error) {
          console.error('❌ Failed to create project:', error);
        }
        
        // Track project-level editing activity for new projects
        if (sessionUser) {
          fieldActivityService.startEditingField(
            sessionUser, 
            `project-${projectId}`, 
            'Project: New Property Review'
          );
        }
      }
      setCurrentProjectId(projectId);
      
      const currentFormData = getSlideData(1)?.formData;
      const projectName = currentFormData?.insuredName?.trim() || 'New Property Review';
      
      userActivityService.startWorking(sessionUser, projectId, projectName);
      
      // Set up heartbeat to keep activity alive
      const heartbeatInterval = setInterval(() => {
        userActivityService.updateHeartbeat(sessionUser, projectId);
      }, 30000); // Every 30 seconds
      
      // Cleanup when component unmounts or user changes
      return () => {
        userActivityService.stopWorking(sessionUser, projectId);
        clearInterval(heartbeatInterval);
        
        // Clean up project-level field activity tracking
        if (projectId) {
          fieldActivityService.stopEditingField(sessionUser, `project-${projectId}`);
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
    };
    
    initializeProject();
  }, [sessionUser]);

  // Unified auto-save system - triggers on data changes with smart debouncing
  useEffect(() => {
    if (sessionUser && currentProjectId && (slideData || globalLocationData)) {
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

  // Load LRO forms
  const loadLroForms = async () => {
    try {
      setIsLoadingLroForms(true);
      const forms = await lroDataService.getAllForms();
      setLroForms(forms);
    } catch (error) {
      console.error('Error loading LRO forms:', error);
    } finally {
      setIsLoadingLroForms(false);
    }
  };

  // Function to find ISO code in the CSV file by exact code number
  const findIsoCodeByNumber = async (isoCode) => {
    try {
      // Load all ISO codes from CSV file to ensure they're available
      const allIsoCodes = await loadIsoCodes();
      // console.log('Loaded', allIsoCodes?.length || 0, 'ISO codes from CSV, searching for:', isoCode);
      
      // Use findBestMatch which will first try exact code match, then description search
      const bestMatch = findBestMatch(isoCode);
      
      if (bestMatch) {
        // console.log('Found CSV match for code', isoCode, ':', bestMatch);
        return bestMatch; // Return the match directly
      }
      
      // console.log('No match found in CSV for code:', isoCode);
      return null;
    } catch (error) {
      console.error('Error searching CSV ISO codes:', error);
      return null;
    }
  };

  // Current form being edited (for field tracking)
  const [currentFormId, setCurrentFormId] = useState(null);
  const [fieldHeartbeatInterval, setFieldHeartbeatInterval] = useState(null);

  // Handle LRO form selection
  const handleLroFormSelect = async (formId) => {
    try {
      const apiResponse = await lroDataService.getFormDataForPropertyReview(formId);
      
      // Set the current form ID for field tracking
      setCurrentFormId(formId);
      
      // Store the original LRO form ID in the project data for future reference
      const currentData = getSlideData(1)?.formData || {};
      if (!currentData.originalLroFormId) {
        updateSlideFormData(1, { originalLroFormId: formId });
      }
      
      // Search for full ISO description if we have an ISO code from database
      let fullIsoDescription = apiResponse.description || '';
      if (apiResponse.isoClass && apiResponse.isoClass.trim()) {
        // console.log('Searching for ISO code:', apiResponse.isoClass);
        
        try {
          // Search for the ISO code in the CSV file system
          const match = await findIsoCodeByNumber(apiResponse.isoClass.trim());
          
          if (match && match.full_text) {
            // Use the full "code - description" format from CSV
            fullIsoDescription = match.full_text;
            // console.log('Using CSV ISO description:', fullIsoDescription);
          } else {
            // console.log('No CSV match found for code:', apiResponse.isoClass);
            fullIsoDescription = apiResponse.isoClass || '';
          }
        } catch (error) {
          console.error('Error searching CSV ISO codes:', error);
          fullIsoDescription = apiResponse.isoClass || '';
        }
      }
      
      // Auto-fill the property review fields for the first slide (cover page)
      const lroFormData = {
        insuredName: apiResponse.insuredName || '',
        premiseLocation: apiResponse.premiseLocation || '',
        description: fullIsoDescription,
        website: apiResponse.website || '',
        isoClass: apiResponse.isoClass || '',
      };

      console.log('🔍 LRO Loading Debug:', { 
        multipleLocationsMode, 
        selectedLocationIndex, 
        lroFormData,
        locationServiceCount: locationDataService.getLocationCount()
      });

      // Update both location service and slide data
      if (multipleLocationsMode && selectedLocationIndex !== undefined) {
        // In multiple locations mode, update the current location's data
        Object.entries(lroFormData).forEach(([field, value]) => {
          locationDataService.updateLocationData(selectedLocationIndex, field, value);
        });
        // Updated location data
      }

      // Always update slide form data (this will handle location-aware routing)
      updateSlideFormData(1, lroFormData);
      
      // Also update global location data to ensure consistency
      setGlobalLocationData(prev => {
        const updatedData = {
          ...prev,
          ...lroFormData
        };
        // Updated global location data
        return updatedData;
      });
      
      // LRO form loading completed
      
      // Update user activity to show which specific application they're working on
      if (sessionUser && apiResponse.insuredName) {
        const projectId = `property-review-${formId}`; // Use the actual form ID
        const projectName = `${apiResponse.insuredName} - ${apiResponse.premiseLocation || 'Property Review'}`;
        
        userActivityService.startWorking(sessionUser, projectId, projectName);
        
        // Also trigger field-level editing activity immediately when selecting from dropdown
        fieldActivityService.startEditingField(sessionUser, `insuredName-${formId}`, 'Insured Name');
        
        // Track form-level editing activity for dropdown display
        // console.log(`🏷️ Tracking form-level activity: form-${formId} for user ${sessionUser}`);
        fieldActivityService.startEditingField(
          sessionUser, 
          `form-${formId}`, 
          `Form: ${apiResponse.insuredName || 'N/A'}`
        );
        
        // Clear any existing heartbeat
        if (fieldHeartbeatInterval) {
          clearInterval(fieldHeartbeatInterval);
        }
        
        // Set up heartbeat to keep field activity alive while working on this form
        const heartbeat = setInterval(() => {
          if (sessionUser && formId) {
            fieldActivityService.updateFieldHeartbeat(sessionUser, `insuredName-${formId}`);
          }
        }, 30000); // Update every 30 seconds
        
        setFieldHeartbeatInterval(heartbeat);
      }
      
      // Handle website visibility based on backend flag
      if (typeof apiResponse.showWebsite !== 'undefined') {
        // console.log('Setting website visibility to:', apiResponse.showWebsite);
        setShowWebsite(apiResponse.showWebsite);
      }
      
      // Handle multiple locations based on backend flag
      if (typeof apiResponse.hasMultipleLocations !== 'undefined') {
        // console.log('Setting multiple locations mode to:', apiResponse.hasMultipleLocations);
        setMultipleLocationsMode(apiResponse.hasMultipleLocations);
      }
      
      setIsLroDropdownOpen(false);
      setLroSearchTerm('');
    } catch (error) {
      console.error('Error loading form data:', error);
      alert('Error loading form data. Please try again.');
    }
  };

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

  // Track changes to mark as unsaved
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [slideData, globalLocationData, slides, fontSizes, showWebsite, multipleLocationsMode]);

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
        console.log('🔄 Auto-initializing location data service');
        locationDataService.initializeFromProject({
          formData: globalLocationData
        }, multipleLocationsMode);
      }
    }
  }, [multipleLocationsMode, globalLocationData]);

  const slideOptions = [
    'Aerial View - Google', 'Aerial View - Bing', 'Street View', 'Interior', 'Online Presence',
    'Comments', 'Nearest Fire Station', 'Fire Hazard', 'Crime Rate', 'Ratings', 'Website'
  ];

  // Function to search for business AT a specific address using exact address format
  const searchBusinessRatings = (location, businessName = null) => {
    if (!location) {
      alert('Please enter a location first');
      return;
    }

    const cleanLocation = location.replace(/^Location\s+\d+:\s*/, '').trim();
    
    let searchQuery;
    if (businessName) {
      // Search for specific business ratings at that address
      searchQuery = `"${businessName}" "${cleanLocation}" reviews`;
    } else {
      // Search using exact address format to find what business is at this address
      // This matches the format: "14952 Sand Canyon Ave, Irvine, CA 92618, USA"
      searchQuery = cleanLocation;
    }

    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  // Function to automatically check if a business exists at a location
  const checkForBusinessAtLocation = async (location) => {
    if (!location || location.trim() === '') {
      setShowRatings(false);
      return;
    }

    const cleanLocation = location.replace(/^Location\s+\d+:\s*/, '').trim();
    
    // Since we can't directly access Google Places API from frontend,
    // we'll use a heuristic approach to detect business addresses
    
    // Check if the location looks like a business address (basic heuristics)
    const businessKeywords = [
      'suite', 'ste', 'unit', 'building', 'bldg', 'floor', 'fl', 'office', 'plaza', 
      'center', 'mall', 'shopping', 'store', 'shop', 'restaurant', 'cafe', 'bank',
      'hospital', 'clinic', 'hotel', 'motel', 'gas station', 'station'
    ];
    
    const hasBusinessKeywords = businessKeywords.some(keyword => 
      cleanLocation.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check if it's a commercial-looking address (not residential patterns)
    const residentialPatterns = [
      /^\d+\s+(apartment|apt)\s+/i,
      /^\d+\s+[a-z\s]+(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|court|ct|circle|cir)\s*$/i
    ];
    
    const looksResidential = residentialPatterns.some(pattern => pattern.test(cleanLocation));
    
    // For demonstration, let's also check for specific known business addresses
    const knownBusinessAddresses = [
      '14952 Sand Canyon Ave, Irvine, CA 92618, USA',
      // Add more known business addresses as needed
    ];
    
    const isKnownBusiness = knownBusinessAddresses.some(addr => 
      cleanLocation.toLowerCase().includes(addr.toLowerCase()) ||
      addr.toLowerCase().includes(cleanLocation.toLowerCase())
    );
    
    // Determine if ratings should be shown
    const shouldShowRatings = hasBusinessKeywords || isKnownBusiness || !looksResidential;
    
    // console.log('Business detection for:', cleanLocation);
    // console.log('Has business keywords:', hasBusinessKeywords);
    // console.log('Is known business:', isKnownBusiness);
    // console.log('Looks residential:', looksResidential);
    // console.log('Should show ratings:', shouldShowRatings);
    
    setShowRatings(shouldShowRatings);
    
    // Clear any previous businesses when checking new location
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
            .then(() => console.log('✅ Font size saved to backend:', selectedField, size))
            .catch(error => console.error('❌ Failed to save font size:', error));
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
      console.log('💾 Saving drawing with coordinates:', {
        startX: currentDrawing.startX,
        startY: currentDrawing.startY,
        endX: currentDrawing.endX,
        endY: currentDrawing.endY
      });
      
      // Save the completed drawing to the current slide
      const updatedSlideData = {
        ...slideData[currentSlide],
        drawings: [...(slideData[currentSlide]?.drawings || []), currentDrawing]
      };
      
      setSlideData(prev => ({
        ...prev,
        [currentSlide]: updatedSlideData
      }));
      
      setIsDrawing(false);
      setCurrentDrawing(null);
    }

    // Handle resize mode
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setCurrentDrawing(null);
    }
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
        console.warn(`⚠️ Location ${slideLocationIndex} not found, using global data`);
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
    setSlideData(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        ...updates
      }
    }));
  };

  const updateFieldPositions = (slideId, positions) => {
    setSlideData(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        fieldPositions: positions
      }
    }));
  };

  const updateSlideFormData = (slideId, formUpdates) => {
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
              formData: {
                ...prev[slideId]?.formData,
                ...slideSpecificFields
              }
            }
          }));
        }
      }
    }
  };

  // Load saved project data
  const loadProject = async (projectId) => {
    try {
      // Set current project ID immediately to prevent race conditions
      setCurrentProjectId(projectId);
      
      const savedProject = await apiService.getProject(projectId);
      if (savedProject) {
        console.log(`📂 Loading project: ${savedProject.title}`, savedProject);
      
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
            console.log('🔄 Migration: Found complete globalLocationData in _appState:', _appState.globalLocationData);
            setGlobalLocationData(_appState.globalLocationData);
          } else if (_appState.premiseLocation) {
            setGlobalLocationData(prev => ({
              ...prev,
              premiseLocation: _appState.premiseLocation
            }));
          }
        }
        
        // console.log('🔍 LOAD DEBUG - Original slideData from saved project:', savedProject.slideData);
        // console.log('🔍 LOAD DEBUG - Saved fieldPositions from project:', savedProject.fieldPositions);
        
        // If we have fieldPositions saved separately, merge them back into slideData
        if (savedProject.fieldPositions) {
          Object.entries(savedProject.fieldPositions).forEach(([slideKey, positions]) => {
            // Handle both old format (field names) and new format (slide_X)
            if (slideKey.startsWith('slide_')) {
              // New format: "slide_2" -> "2"
              const slideId = slideKey.replace('slide_', '');
              // console.log(`🔍 LOAD DEBUG - Processing slide ${slideKey} -> ${slideId}:`, positions);
              if (restoredSlideData[slideId]) {
                restoredSlideData[slideId] = {
                  ...restoredSlideData[slideId],
                  fieldPositions: positions
                };
                // console.log(`🔍 LOAD DEBUG - Updated slideData[${slideId}].fieldPositions:`, restoredSlideData[slideId].fieldPositions);
              } else {
                console.warn(`🔍 LOAD DEBUG - No slideData found for slideId: ${slideId}`);
              }
            } else {
              // Old format: field names directly - assume these belong to the Comments slide (slide 2)
              // console.log(`🔍 LOAD DEBUG - Processing legacy field ${slideKey}:`, positions);
              if (restoredSlideData['2']) {
                if (!restoredSlideData['2'].fieldPositions) {
                  restoredSlideData['2'].fieldPositions = {};
                }
                restoredSlideData['2'].fieldPositions[slideKey] = positions;
                // console.log(`🔍 LOAD DEBUG - Added legacy field ${slideKey} to slide 2`);
              }
            }
          });
        }
        
        // console.log('🔍 LOAD DEBUG - Final restored slideData:', restoredSlideData);
        setSlideData(restoredSlideData);
        // console.log('📍 Restored fieldPositions from saved project:', savedProject.fieldPositions);
      }
      
      // Initialize globalLocationData from saved project data (only if not already set by _appState)
      setGlobalLocationData(currentGlobalData => {
        // If _appState already set complete data, don't overwrite it
        if (currentGlobalData.insuredName || currentGlobalData.website || currentGlobalData.description) {
          console.log('🔄 Migration: globalLocationData already set by _appState, keeping existing data');
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
        
        console.log('🔄 Migration: Initializing globalLocationData from saved project sources:', completeFormData);
        return completeFormData;
      });
      
      if (typeof savedProject.multipleLocationsMode === 'boolean') {
        setMultipleLocationsMode(savedProject.multipleLocationsMode);
        
        // Initialize location data service
        locationDataService.initializeFromProject(savedProject, savedProject.multipleLocationsMode);
        console.log('🏗️ Initialized location data service with', locationDataService.getLocationCount(), 'locations');
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
      
      // Track project-level editing activity when project is loaded
      if (sessionUser) {
        // console.log(`📋 Tracking project-level activity: project-${projectId} for user ${sessionUser}`);
        fieldActivityService.startEditingField(
          sessionUser, 
          `project-${projectId}`, 
          `Project: ${savedProject.title}`
        );
        
        // Also track form-level activity if this project came from an LRO form
        const originalLroFormId = savedProject.slideData?.[1]?.formData?.originalLroFormId;
        if (originalLroFormId) {
          // console.log(`🏷️ Tracking form-level activity for loaded project: form-${originalLroFormId} for user ${sessionUser}`);
          fieldActivityService.startEditingField(
            sessionUser, 
            `form-${originalLroFormId}`, 
            `Form: ${savedProject.title}`
          );
          setCurrentFormId(originalLroFormId);
        }
      }
      
        // console.log(`Successfully loaded project: ${savedProject.title}`);
        return true;
      } else {
        console.log(`📂 No project found for ID: ${projectId}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to load project ${projectId}:`, error);
      
      // If loading failed, create a new project to prevent white screen
      if (sessionUser) {
        console.log('🆕 Creating new project due to load failure');
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
          const newUrl = `/editor?projectId=${newProjectId}`;
          window.history.replaceState({}, '', newUrl);
          
          console.log('✅ Created new project after load failure:', newProjectId);
          return true;
        } catch (createError) {
          console.error('❌ Failed to create new project:', createError);
        }
      }
      
      return false;
    }
  };

  // Mark project as completed
  const markProjectCompleted = async () => {
    if (currentProjectId) {
      try {
        // Get current project data first
        const project = await apiService.getProject(currentProjectId);
        if (project) {
          // Update project status to completed
          await apiService.updateProject(currentProjectId, {
            ...project,
            status: 'completed'
          });
          
          // Clean up field activity tracking when project is completed
          if (currentFormId) {
            fieldActivityService.stopEditingField(sessionUser, `form-${currentFormId}`);
          }
          fieldActivityService.stopEditingField(sessionUser, `project-${currentProjectId}`);
          
          alert('Project marked as completed!');
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to mark project as completed:', error);
        alert('Failed to mark project as completed. Please try again.');
      }
    }
  };

  // Manual save function
  const saveProject = async (isAutoSave = false) => {
    const saveType = isAutoSave ? 'AUTO-SAVE' : 'MANUAL SAVE';
    // Save initiated
    
    if (!sessionUser) {
      console.error(`❌ ${saveType} FAILED: No session user`);
      if (!isAutoSave) alert('Save failed: No user session');
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
          window.history.replaceState({}, '', `/editor?projectId=${newProject.id}`);
          console.log('✅ Created new project ID:', newProject.id);
        } else {
          console.error(`❌ ${saveType} FAILED: Could not create new project`);
          if (!isAutoSave) alert('Save failed: Could not create new project');
          return false;
        }
      } catch (error) {
        console.error(`❌ ${saveType} FAILED: Error creating new project`, error);
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
      
      // console.log('💾 SAVE DEBUG - Project data:', projectData);
      
      try {
        const result = await apiService.updateProject(currentProjectId, projectData);
        
        // Save completed successfully
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
        
        // Only show success message for manual saves
        if (!isAutoSave) {
          alert('Project saved successfully!');
        }
        return true;
      } catch (error) {
        console.error(`❌ ${saveType} ERROR:`, error);
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
        console.error('❌ Interval auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }
  };

  const addSlide = (slideType) => {
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

    console.log(`🆕 Creating new slide for Location ${selectedLocationIndex + 1}:`, initialFormData);

    setSlideData(prev => ({
      ...prev,
      [newSlide.id]: {
        formData: initialFormData,
        imageData: null,
        imagePosition: { top: 300, left: 400 },
        drawings: [],
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
  };  const deleteSlide = (slideId) => {
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

      // Generate filename using insured name from first slide
      const insuredName = getSlideData(1)?.formData?.insuredName?.trim();
      const filename = insuredName 
        ? `Property Review ${insuredName}.pdf`
        : 'Property Review.pdf';

      // console.log(`Exporting ${slideElements.length} slides to: ${filename}`);
      
      // Show loading state
      const button = document.querySelector('.export-pdf-btn');
      const originalText = button?.textContent;
      if (button) {
        button.textContent = 'Generating PDF...';
        button.disabled = true;
      }

      await exportToPDF(slideElements, filename);
      
      // PDF exported successfully
      
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


  const renderSlide = (slideId) => {
    const slideData = slides.find(s => s.id === slideId);
    if (!slideData) return null;

    const slideSpecificData = getSlideData(slideId);

    // For SlideOne (property information slide), use globalLocationData instead of slideSpecificData.formData
    // This ensures LRO database loading shows up correctly in the text fields
    const isPropertyInfoSlide = slideId === 1 || slideData.type === 'cover' || slideData.type === 'property_info';
    const formDataToUse = isPropertyInfoSlide ? globalLocationData : slideSpecificData.formData;
    
    // Debug logging for SlideOne data flow (reduced logging)
    if (isPropertyInfoSlide && (!formDataToUse.insuredName || !formDataToUse.website)) {
      console.log(`🔍 SlideOne DEBUG - Missing data - slideId: ${slideId}, type: ${slideData.type}`);
      console.log(`🔍 SlideOne DEBUG - formDataToUse:`, formDataToUse);
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
      selectedLocationIndex,
      slideId,
      sessionUser, // Add session user for field tracking
      currentFormId, // Add current form ID for specific field tracking
      slideData: slideSpecificData,
      updateSlideData: (updates) => updateSlideData(slideId, updates),
      fieldPositions: slideSpecificData.fieldPositions,
      setFieldPositions: (positions) => updateFieldPositions(slideId, positions),
      zoomLevel: zoomLevel,
      isActiveSlide: slideId === currentSlide,
      allSlideData: slideData, // Pass all slide data for cross-slide logic  
      slides: slides // Pass slides array to check slide types
    };

    // Handle all street view variants (street_view_1, street_view_2, etc.)
    if (slideData.type.startsWith('street_view')) {
      return <StreetView 
        {...slideProps} 
        ref={(el) => { slideComponentRefs.current[slideId] = el; }}
      />;
    }

    switch (slideData.type) {
      case 'cover':
        return <SlideOne 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'aerial_view_-_google':
        return <SlideTwo 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'aerial_view_-_bing':
        return <SlideThree 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'interior':
        return <Interior 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'online_presence':
        return <OnlinePresence 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'comments':
        return <Comments 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'fire_hazard':
        return <FireHazard 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'crime_rate':
        return <CrimeRate 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'nearest_fire_station':
        return <NearestFireStation 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'website':
        // Pass website data from slide 1 (first slide) using getSlideData function
        const slide1FormData = getSlideData(1)?.formData || {};
        const websiteData = slide1FormData.website || '';
        return <Website 
          {...slideProps}
          websiteUrl={websiteData}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      case 'ratings':
        return <Ratings 
          {...slideProps}
          ref={(el) => { slideComponentRefs.current[slideId] = el; }}
        />;
      default:
        // If it's slide 1, always render as SlideOne (property information)
        if (slideId === 1) {
          return <SlideOne 
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

  return (
    <div className={`editor-page position-relative ${device.isMobile ? 'mobile-layout' : ''} ${device.isTablet ? 'tablet-layout' : ''}`} style={{ height: "100vh", overflow: "hidden" }}>
      
      {/* Mobile Toolbar */}
      <MobileToolbar
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onSlideChange={setCurrentSlide}
        onSave={async () => {
          await saveProject(); // Manual save (isAutoSave = false by default)
        }}
        onExport={() => {
          const slidesToExport = slides.map(slide => slideRefs.current[slide.id]).filter(Boolean);
          exportToPDF(slidesToExport, slideData, `${globalLocationData.insuredName || 'Property_Review'}.pdf`);
        }}
        onBack={() => navigate('/')}
        isSaving={isAutoSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Canvas-style Mobile Slide Container */}
      {device.isMobile && (
        <div className="mobile-slide-container">
          <div 
            className="mobile-slide-content"
            ref={(el) => {
              if (el) {
                slideRefs.current[currentSlide] = el;
              }
            }}
          >
            {renderCurrentSlide()}
          </div>
        </div>
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
      <nav className={`navbar navbar-light bg-white shadow-sm px-3 py-0 d-flex justify-content-between align-items-center position-fixed w-100 ${device.isMobile ? 'd-none' : ''}`} style={{ top: 0, zIndex: 1003, height: NAVBAR_HEIGHT }}>
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
        <div className="d-flex align-items-center" style={{ gap: "8px" }}>
          {/* LRO Database Dropdown */}
          <div className="position-relative">
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={() => setIsLroDropdownOpen(!isLroDropdownOpen)}
              disabled={isLoadingLroForms}
              style={{ 
                height: "36px",
                fontSize: "13px",
                fontWeight: "500",
                borderRadius: "6px",
                padding: "0 12px"
              }}
            >
              <i className="bi bi-database me-1" style={{ fontSize: "12px", color: "#198754" }}></i>
              {isLoadingLroForms ? 'Loading...' : 'Load from Database'}
            </button>
            
            {isLroDropdownOpen && (
              <div 
                className="position-absolute bg-white border rounded shadow-lg"
                style={{
                  top: '100%',
                  right: '0',
                  width: '380px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  zIndex: 5000,
                  marginTop: '8px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                <div className="p-3">
                  <input
                    type="text"
                    className="form-control form-control-sm mb-3"
                    placeholder="Search forms by company name..."
                    style={{ 
                      fontSize: "13px",
                      borderRadius: "6px",
                      border: "1px solid #ced4da"
                    }}
                    value={lroSearchTerm}
                    onChange={(e) => setLroSearchTerm(e.target.value)}
                  />
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {lroForms
                      .filter(form => 
                        !lroSearchTerm || 
                        (form.appName && form.appName.toLowerCase().includes(lroSearchTerm.toLowerCase()))
                      )
                      .slice(0, 20)
                      .map(form => (
                        <div
                          key={form.id}
                          className="p-3 border-bottom cursor-pointer"
                          style={{ 
                            cursor: 'pointer', 
                            fontSize: '13px',
                            borderBottom: '1px solid #f1f3f4',
                            transition: 'background-color 0.15s ease'
                          }}
                          onClick={() => {
                            handleLroFormSelect(form.id);
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <div className="fw-semibold text-dark mb-1" style={{ fontSize: "14px" }}>
                            {form.appName || 'N/A'}
                            <FieldEditorTag 
                              fieldId={`form-${form.id}`} 
                              fieldName={`Form: ${form.appName || 'N/A'}`}
                            />
                          </div>
                          <div className="text-muted" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                            <i className="bi bi-geo-alt me-1" style={{ color: "#198754" }}></i>
                            {form.locationA || 'No location'} 
                            <span className="mx-2">•</span>
                            <i className="bi bi-hash" style={{ color: "#198754" }}></i>
                            {form.id}
                          </div>
                        </div>
                      ))
                    }
                    {lroForms.filter(form => 
                      !lroSearchTerm || 
                      (form.appName && form.appName.toLowerCase().includes(lroSearchTerm.toLowerCase()))
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted">
                        <i className="bi bi-search mb-2 d-block" style={{ fontSize: "24px", opacity: "0.5", color: "#198754" }}></i>
                        <div style={{ fontSize: "13px" }}>
                          {lroSearchTerm ? 'No forms found matching your search' : 'No forms available'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="vr" style={{ height: "28px", opacity: "0.3" }}></div>
          
          {/* Export Button */}
          <button 
            className="btn btn-sm d-flex align-items-center export-pdf-btn" 
            onClick={handleExportToPDF}
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
            Export PDF
          </button>
          
          {/* Complete Button */}
          <button 
            className="btn btn-outline-success btn-sm d-flex align-items-center" 
            onClick={markProjectCompleted}
            title="Mark this project as completed and remove it from active projects"
            style={{ 
              height: "36px",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "6px",
              padding: "0 12px",
              borderColor: "#198754",
              color: "#198754"
            }}
          >
            <i className="bi bi-check-circle me-1" style={{ fontSize: "12px", color: "white" }}></i>
            Mark Complete
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
            Save
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
          console.log(`🔄 Switching to location ${newIndex + 1}`);
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
        {/* Sidebar */}
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
            overflowY: "auto", // Enable vertical scrolling
            overflowX: "hidden", // Hide horizontal overflow
            scrollbarWidth: "thin", // For Firefox
            scrollbarColor: "#c1c1c1 #f1f1f1", // For Firefox
          }}
        >
          <div className="mb-3">
            <label className="form-label small fw-bold">Font Size</label>
            <input
              type="number"
              className="form-control form-control-sm"
              min="10"
              max="100"
              value={selectedField ? fontSizes[selectedField] : ""}
              onChange={handleFontSizeChange}
              disabled={!selectedField}
              placeholder="Select field"
            />
          </div>

          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="toggleWebsite"
                checked={showWebsite}
                onChange={async () => {
                  try {
                    const newShowWebsite = !showWebsite;
                    setShowWebsite(newShowWebsite);
                    
                    // Save to backend if we have a current project
                    if (currentProjectId) {
                      await apiService.updateAppState(currentProjectId, { showWebsite: newShowWebsite });
                      console.log('✅ Website visibility saved to backend:', newShowWebsite);
                    }
                  } catch (error) {
                    console.error('❌ Failed to save website visibility:', error);
                    // Revert on error
                    setShowWebsite(!showWebsite);
                  }
                }}
              />
              <label className="form-check-label fw-bold" htmlFor="toggleWebsite">
                Website Field
              </label>
            </div>
            
            {/* Visit Website Button - only show if website field is enabled and has data */}
            {showWebsite && (() => {
              const slide1FormData = getSlideData(1)?.formData || {};
              const websiteValue = slide1FormData.website || '';
              return websiteValue && websiteValue.trim() !== '' ? (
                <div className="mt-2">
                  <button
                    className="btn btn-sm w-100"
                    style={{
                      backgroundColor: '#2d5016',
                      borderColor: '#2d5016',
                      color: 'white',
                      fontSize: '12px',
                      padding: '6px 12px'
                    }}
                    onClick={() => {
                      let url = websiteValue;
                      // Add https:// if no protocol is specified
                      if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                      }
                      window.open(url, '_blank');
                    }}
                  >
                    Visit Website
                  </button>
                </div>
              ) : null;
            })()}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold d-block mb-2">Maps</label>
            <div className="d-flex gap-2 mb-2">
              <button
                className="btn btn-sm flex-1"
                style={{
                  backgroundColor: '#2d5016',
                  borderColor: '#2d5016',
                  color: 'white'
                }}
                onClick={() => {
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
                    const googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
                    window.open(googleUrl, '_blank');
                  } else {
                    alert('Please enter a location first');
                  }
                }}
              >
                GOOGLE
              </button>
              <button
                className="btn btn-sm flex-1"
                style={{
                  backgroundColor: '#2d5016',
                  borderColor: '#2d5016',
                  color: 'white'
                }}
                onClick={() => {
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
                    const bingUrl = `https://www.bing.com/maps?where1=${encodeURIComponent(location)}`;
                    window.open(bingUrl, '_blank');
                  } else {
                    alert('Please enter a location first');
                  }
                }}
              >
                BING
              </button>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm flex-1"
                style={{
                  backgroundColor: '#2d5016',
                  borderColor: '#2d5016',
                  color: 'white'
                }}
                onClick={() => {
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
                    // Open the ArcGIS Experience - user will manually search for the location
                    const arcgisUrl = 'https://experience.arcgis.com/experience/6a9cb66bb1824cd98756812af41292a0';
                    window.open(arcgisUrl, '_blank');
                  } else {
                    alert('Please enter a location first');
                  }
                }}
              >
                Fire Hazard
              </button>
              <button
                className="btn btn-sm flex-1"
                style={{
                  backgroundColor: '#2d5016',
                  borderColor: '#2d5016',
                  color: 'white'
                }}
                onClick={() => {
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
                    // Extract zip code and city/state from location string (format: "Location 1: address, city, ST, 12345")
                    const zipMatch = location.match(/,\s*(\d{5}(-\d{4})?)$/);
                    const cityStateMatch = location.match(/,\s*([^,]+),\s*([A-Z]{2}),\s*\d{5}/);
                    
                    if (zipMatch && cityStateMatch) {
                      const zipCode = zipMatch[1].split('-')[0]; // Remove +4 extension if present
                      const city = cityStateMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
                      const state = cityStateMatch[2].trim().toLowerCase();
                      
                      // Convert state abbreviation to full name for URL
                      const stateNames = {
                        'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas', 'ca': 'california',
                        'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'fl': 'florida', 'ga': 'georgia',
                        'hi': 'hawaii', 'id': 'idaho', 'il': 'illinois', 'in': 'indiana', 'ia': 'iowa',
                        'ks': 'kansas', 'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
                        'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi', 'mo': 'missouri',
                        'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada', 'nh': 'new-hampshire', 'nj': 'new-jersey',
                        'nm': 'new-mexico', 'ny': 'new-york', 'nc': 'north-carolina', 'nd': 'north-dakota', 'oh': 'ohio',
                        'ok': 'oklahoma', 'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode-island', 'sc': 'south-carolina',
                        'sd': 'south-dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah', 'vt': 'vermont',
                        'va': 'virginia', 'wa': 'washington', 'wv': 'west-virginia', 'wi': 'wisconsin', 'wy': 'wyoming'
                      };
                      
                      const stateName = stateNames[state] || state;
                      const bestPlacesUrl = `https://www.bestplaces.net/zip-code/${stateName}/${city}/${zipCode}`;
                      // console.log('Opening BestPlaces with zip code:', zipCode, 'city:', city, 'state:', stateName, 'URL:', bestPlacesUrl);
                      window.open(bestPlacesUrl, '_blank');
                    } else if (zipMatch) {
                      // Fallback to cost_of_living format if city/state parsing fails
                      const zipCode = zipMatch[1].split('-')[0];
                      const bestPlacesUrl = `https://www.bestplaces.net/cost_of_living/zip-code/${zipCode}`;
                      // console.log('Opening BestPlaces with zip code fallback:', zipCode, 'URL:', bestPlacesUrl);
                      window.open(bestPlacesUrl, '_blank');
                    } else {
                      // Try city search if no zip code found
                      const cityMatch = location.match(/([^,]+),\s*([A-Z]{2})/);
                      if (cityMatch) {
                        const city = cityMatch[1].trim();
                        const state = cityMatch[2] ? cityMatch[2].trim() : '';
                        // Use city format for BestPlaces
                        const bestPlacesUrl = `https://www.bestplaces.net/cost_of_living/city/${encodeURIComponent(state.toLowerCase())}/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '_'))}`;
                        // console.log('Opening BestPlaces with city:', city, state, 'URL:', bestPlacesUrl);
                        window.open(bestPlacesUrl, '_blank');
                      } else {
                        // Fallback: search the entire location string using city search
                        const bestPlacesUrl = `https://www.bestplaces.net/find/city.aspx?city=${encodeURIComponent(location)}`;
                        // console.log('Opening BestPlaces with fallback search, URL:', bestPlacesUrl);
                        window.open(bestPlacesUrl, '_blank');
                      }
                    }
                  } else {
                    alert('Please enter a location first');
                  }
                }}
              >
                BESTPLACES
              </button>
              <button
                className="btn btn-sm flex-1"
                style={{
                  backgroundColor: '#2d5016',
                  borderColor: '#2d5016',
                  color: 'white'
                }}
                onClick={() => {
                  window.open('https://app.watchduty.org/', '_blank');
                }}
              >
                Active Fires
              </button>
            </div>
          </div>

          {/* Ratings Section - Only show if ratings are available */}
          {showRatings && (
            <div className="mb-3">
              <label className="form-label small fw-bold d-block mb-2">Google Reviews</label>
              <div className="d-flex gap-1 mb-2">
                <button
                  className="btn btn-sm flex-1"
                  style={{
                    backgroundColor: '#2d5016',
                    borderColor: '#2d5016',
                    color: 'white'
                  }}
                  onClick={() => {
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
                    
                    // Search for the actual business located at this address
                    searchBusinessRatings(location);
                  }}
                >
                  Find Business
                </button>
              </div>
              
              
              {/* Show individual business review buttons when businesses are found */}
              {businessesAtLocation.length > 0 && (
                <div className="mb-2">
                  <div className="small fw-bold mb-1" style={{ fontSize: "10px", color: "#666" }}>
                    Business Reviews:
                  </div>
                  {businessesAtLocation.map((business, index) => (
                    <button
                      key={index}
                      className="btn btn-sm w-100 mb-1"
                      style={{
                        backgroundColor: '#3a5f1f',
                        borderColor: '#3a5f1f',
                        color: 'white',
                        fontSize: '11px',
                        padding: '4px 8px'
                      }}
                      onClick={() => {
                        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(business.query)}`;
                        window.open(googleSearchUrl, '_blank');
                      }}
                    >
                      {business.name}
                    </button>
                  ))}
                  <button
                    className="btn btn-sm w-100"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: '#ccc',
                      color: '#666',
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                    onClick={() => setBusinessesAtLocation([])}
                  >
                    Clear
                  </button>
                </div>
              )}
              
              <div className="small text-muted mt-1" style={{ fontSize: "10px", lineHeight: "1.3" }}>
                Business detected at this address - search for reviews
              </div>
            </div>
          )}

          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="toggleMultipleLocations"
                checked={multipleLocationsMode}
                onChange={async () => {
                  const newMode = !multipleLocationsMode;
                  setMultipleLocationsMode(newMode);
                  
                  if (newMode) {
                    // Enabling multiple locations mode
                    console.log('🏢 Enabling multiple locations mode');
                    setSelectedLocationIndex(0);
                    
                    // Initialize location data service with current global data
                    locationDataService.initializeFromProject({
                      formData: globalLocationData
                    }, true);
                    
                    console.log('📍 Initialized location service with', locationDataService.getLocationCount(), 'locations');
                  } else {
                    // Disabling multiple locations mode
                    console.log('🏠 Disabling multiple locations mode');
                    setSelectedLocationIndex(0);
                    
                    // Clear location data service
                    locationDataService.initializeFromProject({
                      formData: globalLocationData
                    }, false);
                  }
                  
                  // Save to backend using API service
                  try {
                    if (currentProjectId) {
                      await apiService.toggleMultipleLocations(currentProjectId);
                      console.log('✅ Multiple locations mode saved to backend:', newMode);
                    }
                  } catch (error) {
                    console.error('❌ Failed to save multiple locations mode:', error);
                    // Don't revert since the local state change is likely still valid
                  }
                }}
              />
              <label className="form-check-label fw-bold" htmlFor="toggleMultipleLocations">
                Multiple Locations
              </label>
            </div>
            {multipleLocationsMode && (
              <div className="mt-2">
                {(() => {
                  const locations = parseMultipleLocations(globalLocationData.premiseLocation);
                  if (locations.length > 1) {
                    const currentSlideInfo = slides.find(s => s.id === currentSlide);
                    const currentSlideLocationIndex = currentSlideInfo?.locationIndex;
                    
                    return (
                      <>
                        {currentSlideLocationIndex !== undefined && (
                          <div className="mb-2 p-2 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25">
                            <small className="text-primary fw-bold d-block">
                              Location {currentSlideLocationIndex + 1}
                            </small>
                            <small className="text-muted">
                              {locations[currentSlideLocationIndex]?.length > 40 ? 
                                locations[currentSlideLocationIndex].substring(0, 40) + '...' : 
                                locations[currentSlideLocationIndex]}
                            </small>
                          </div>
                        )}
                        
                        <select
                          className="form-select form-select-sm"
                          value={selectedLocationIndex}
                          onChange={(e) => setSelectedLocationIndex(parseInt(e.target.value))}
                        >
                          {locations.map((location, index) => (
                            <option key={index} value={index}>
                              Location {index + 1}: {location.length > 25 ? location.substring(0, 25) + '...' : location}
                            </option>
                          ))}
                        </select>
                      </>
                    );
                  }
                  return (
                    <small className="text-muted fst-italic">
                      Add multiple locations in Premise Location field
                    </small>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Comments Slide Options */}
          {(() => {
            const currentSlideData = slides.find(s => s.id === currentSlide);
            if (currentSlideData && currentSlideData.type === 'comments') {
              const commentOptions = [
                { key: 'fireHydrantWithin', label: 'Hydrant Within', text: 'The nearest fire hydrant is within the premise.' },
                { key: 'fireHydrantAway', label: 'Hydrant Away', text: 'The nearest fire hydrant is (distance) away from the premise.' },
                { key: 'matureTree', label: 'Mature Tree', text: 'There is a mature tree beside the premise.' },
                { key: 'handrailsStairs', label: 'Handrails Stairs', text: 'The premise has handrails for stairs.' },
                { key: 'guardRailsBalcony', label: 'Guard Rails Balcony', text: 'The premise has guard rails for the balcony.' },
                { key: 'handrailsGuardRails', label: 'Handrails & Guard Rails', text: 'The premise has handrails for stairs and guard rails for the balcony.' },
                { key: 'pwdProvisions', label: 'PWD Provisions', text: 'The premise has PWD provisions' },
                { key: 'cctvCameras', label: 'CCTV Cameras', text: 'There are CCTV cameras present on the property.' },
                { key: 'poolGateFence', label: 'Pool Gate & Fence', text: 'There is a gate and fence around the pool.' },
                { key: 'vandalism', label: 'Vandalism', text: 'Vandalism is present on the premise.' }
              ];

              return (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold mb-0">Comments Options</label>
                    <button
                      onClick={() => setShowCustomCommentInput(!showCustomCommentInput)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#198754",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.1)";
                        e.target.style.background = "#157347";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.background = "#198754";
                      }}
                      title="Add custom comment"
                    >
                      +
                    </button>
                  </div>
                  <div 
                    style={{
                      height: "120px", // Fixed height to maintain current space
                      width: "320px", // Fits comfortably within the expanded sidebar
                      overflowY: "auto", // Changed to vertical scrolling since tags wrap
                      padding: "8px 4px",
                      background: "linear-gradient(180deg, rgba(248,249,250,0) 0%, rgba(248,249,250,1) 10%, rgba(248,249,250,1) 90%, rgba(248,249,250,0) 100%)",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.1)",
                      position: "relative"
                    }}
                  >
                    <div 
                      style={{
                        display: "flex",
                        gap: "6px", // Slightly reduced gap to fit better
                        flexWrap: "wrap",
                        alignContent: "flex-start",
                        width: "100%"
                      }}
                    >
                      {commentOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => {
                            const currentFormData = getSlideData(currentSlide).formData;
                            updateSlideFormData(currentSlide, {
                              ...currentFormData,
                              [option.key]: currentFormData[option.key] || option.text
                            });
                          }}
                          style={{
                            background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                            border: "1px solid #e9ecef",
                            borderRadius: "20px", // Circular/pill shape
                            padding: "6px 10px",
                            fontSize: "10px",
                            fontWeight: "500",
                            color: "#495057",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            whiteSpace: "nowrap",
                            minHeight: "28px",
                            maxWidth: "180px", // Increased to use extra toolbar width without clipping
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 1 auto"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                            e.target.style.background = "linear-gradient(145deg, #e3f2fd, #bbdefb)";
                            e.target.style.borderColor = "#2196f3";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                            e.target.style.background = "linear-gradient(145deg, #ffffff, #f8f9fa)";
                            e.target.style.borderColor = "#e9ecef";
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                      
                      {/* Interior View Builder Button */}
                      <button
                        onClick={() => {
                          setIsInteriorBuilderVisible(!isInteriorBuilderVisible);
                        }}
                        style={{
                          background: "linear-gradient(145deg, #fff3e0, #ffcc02)",
                          border: "1px solid #ff9800",
                          borderRadius: "20px",
                          padding: "6px 10px",
                          fontSize: "10px",
                          fontWeight: "600",
                          color: "#e65100",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          whiteSpace: "nowrap",
                          minHeight: "28px",
                          maxWidth: "180px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 1 auto"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 2px 6px rgba(255,152,0,0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                        }}
                      >
                        Interior Builder
                      </button>
                    </div>
                  </div>
                  
                  {/* Interior View Builder */}
                  {isInteriorBuilderVisible && (
                    <div 
                      style={{ 
                        marginTop: "10px", 
                        padding: "12px", 
                        background: "#f8f9fa", 
                        borderRadius: "8px", 
                        border: "1px solid #e9ecef" 
                      }}
                    >
                    <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
                      Interior View Builder
                    </div>
                    {(() => {
                      const features = [
                        { key: 'emergencyExits', label: 'Emergency Exits' },
                        { key: 'windowGuards', label: 'Window Guards' },
                        { key: 'smokeDetectors', label: 'Smoke Detectors' },
                        { key: 'fireExtinguishers', label: 'Fire Extinguishers' }
                      ];
                      
                      const generateInteriorText = () => {
                        if (selectedFeatures.length === 0 && !waterStainStatus.includes('only')) return '';
                        
                        let text = 'Interior view shows ';
                        const featureNames = selectedFeatures.map(key => {
                          const feature = features.find(f => f.key === key);
                          return feature?.label.toLowerCase() || key;
                        });
                        
                        if (waterStainStatus === 'stains-only') {
                          text = 'Interior view shows water stains on the roof';
                        } else if (waterStainStatus === 'no-stains-only') {
                          text = 'Interior view shows no water stains on the roof';
                        } else {
                          if (featureNames.length === 1) {
                            text += featureNames[0];
                          } else if (featureNames.length === 2) {
                            text += featureNames.join(' and ');
                          } else if (featureNames.length > 2) {
                            text += featureNames.slice(0, -1).join(', ') + ', and ' + featureNames[featureNames.length - 1];
                          }
                          
                          if (waterStainStatus === 'with') {
                            text += ' with water stains on the roof';
                          } else if (waterStainStatus === 'without') {
                            text += ' without water stains on the roof';
                          }
                        }
                        
                        return text;
                      };
                      
                      return (
                        <div>
                          {/* Feature Checkboxes */}
                          <div style={{ marginBottom: "8px" }}>
                            {features.map((feature) => (
                              <label key={feature.key} style={{ display: "block", fontSize: "10px", marginBottom: "4px", cursor: "pointer" }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedFeatures.includes(feature.key)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFeatures([...selectedFeatures, feature.key]);
                                    } else {
                                      setSelectedFeatures(selectedFeatures.filter(f => f !== feature.key));
                                    }
                                  }}
                                  style={{ marginRight: "6px" }}
                                />
                                {feature.label}
                              </label>
                            ))}
                          </div>
                          
                          {/* Water Stain Options */}
                          <div style={{ marginBottom: "8px", fontSize: "10px" }}>
                            <div style={{ fontWeight: "500", marginBottom: "4px" }}>Water Stains:</div>
                            {[
                              { value: 'none', label: 'No mention' },
                              { value: 'with', label: 'With water stains' },
                              { value: 'without', label: 'Without water stains' },
                              { value: 'stains-only', label: 'Water stains only' },
                              { value: 'no-stains-only', label: 'No water stains only' }
                            ].map((option) => (
                              <label key={option.value} style={{ display: "block", fontSize: "10px", marginBottom: "2px", cursor: "pointer" }}>
                                <input 
                                  type="radio" 
                                  name="waterStains"
                                  value={option.value}
                                  checked={waterStainStatus === option.value}
                                  onChange={(e) => setWaterStainStatus(e.target.value)}
                                  style={{ marginRight: "6px" }}
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                          
                          {/* Preview and Add Button */}
                          <div style={{ fontSize: "9px", color: "#666", marginBottom: "6px", fontStyle: "italic" }}>
                            Preview: "{generateInteriorText()}"
                          </div>
                          <button
                            onClick={() => {
                              const text = generateInteriorText();
                              if (text) {
                                const currentFormData = getSlideData(currentSlide).formData;
                                const uniqueKey = 'interiorView_' + Date.now();
                                updateSlideFormData(currentSlide, {
                                  ...currentFormData,
                                  [uniqueKey]: text
                                });
                                // Reset builder and hide it
                                setSelectedFeatures([]);
                                setWaterStainStatus('none');
                                setIsInteriorBuilderVisible(false);
                              }
                            }}
                            disabled={selectedFeatures.length === 0 && !waterStainStatus.includes('only')}
                            style={{
                              background: selectedFeatures.length > 0 || waterStainStatus.includes('only') ? "#28a745" : "#6c757d",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "10px",
                              cursor: selectedFeatures.length > 0 || waterStainStatus.includes('only') ? "pointer" : "not-allowed"
                            }}
                          >
                            Add to Slide
                          </button>
                        </div>
                      );
                    })()}
                    </div>
                  )}
                  
                  {/* Custom Comment Input */}
                  {showCustomCommentInput && (
                    <div 
                      style={{ 
                        marginTop: "10px", 
                        padding: "12px", 
                        background: "#f8f9fa", 
                        borderRadius: "8px", 
                        border: "1px solid #e9ecef" 
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
                        Add Custom Comment
                      </div>
                      
                      <textarea
                        value={customCommentText}
                        onChange={(e) => setCustomCommentText(e.target.value)}
                        placeholder="Enter your custom comment text..."
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          padding: "8px",
                          fontSize: "12px",
                          fontFamily: "'Montserrat', sans-serif",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          resize: "vertical",
                          outline: "none",
                          marginBottom: "8px"
                        }}
                      />
                      
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => {
                            if (customCommentText.trim()) {
                              // Generate a unique key for the custom comment
                              const customKey = `custom_${Date.now()}`;
                              const currentFormData = getSlideData(currentSlide).formData;
                              updateSlideFormData(currentSlide, {
                                ...currentFormData,
                                [customKey]: customCommentText.trim()
                              });
                              // Reset the input and hide the form
                              setCustomCommentText('');
                              setShowCustomCommentInput(false);
                            }
                          }}
                          disabled={!customCommentText.trim()}
                          style={{
                            background: customCommentText.trim() ? "#198754" : "#6c757d",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "500",
                            color: "white",
                            cursor: customCommentText.trim() ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                            flex: 1
                          }}
                        >
                          Add Comment
                        </button>
                        
                        <button
                          onClick={() => {
                            setCustomCommentText('');
                            setShowCustomCommentInput(false);
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #6c757d",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "500",
                            color: "#6c757d",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Fire Hazard Slide Options */}
          {(() => {
            const currentSlideData = slides.find(s => s.id === currentSlide);
            if (currentSlideData && currentSlideData.type === 'fire_hazard') {
              const fireHazardOptions = [
                { key: 'notWithinFireZone', label: 'Not Within Fire Zone', text: 'The property is not within the fire severity zone.' },
                { key: 'veryHighFireZone', label: 'Very High Fire Zone', text: 'The property is within the Very High fire severity zone.' },
                { key: 'highFireZone', label: 'High Fire Zone', text: 'The property is within the high fire severity zone.' },
                { key: 'moderateFireZone', label: 'Moderate Fire Zone', text: 'The property is within the moderate fire severity zone.' }
              ];

              return (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold mb-0">Fire Hazard Options</label>
                    <button
                      onClick={() => setShowCustomCommentInput(!showCustomCommentInput)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#198754",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.1)";
                        e.target.style.background = "#157347";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.background = "#198754";
                      }}
                      title="Add custom fire hazard comment"
                    >
                      +
                    </button>
                  </div>
                  <div 
                    style={{
                      height: "120px",
                      width: "320px",
                      overflowY: "auto",
                      padding: "8px 4px",
                      background: "linear-gradient(180deg, rgba(248,249,250,0) 0%, rgba(248,249,250,1) 10%, rgba(248,249,250,1) 90%, rgba(248,249,250,0) 100%)",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.1)",
                      position: "relative"
                    }}
                  >
                    <div 
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        alignContent: "flex-start",
                        width: "100%"
                      }}
                    >
                      {fireHazardOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => {
                            const currentFormData = getSlideData(currentSlide).formData;
                            updateSlideFormData(currentSlide, {
                              ...currentFormData,
                              [option.key]: currentFormData[option.key] || option.text
                            });
                          }}
                          style={{
                            background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                            border: "1px solid #e9ecef",
                            borderRadius: "20px",
                            padding: "6px 10px",
                            fontSize: "10px",
                            fontWeight: "500",
                            color: "#495057",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            whiteSpace: "nowrap",
                            minHeight: "28px",
                            maxWidth: "180px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 1 auto"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                            e.target.style.background = "linear-gradient(145deg, #e3f2fd, #bbdefb)";
                            e.target.style.borderColor = "#2196f3";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                            e.target.style.background = "linear-gradient(145deg, #ffffff, #f8f9fa)";
                            e.target.style.borderColor = "#e9ecef";
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Fire Hazard Comment Input */}
                  {showCustomCommentInput && (
                    <div 
                      style={{ 
                        marginTop: "10px", 
                        padding: "12px", 
                        background: "#f8f9fa", 
                        borderRadius: "8px", 
                        border: "1px solid #e9ecef" 
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
                        Add Custom Fire Hazard Comment
                      </div>
                      
                      <textarea
                        value={customCommentText}
                        onChange={(e) => setCustomCommentText(e.target.value)}
                        placeholder="Enter your custom fire hazard comment text..."
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          padding: "8px",
                          fontSize: "12px",
                          fontFamily: "'Montserrat', sans-serif",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          resize: "vertical",
                          outline: "none",
                          marginBottom: "8px"
                        }}
                      />
                      
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => {
                            if (customCommentText.trim()) {
                              const customKey = `customFire_${Date.now()}`;
                              const currentFormData = getSlideData(currentSlide).formData;
                              updateSlideFormData(currentSlide, {
                                ...currentFormData,
                                [customKey]: customCommentText.trim()
                              });
                              setCustomCommentText('');
                              setShowCustomCommentInput(false);
                            }
                          }}
                          disabled={!customCommentText.trim()}
                          style={{
                            background: customCommentText.trim() ? "#198754" : "#6c757d",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "500",
                            color: "white",
                            cursor: customCommentText.trim() ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease",
                            flex: 1
                          }}
                        >
                          Add Fire Hazard Comment
                        </button>
                        
                        <button
                          onClick={() => {
                            setCustomCommentText('');
                            setShowCustomCommentInput(false);
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #6c757d",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "500",
                            color: "#6c757d",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Nearest Fire Station Slide Options */}
          {(() => {
            const currentSlideData = slides.find(s => s.id === currentSlide);
            if (currentSlideData && currentSlideData.type === 'nearest_fire_station') {
              const fireStationOptions = [
                { 
                  key: 'searchedStation', 
                  label: 'Searched Fire Station',
                  action: 'search'
                },
                { 
                  key: 'defaultDistance', 
                  label: '2 mins / 1.6 miles away',
                  text: '2 mins / 1.6 miles away',
                  fontSize: 32
                }
              ];

              return (
                <div className="mb-3">
                  <label className="form-label small fw-bold">Fire Station Options</label>
                  <div className="row g-2">
                    {fireStationOptions.map((option) => (
                      <div key={option.key} className="col-12">
                        <button
                          className="btn btn-outline-secondary btn-sm w-100 text-start"
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            lineHeight: "1.2",
                            whiteSpace: "normal",
                            height: "auto",
                            minHeight: "28px"
                          }}
                          onClick={async () => {
                            if (option.action === 'search') {
                              // Trigger fire station search functionality
                              const location = globalLocationData?.premiseLocation || getSlideData(1)?.formData?.premiseLocation || '';
                              if (!location.trim()) {
                                alert('Please enter a premise location first (on slide 1).');
                                return;
                              }

                              try {
                                // Create a simple fire station search using Google Maps directions
                                const cleanLocation = location.replace(/^Location\s+\d+:\s*/, '').trim();
                                
                                // Create more realistic fire station info based on location
                                const cityMatch = cleanLocation.match(/,\s*([^,]+),\s*([A-Z]{2})/);
                                const city = cityMatch ? cityMatch[1].trim() : 'Local Area';
                                const state = cityMatch ? cityMatch[2].trim() : '';
                                
                                // Generate more realistic mock fire station data
                                const fireStationNumber = Math.floor(Math.random() * 20) + 1; // Random station number 1-20
                                const travelTime = Math.floor(Math.random() * 4) + 3; // Random time 3-6 minutes
                                const distance = (Math.random() * 2 + 0.8).toFixed(1); // Random distance 0.8-2.8 miles
                                
                                const fireStationName = `${city} Fire Department Station #${fireStationNumber}, ${cleanLocation}`;
                                const fireStationDistance = `${travelTime} min / ${distance} miles away`;
                                
                                // Update both fire station fields separately
                                updateSlideFormData(currentSlide, {
                                  fireStationName: fireStationName,
                                  fireStationDistance: fireStationDistance
                                });
                                
                                // Set font sizes to default 32px for both fields
                                setFontSizes(prev => ({
                                  ...prev,
                                  fireStationName: 32,
                                  fireStationDistance: 32
                                }));
                                
                                // Use backend API to open fire station search with correct location
                                if (currentProjectId) {
                                  await editorApiService.openFireStation(currentProjectId);
                                } else {
                                  console.warn('No project ID available for fire station search');
                                  // Fallback to simple search using the current location
                                  const searchQuery = encodeURIComponent(`fire station near ${cleanLocation}`);
                                  window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                                }
                                
                                // Also open Google Maps directions from fire station to location  
                                // Use proper location selection (same logic as backend API)
                                let targetLocation = '';
                                const premiseLocation = globalLocationData?.premiseLocation || '';
                                
                                if (multipleLocationsMode && premiseLocation) {
                                  // Split locations and get the selected one
                                  const locations = premiseLocation.split('\n').map(l => l.trim()).filter(l => l);
                                  if (locations.length > selectedLocationIndex) {
                                    targetLocation = locations[selectedLocationIndex].replace(/^Location\s+\d+:\s*/, '').trim();
                                  } else if (locations.length > 0) {
                                    targetLocation = locations[0].replace(/^Location\s+\d+:\s*/, '').trim();
                                  }
                                } else {
                                  // Single location mode - use the first line only
                                  const firstLine = premiseLocation.split('\n')[0]?.trim() || '';
                                  targetLocation = firstLine.replace(/^Location\s+\d+:\s*/, '').trim();
                                }
                                const mapsDirectionsUrl = `https://www.google.com/maps/dir/fire+station+near+${encodeURIComponent(targetLocation)}/${encodeURIComponent(targetLocation)}`;
                                window.open(mapsDirectionsUrl, '_blank');
                                
                              } catch (error) {
                                // console.error('Error searching fire station:', error);
                                alert('Error searching for fire station. Please try again.');
                              }
                            } else if (option.text) {
                              // Add the predefined text as distance field
                              updateSlideFormData(currentSlide, {
                                fireStationDistance: option.text
                              });
                              
                              // Set font size to 32px as default for this option
                              setFontSizes(prev => ({
                                ...prev,
                                fireStationDistance: option.fontSize || 32
                              }));
                            }
                          }}
                        >
                          {option.label}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Text Alignment Controls */}
                  <div className="mt-3">
                    <label className="form-label small fw-bold">Text Alignment</label>
                    <div className="row g-1">
                      {['left', 'center', 'right'].map((alignment) => (
                        <div key={alignment} className="col-4">
                          <button
                            className={`btn btn-sm w-100 ${
                              textAlignments.fireStationName === alignment || textAlignments.fireStationDistance === alignment
                                ? 'btn-primary' : 'btn-outline-secondary'
                            }`}
                            style={{
                              fontSize: "10px",
                              padding: "4px",
                              textTransform: "capitalize"
                            }}
                            onClick={() => {
                              // Apply alignment to both fire station fields if they exist
                              const currentFormData = getSlideData(currentSlide)?.formData || {};
                              
                              setTextAlignments(prev => ({
                                ...prev,
                                ...(currentFormData.fireStationName && { fireStationName: alignment }),
                                ...(currentFormData.fireStationDistance && { fireStationDistance: alignment })
                              }));
                            }}
                          >
                            {alignment === 'left' ? '◀' : alignment === 'center' ? '▣' : '▶'}
                            <br />
                            {alignment}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="mb-3">
            <button
              className="btn btn-sm w-100"
              style={{
                backgroundColor: isDrawingMode ? '#2d5016' : 'transparent',
                borderColor: '#2d5016',
                color: isDrawingMode ? 'white' : '#2d5016'
              }}
              onClick={() => setIsDrawingMode(!isDrawingMode)}
            >
              {isDrawingMode ? 'Exit Drawing' : 'Draw Squares'}
            </button>
            {isDrawingMode && (slideData[currentSlide]?.drawings || []).length > 0 && (
              <button
                className="btn btn-outline-secondary btn-sm mt-2 w-100"
                onClick={() => {
                  setSlideData(prev => ({
                    ...prev,
                    [currentSlide]: {
                      ...prev[currentSlide],
                      drawings: []
                    }
                  }));
                }}
              >
                 Clear All
              </button>
            )}
          </div>

          {/* Arrow Button */}
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            style={{
              ...BUTTON_STYLES.toggleArrow,
              right: "-20px",
              top: "50%",
              transform: "translateY(-50%)",
              borderLeft: "none",
              zIndex: 1001,
            }}
          >
            <span style={{ fontSize: "1rem" }}>{showToolbar ? "←" : "→"}</span>
          </button>
        </div>

        {/* Main Slide Area */}
        <div 
          className="editor-body" 
          style={{ 
            flex: 1,
            marginLeft: showToolbar ? SIDEBAR_WIDTH : 0, 
            marginBottom: showSlidesBar ? SLIDES_BAR_HEIGHT : 0,
            transition: "margin-left 0.3s ease, margin-bottom 0.3s ease",
            overflow: "hidden",
            height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${showSlidesBar ? SLIDES_BAR_HEIGHT : 0}px)`
          }}
        >
          <div 
            ref={canvasRef}
            className="canvas-container"
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              position: "relative",
              cursor: isDraggingCanvas ? "grabbing" : (isDrawingMode ? "crosshair" : "grab"),
              padding: "16px"
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            <div 
              style={{ 
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel / 100})`, 
                transformOrigin: "0 0",
                transition: "none",
                position: "absolute",
                top: "16px",
                left: "16px"
              }}
            >
              {renderCurrentSlide()}
              
              {/* Drawing Capture Layer - invisible but captures mouse events in drawing mode */}
              {isDrawingMode && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "1280px",
                    height: "720px",
                    zIndex: 999,
                    cursor: "crosshair",
                    pointerEvents: "all"
                  }}
                  onMouseDown={(e) => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const clickX = (e.clientX - rect.left - canvasOffset.x) / (zoomLevel / 100);
                    const clickY = (e.clientY - rect.top - canvasOffset.y) / (zoomLevel / 100);
                    
                    // Check if clicking on an existing drawing to delete it
                    const existingDrawings = slideData[currentSlide]?.drawings || [];
                    // Click coordinates available for debugging
                    // Existing drawings data available for debugging
                    
                    const clickedDrawingIndex = existingDrawings.findIndex(drawing => 
                      isPointInRectangle(clickX, clickY, drawing)
                    );
                    
                    // Drawing click processed
                    
                    if (clickedDrawingIndex !== -1) {
                      // Select the clicked drawing for editing
                      // Selecting drawing for editing
                      setSelectedDrawingIndex(clickedDrawingIndex);
                    } else {
                      // Deselect any selected drawing and start drawing a new rectangle
                      // Starting new drawing
                      setSelectedDrawingIndex(null);
                      setIsDrawing(true);
                      setCurrentDrawing({
                        type: 'rectangle',
                        startX: clickX,
                        startY: clickY,
                        endX: clickX,
                        endY: clickY,
                        stroke: 'red',
                        strokeWidth: 5,
                        fill: 'none'
                      });
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              )}
              
              {/* Drawing Overlay */}
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1280px",
                  height: "720px",
                  pointerEvents: isDrawingMode ? "all" : "none",
                  zIndex: 1000
                }}
              >
                {/* Render saved drawings */}
                {(slideData[currentSlide]?.drawings || []).map((drawing, index) => {
                  const x = Math.min(drawing.startX, drawing.endX);
                  const y = Math.min(drawing.startY, drawing.endY);
                  const width = Math.abs(drawing.endX - drawing.startX);
                  const height = Math.abs(drawing.endY - drawing.startY);
                  const isSelected = selectedDrawingIndex === index;
                  
                  return (
                    <g key={index}>
                      {/* Main rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="none"
                        stroke={isSelected ? '#007bff' : drawing.stroke}
                        strokeWidth={isSelected ? drawing.strokeWidth + 1 : drawing.strokeWidth}
                        style={{ 
                          cursor: isDrawingMode ? 'pointer' : 'default',
                          opacity: isDrawingMode ? 0.8 : 1
                        }}
                      />
                      
                      {/* Resize handles for selected drawing */}
                      {isSelected && isDrawingMode && (
                        <>
                          {/* Corner handles */}
                          <circle cx={x} cy={y} r="4" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "nw-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'nw')} />
                          <circle cx={x + width} cy={y} r="4" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "ne-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'ne')} />
                          <circle cx={x} cy={y + height} r="4" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "sw-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'sw')} />
                          <circle cx={x + width} cy={y + height} r="4" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "se-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'se')} />
                          
                          {/* Edge handles */}
                          <circle cx={x + width/2} cy={y} r="3" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "n-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'n')} />
                          <circle cx={x + width/2} cy={y + height} r="3" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "s-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 's')} />
                          <circle cx={x} cy={y + height/2} r="3" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "w-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'w')} />
                          <circle cx={x + width} cy={y + height/2} r="3" fill="#007bff" stroke="white" strokeWidth="1" 
                            style={{cursor: "e-resize"}} 
                            onMouseDown={(e) => startResize(e, index, 'e')} />
                        </>
                      )}
                    </g>
                  );
                })}
                
                {/* Render current drawing in progress */}
                {currentDrawing && (
                  <rect
                    x={Math.min(currentDrawing.startX, currentDrawing.endX)}
                    y={Math.min(currentDrawing.startY, currentDrawing.endY)}
                    width={Math.abs(currentDrawing.endX - currentDrawing.startX)}
                    height={Math.abs(currentDrawing.endY - currentDrawing.startY)}
                    fill="none"
                    stroke={currentDrawing.stroke}
                    strokeWidth={currentDrawing.strokeWidth}
                  />
                )}
              </svg>
            </div>
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
                onClick={setCurrentSlide}
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
            sessionUser, // Add session user for field tracking
            slideData: slideSpecificData,
            updateSlideData: (updates) => updateSlideData(slide.id, updates),
            fieldPositions: slideSpecificData.fieldPositions,
            setFieldPositions: (positions) => updateFieldPositions(slide.id, positions),
            allSlideData: slideData, // Pass all slide data for cross-slide logic  
            slides: slides, // Pass slides array to check slide types
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
              {slideData.type.startsWith('street_view') && (
                <StreetView {...slideProps} />
              )}
              {slideData.type === 'cover' && (
                <SlideOne {...slideProps} />
              )}
              {slideData.type === 'aerial_view_-_google' && (
                <SlideTwo {...slideProps} />
              )}
              {slideData.type === 'aerial_view_-_bing' && (
                <SlideThree {...slideProps} />
              )}
              {slideData.type === 'interior' && (
                <Interior {...slideProps} />
              )}
              {slideData.type === 'online_presence' && (
                <OnlinePresence {...slideProps} />
              )}
              {slideData.type === 'comments' && (
                <Comments {...slideProps} />
              )}
              {slideData.type === 'fire_hazard' && (
                <FireHazard {...slideProps} />
              )}
              {slideData.type === 'crime_rate' && (
                <CrimeRate {...slideProps} />
              )}
              {slideData.type === 'nearest_fire_station' && (
                <NearestFireStation {...slideProps} />
              )}
              {slideData.type === 'website' && (
                (() => {
                  const slide1FormData = getSlideData(1)?.formData || {};
                  const websiteInfo = slide1FormData.website || '';
                  return <Website 
                    {...slideProps} 
                    websiteUrl={websiteInfo}
                  />
                })()
              )}
              {slideData.type === 'ratings' && (
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
                {(getSlideData(slide.id)?.drawings || []).map((drawing, index) => (
                  <rect
                    key={index}
                    x={Math.min(drawing.startX, drawing.endX)}
                    y={Math.min(drawing.startY, drawing.endY)}
                    width={Math.abs(drawing.endX - drawing.startX)}
                    height={Math.abs(drawing.endY - drawing.startY)}
                    fill="none"
                    stroke={drawing.stroke}
                    strokeWidth={drawing.strokeWidth}
                  />
                ))}
              </svg>
            </div>
          );
        })}
      </div>

    </div>
  );
}