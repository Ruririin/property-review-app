/**
 * Demo Configuration
 * Controls demo mode functionality and data sanitization
 */

export const DEMO_CONFIG = {
  // Enable/disable demo mode
  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true' || false,
  
  // API Configuration for demo mode
  API: {
    DISABLE_EXTERNAL_CALLS: true,
    USE_MOCK_DATA: true,
    SIMULATE_DELAYS: true, // Add realistic delays to mock calls
  },
  
  // Data sanitization settings
  DATA: {
    MASK_SENSITIVE_INFO: true,
    USE_SAMPLE_ADDRESSES: true,
    USE_SAMPLE_NAMES: true,
    DISABLE_REAL_UPLOADS: true,
  },
  
  // Storage settings for demo
  STORAGE: {
    USE_MEMORY_ONLY: true, // Don't persist to localStorage/database
    CLEAR_ON_REFRESH: true,
  },
  
  // UI indicators
  UI: {
    SHOW_DEMO_BANNER: true,
    WATERMARK_PAGES: true,
    DEMO_USER_PREFIX: 'Demo_',
  }
};

// Demo sample data
export const DEMO_DATA = {
  SAMPLE_PROPERTIES: [
    {
      insuredName: "ABC Manufacturing Corp",
      premiseLocation: "123 Industrial Blvd, Demo City, DC 12345",
      description: "Manufacturing facility with office space",
      website: "www.demo-company.example",
      lineBusiness: "Commercial Property - All risk",
      isoClass: "3681 - Manufacturing - Light Industrial"
    },
    {
      insuredName: "XYZ Restaurant Group", 
      premiseLocation: "456 Main Street, Sample Town, ST 67890",
      description: "Quick service restaurant chain location",
      website: "www.sample-restaurant.example",
      lineBusiness: "General Liability",
      isoClass: "9079 - Restaurant - Fast Food"
    },
    {
      insuredName: "Demo Office Solutions",
      premiseLocation: "789 Business Park Dr, Test City, TC 13579", 
      description: "Professional office building",
      website: "www.demo-office.example",
      lineBusiness: "Commercial Property - Special Multi Peril",
      isoClass: "8810 - Clerical Office Occupancy"
    }
  ],

  // Complete slide templates for full demo workflow
  SLIDE_TEMPLATES: [
    { id: 1, title: "Property Information", type: "property_info" },
    { id: 2, title: "Aerial View - Google", type: "aerial_view_-_google" },
    { id: 3, title: "Aerial View - Bing", type: "aerial_view_-_bing" },
    { id: 4, title: "Street View", type: "street_view" },
    { id: 5, title: "Interior", type: "interior" },
    { id: 6, title: "Website", type: "website" },
    { id: 7, title: "Online Presence", type: "online_presence" },
    { id: 8, title: "Ratings", type: "ratings" },
    { id: 9, title: "Crime Rate", type: "crime_rate" },
    { id: 10, title: "Fire Hazard", type: "fire_hazard" },
    { id: 11, title: "Nearest Fire Station", type: "nearest_fire_station" },
    { id: 12, title: "Comments", type: "comments" }
  ],

  // Sample slide data for each type
  SAMPLE_SLIDE_DATA: {
    // Property info slide
    1: {
      formData: null, // Will be populated from property data
      fieldPositions: {},
      drawings: []
    },
    // Aerial views
    2: {
      formData: { websiteInfo: "Satellite View - Google Maps" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    3: {
      formData: { websiteInfo: "Satellite View - Bing Maps" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Street view
    4: {
      formData: { websiteInfo: "Street View - Front Entrance" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Interior
    5: {
      formData: { websiteInfo: "Interior View - Main Operations Area" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Website
    6: {
      formData: { websiteInfo: "" }, // Will be populated from property website
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Online presence
    7: {
      formData: { websiteInfo: "Social Media & Online Reviews" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Ratings
    8: {
      formData: { websiteInfo: "Customer Reviews & Ratings" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Crime rate
    9: {
      formData: { websiteInfo: "Crime Statistics - Local Area" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Fire hazard
    10: {
      formData: { websiteInfo: "Fire Risk Assessment" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Nearest fire station
    11: {
      formData: { websiteInfo: "Nearest Fire Station - Response Time Analysis" },
      fieldPositions: {},
      drawings: [],
      imageData: null,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 }
    },
    // Comments
    12: {
      formData: { 
        websiteInfo: "Property Assessment Summary",
        comments: "This is a demo property assessment. All data shown is sample information for demonstration purposes only."
      },
      fieldPositions: {},
      drawings: []
    }
  },
  
  SAMPLE_USERS: [
    'Demo_Agent_Smith',
    'Demo_Underwriter_Jones', 
    'Demo_Inspector_Brown',
    'Demo_Manager_Davis'
  ],
  
  SAMPLE_ISO_CODES: [
    {
      code: "3681",
      description: "Manufacturing - Light Industrial",
      full_text: "3681 - Manufacturing - Light Industrial"
    },
    {
      code: "9079", 
      description: "Restaurant - Fast Food",
      full_text: "9079 - Restaurant - Fast Food"
    },
    {
      code: "8810",
      description: "Clerical Office Occupancy", 
      full_text: "8810 - Clerical Office Occupancy"
    },
    {
      code: "5022",
      description: "Retail Store - General Merchandise",
      full_text: "5022 - Retail Store - General Merchandise"
    }
  ]
};

// Demo mode utilities
export const demoUtils = {
  // Check if demo mode is active
  isDemoMode: () => DEMO_CONFIG.DEMO_MODE,
  
  // Get random sample property
  getRandomProperty: () => {
    const properties = DEMO_DATA.SAMPLE_PROPERTIES;
    return properties[Math.floor(Math.random() * properties.length)];
  },
  
  // Get random demo user
  getRandomDemoUser: () => {
    const users = DEMO_DATA.SAMPLE_USERS;
    return users[Math.floor(Math.random() * users.length)];
  },
  
  // Sanitize real data for demo
  sanitizePropertyData: (data) => {
    if (!DEMO_CONFIG.DATA.MASK_SENSITIVE_INFO) return data;
    
    const sampleProperty = demoUtils.getRandomProperty();
    return {
      ...data,
      insuredName: sampleProperty.insuredName,
      premiseLocation: sampleProperty.premiseLocation,
      website: sampleProperty.website,
      // Keep user-entered descriptions but use sample data for sensitive fields
    };
  },
  
  // Create demo project ID
  createDemoProjectId: () => {
    return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Add demo watermark to exported PDFs
  addDemoWatermark: () => {
    return DEMO_CONFIG.UI.WATERMARK_PAGES;
  },
  
  // Simulate API delay for realistic demo experience
  simulateDelay: (ms = 500) => {
    if (!DEMO_CONFIG.API.SIMULATE_DELAYS) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Create complete demo project with all slides
  createCompleteDemo: (propertyIndex = 0) => {
    const property = DEMO_DATA.SAMPLE_PROPERTIES[propertyIndex] || DEMO_DATA.SAMPLE_PROPERTIES[0];
    const projectId = demoUtils.createDemoProjectId();
    
    // Prepare slide data with property-specific information
    const slideData = {};
    DEMO_DATA.SLIDE_TEMPLATES.forEach(slide => {
      slideData[slide.id] = {
        ...DEMO_DATA.SAMPLE_SLIDE_DATA[slide.id],
        formData: {
          ...DEMO_DATA.SAMPLE_SLIDE_DATA[slide.id]?.formData,
          // Add property info to first slide
          ...(slide.id === 1 ? property : {}),
          // Add website info to website slide
          ...(slide.id === 6 ? { websiteInfo: property.website } : {}),
          // Add premise location to slides that need it
          premiseLocation: property.premiseLocation
        }
      };
    });

    const demoProject = {
      id: projectId,
      title: property.insuredName,
      insuredName: property.insuredName,
      premiseLocation: property.premiseLocation,
      description: property.description,
      website: property.website,
      sessionUser: demoUtils.getRandomDemoUser(),
      slides: DEMO_DATA.SLIDE_TEMPLATES,
      slideData: slideData,
      formData: property,
      fieldPositions: {},
      fontSizes: {
        insuredName: 30,
        premiseLocation: 24,
        description: 20,
        website: 18,
        lineBusiness: 24,
        isoClass: 20
      },
      showWebsite: true,
      multipleLocationsMode: false,
      selectedLocationIndex: 0,
      status: 'editing',
      currentSlide: 1,
      totalSlides: DEMO_DATA.SLIDE_TEMPLATES.length,
      exportCount: 0,
      lastExportTime: null,
      originalLroFormId: null,
      completedBy: null,
      completedAt: null,
      lastModified: Date.now(),
      created: Date.now()
    };

    return demoProject;
  },

  // Get demo placeholder image for slides
  getDemoPlaceholderImage: (slideType) => {
    const placeholders = {
      'aerial_view_-_google': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOGZmIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gLSBHb29nbGUgQWVyaWFsIFZpZXc8L3RleHQ+Cjwvc3ZnPg==',
      'aerial_view_-_bing': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmZmYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gLSBCaW5nIEFlcmlhbCBWaWV3PC90ZXh0Pgo8L3N2Zz4=',
      'street_view': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmMGY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gLSBTdHJlZXQgVmlldzwvdGV4dD4KPC9zdmc+',
      'interior': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmOGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gLSBJbnRlcmlvciBWaWV3PC90ZXh0Pgo8L3N2Zz4=',
      'website': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmZmY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gLSBXZWJzaXRlPC90ZXh0Pgo8L3N2Zz4=',
      'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gUGxhY2Vob2xkZXIgSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='
    };
    
    return placeholders[slideType] || placeholders.default;
  }
};

export default DEMO_CONFIG;