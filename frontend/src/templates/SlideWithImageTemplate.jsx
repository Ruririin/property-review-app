// Template for creating new slides with image functionality
// Copy this file and customize it for your specific slide needs

import { useImageHandler } from "../hooks/useImageHandler";
import ImageComponent from "../components/ImageComponent";

export default function SlideWithImageTemplate({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  slideId,
  slideData,
  updateSlideData,
}) {
  // STEP 1: Add image functionality with just this one line
  const imageHandler = useImageHandler(slideData, updateSlideData);

  // Your custom field rendering logic here
  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    
    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) => setFormData({ [field]: e.target.value })}
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          // Your custom field styles
          position: "absolute",
          // ... other styles
        }}
      />
    );
  };

  return (
    <div
      // STEP 2: Use the imageHandler's containerRef
      ref={imageHandler.containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        backgroundImage: "url('/Template/Your-Template.png')", // Change this
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      // STEP 3: Add these three event handlers for image functionality
      onMouseMove={imageHandler.handleMouseMove}
      onMouseUp={imageHandler.handleMouseUp}
      onClick={(e) => imageHandler.handleContainerClick(e, onSelect)}
    >
      
      {/* Your custom form fields */}
      {renderField("customField1", "Custom placeholder 1")}
      {renderField("customField2", "Custom placeholder 2")}
      
      {/* STEP 4: Add the ImageComponent for image functionality */}
      <ImageComponent
        imageData={imageHandler.imageData}
        imagePosition={imageHandler.imagePosition}
        isImageSelected={imageHandler.isImageSelected}
        isDraggingImage={imageHandler.isDraggingImage}
        onMouseDownImage={imageHandler.handleMouseDownImage}
        onResizeMouseDown={imageHandler.handleResizeMouseDown}
        onDeleteImage={imageHandler.handleDeleteImage}
      />
    </div>
  );
}

/* 
USAGE INSTRUCTIONS:

1. Copy this template file
2. Rename it to your slide name (e.g., SlideFour.jsx)
3. Change the background image URL
4. Customize your form fields in renderField()
5. Make sure your slide component receives these props:
   - slideId, slideData, updateSlideData (for image functionality)
   - Standard props: formData, setFormData, onSelect, etc.
   
6. In Editor.jsx, add your slide to the switch statement:
   case 'your_slide_type':
     return (
       <YourSlideComponent
         formData={slideSpecificData.formData}
         setFormData={(updates) => updateSlideFormData(currentSlide, updates)}
         onSelect={setSelectedField}
         selectedField={selectedField}
         fontSizes={fontSizes}
         showWebsite={showWebsite}
         slideId={currentSlide}
         slideData={slideSpecificData}
         updateSlideData={(updates) => updateSlideData(currentSlide, updates)}
       />
     );

That's it! Your slide now has full image functionality:
- Add images through screenshots or uploads
- Drag images around
- Resize images
- Delete images
- Each slide instance maintains its own separate images
*/