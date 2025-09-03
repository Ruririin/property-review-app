# Django Backend APIs for Property Review Slides

## 🎯 Overview
Each slide now has its own dedicated backend module with specialized APIs. All APIs are organized by slide type for easy tracking and maintenance.

## 📁 Backend Structure
```
backend/property_review/slides/
├── __init__.py
├── urls.py                    # Master URL configuration
├── iso_service.py            # ISO code matching service
├── image_handler.py          # Image upload & processing
├── slide_one.py             # SlideOne specific features
├── slide_two.py             # SlideTwo aerial view features  
├── slide_three.py           # SlideThree aerial view features
└── street_view.py           # StreetView specific features
```

## 🔗 Available API Endpoints

### **SlideOne APIs** (`/api/slides/slide-one/`)
- `GET line-of-business-options/` - Get dropdown options
- `POST validate/` - Validate form data
- `POST match-iso-codes/` - Match ISO codes by description
- `GET load-iso-codes/` - Load all ISO codes
- `POST calculate-layout/` - Calculate dynamic field layout

### **SlideTwo APIs** (`/api/slides/slide-two/`)
- `GET view-type-options/` - Get Google Maps view options
- `POST validate/` - Validate form data
- `POST calculate-field-width/` - Calculate dynamic field width
- `GET default-positions/` - Get default field positions
- `POST maps-integration/` - Process Google Maps integration

### **SlideThree APIs** (`/api/slides/slide-three/`)
- `GET view-type-options/` - Get Google Maps view options
- `POST validate/` - Validate form data  
- `POST calculate-field-width/` - Calculate dynamic field width
- `GET default-positions/` - Get default field positions
- `POST maps-integration/` - Process Google Maps integration

### **StreetView APIs** (`/api/slides/street-view/`)
- `GET view-type-options/` - Get street view options
- `POST validate/` - Validate street address data
- `POST calculate-field-width/` - Calculate dynamic field width
- `GET default-positions/` - Get default field positions
- `POST street-view-integration/` - Process Street View integration

### **Image Handler APIs** (`/api/slides/images/`)
- `POST upload/` - Upload & process base64 images
- `POST calculate-dimensions/` - Calculate optimal image dimensions
- `POST validate-position/` - Validate image position
- `GET metadata/` - Get image metadata
- `DELETE delete/` - Delete image from storage

## 🔧 Key Features Per Slide

### **SlideOne Features**
- **ISO Code Matching**: Intelligent matching based on business description
- **Line of Business Dropdown**: Predefined insurance categories
- **Dynamic Layout**: Auto-adjusts field sizes based on content
- **Form Validation**: Validates required fields and data formats

### **SlideTwo/SlideThree Features** 
- **Google Maps Integration**: Satellite and aerial view options
- **Dynamic Field Sizing**: Text-based width calculation
- **Address Processing**: URL generation for map services
- **Position Management**: Fixed positioning system

### **StreetView Features**
- **Street-Level Views**: Optimized for street photography
- **Address Validation**: Enhanced validation for street addresses  
- **Street View Integration**: Specialized Google Street View URLs
- **Address Components**: Validates street numbers and types

### **Image Handler Features**
- **Base64 Processing**: Handles pasted/uploaded images
- **Automatic Resizing**: Optimizes images for slides
- **Position Validation**: Ensures images stay within bounds
- **Storage Management**: Secure file storage with cleanup

## 🌐 Server Status
- **Django Backend**: ✅ Running on `http://localhost:3000`
- **Database**: ✅ `property_review_django` MySQL database
- **All APIs**: ✅ Active and configured with authentication

## 📝 Usage Examples

### SlideOne ISO Code Matching
```javascript
// Match ISO codes based on business description
const response = await fetch('/api/slides/slide-one/match-iso-codes/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'auto repair shop' })
});
const { matches, best_match } = await response.json();
```

### Image Upload
```javascript
// Upload base64 image
const response = await fetch('/api/slides/images/upload/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    imageData: base64ImageData,
    maxWidth: 1200,
    maxHeight: 800
  })
});
const { url, width, height } = await response.json();
```

### Google Maps Integration
```javascript
// Process maps integration for SlideTwo
const response = await fetch('/api/slides/slide-two/maps-integration/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    premiseLocation: '123 Main St, City, State',
    viewType: 'Satellite View'
  })
});
const { map_url, encoded_address } = await response.json();
```

## 🎯 Next Steps
1. **Update React Components**: Modify frontend to use new Django APIs
2. **Replace Frontend Services**: Remove client-side logic, use backend APIs
3. **Test Integration**: Ensure all slide features work with Django backend

Your property review app now has a complete Django backend with dedicated APIs for each slide feature! 🚀