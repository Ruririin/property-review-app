import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import FrameLayout from "../../components/FrameLayout";
import { useFrameImageHandler } from "../../hooks/useFrameImageHandler";
import slideApiService from "../../services/slideApiService";

const SlideThree = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  slideId,
  slideData,
  updateSlideData,
  zoomLevel,
  isActiveSlide,
  allSlideData, // Need this to check other slides
  slides, // Need this to check slide types
  projectId,
  currentProjectId,
}, ref) => {
  const containerRef = useRef(null);
  const slideDataRef = useRef(slideData);

  const activeProjectId = projectId || currentProjectId;

  const { uploadFrameImage, deleteFrameImage } = useFrameImageHandler(
    activeProjectId,
    slideId
  );

  const frameImages = slideData?.frameImages || {};
  const frameMeta = slideData?.frameMeta || {};
  const imageTransforms = slideData?.imageTransforms || {};

  useEffect(() => {
    slideDataRef.current = slideData;
  }, [slideData]);

  const handleImageUpload = async (frameId, imageData, file) => {
    // IMPORTANT: Use ref to get the LATEST slideData (not stale closure)
    const currentFrameImages = slideDataRef.current?.frameImages || {};
    const currentFrameMeta = slideDataRef.current?.frameMeta || {};

    const updatedFrameImages = { ...currentFrameImages, [frameId]: imageData };

    updateSlideData({
      frameImages: updatedFrameImages
    });

    const hasDatabaseId = slideData?._appState?.databaseId || false;

    if (activeProjectId && hasDatabaseId) {
      const result = await uploadFrameImage(frameId, imageData);
      if (result && result.success) {
        updateSlideData({
          frameImages: updatedFrameImages,
          frameMeta: {
            ...currentFrameMeta,
            [frameId]: {
              filePath: result.filePath,
              url: result.url,
              width: result.width,
              height: result.height,
              aspectRatio: result.aspectRatio
            }
          }
        });
      }
    }
  };

  const handleImageRemove = async (frameId) => {
    const filePath = frameMeta[frameId]?.filePath;
    if (filePath && activeProjectId) {
      await deleteFrameImage(frameId, filePath);
    }

    const newFrameImages = { ...frameImages };
    const newFrameMeta = { ...frameMeta };
    delete newFrameImages[frameId];
    delete newFrameMeta[frameId];

    updateSlideData({
      frameImages: newFrameImages,
      frameMeta: newFrameMeta
    });
  };

  const handleImageTransform = (frameId, transform) => {
    const currentTransforms = slideDataRef.current?.imageTransforms || {};
    updateSlideData({
      imageTransforms: {
        ...currentTransforms,
        [frameId]: transform
      }
    });
  };
  const currentViewType = formData.websiteInfo || "Satellite View";
  
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [allSlideData]);
  
  const otherAerialSlidesWithImages = slides.filter(slide => {
    if (slide.id === slideId) return false;
    const isAerialSlide = slide.type === 'aerial_view_-_google' || slide.type === 'aerial_view_-_bing';
    const hasImage = allSlideData[slide.id]?.imageData;
    return isAerialSlide && hasImage;
  });
  
  const isSecondAerialSlide = otherAerialSlidesWithImages.length > 0;
  

  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      // No positioning sync needed (fixed positions)
    }
  }));

  useEffect(() => {
    const loadSlideData = async () => {
      if (!currentProjectId || !slideId) {
        return;
      }

      try {
        const result = await slideApiService.getSlideContent(currentProjectId, slideId);

        if (result.content && result.content.slideThreeData && setFormData) {
          const slideThreeData = result.content.slideThreeData;

          const hasFormData = Object.keys(slideThreeData).some(key =>
            slideThreeData[key] && slideThreeData[key].toString().trim() !== ''
          );

          if (hasFormData) {
            setFormData(prev => ({
              ...prev,
              ...slideThreeData
            }));
          }
        }
      } catch (error) {
        // Silently handle errors for draft projects
      }
    };

    loadSlideData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId, currentProjectId]);

  // Note: Auto-save removed - Editor.jsx handles centralized saving via projectSaveService

  const renderField = (field, placeholder) => {
    const isActive = selectedField === field;
    const defaultPosition = {
      websiteInfo: { bottom: 5.6, right: 0.5 }, // Moved up by 0.5% and left by 1.5%
      premiseLocation: { top: 670, right: 1.2 }, // Fixed: positioned from top instead of bottom
    };

    const textContent = formData[field] || placeholder;
    const estimatedWidth = Math.max(300, Math.min(900, textContent.length * 16 + 120)); // Increased calculation and max width

    return (
      <textarea
        key={field}
        value={formData[field] || ""}
        onChange={(e) =>
          setFormData({ ...formData, [field]: e.target.value })
        }
        onFocus={() => onSelect(field)}
        placeholder={placeholder}
        style={{
          position: "absolute",
          width: `${estimatedWidth}px`, // Dynamic width based on content
          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
          border: isActive
            ? "2px solid rgba(0,0,0,0.3)"
            : "2px solid transparent",
          borderRadius: "4px",
          fontSize: "28px",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "right",
          resize: "none",
          color: "#8B9A5B",
          padding: "4px 0px 4px 8px",
          outline: "none",
          whiteSpace: "nowrap",
          ...(defaultPosition[field].bottom !== undefined 
            ? { bottom: `${defaultPosition[field].bottom}px` }
            : { top: `${defaultPosition[field].top}px` }),
          right: `${defaultPosition[field].right}%`,
        }}
      />
    );
  };

  const renderBingMapsField = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isActive = selectedField === "websiteInfo";
    const defaultPosition = {
      websiteInfo: { bottom: 40, right: 1.2 }, // Positioned properly above location
    };

    const options = [
      { value: "Bird's Eye View", label: "www.bing.com - Bird's Eye View" },
      { value: "Satellite View", label: "www.bing.com - Satellite View" }
    ];

    const handleOptionClick = (value) => {
      setFormData({ websiteInfo: value });
      setIsDropdownOpen(false);
    };
    
    return (
      <div style={{ 
        position: "absolute",
        bottom: `${defaultPosition.websiteInfo.bottom}px`,
        right: `${defaultPosition.websiteInfo.right}%`,
      }}>
        {/* Main display field */}
        <div
          onClick={(e) => {
            e.stopPropagation(); // Prevent container click handler
            setIsDropdownOpen(!isDropdownOpen);
            onSelect("websiteInfo");
          }}
          style={{
            position: "relative",
            width: "600px",
            height: "44px",
            backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
            border: isActive ? "2px solid rgba(0,0,0,0.3)" : "2px solid transparent",
            borderRadius: "4px",
            fontSize: "28px",
            fontFamily: "'Montserrat', sans-serif",
            textAlign: "right",
            color: "#8B9A5B",
            padding: "4px 0px 4px 40px",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: "44px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "visible",
          }}
        >
          {options.find(opt => opt.value === currentViewType)?.label || "www.(source).com/(source) – (mm/yyyy)"}
        </div>

        {/* Custom dropdown */}
        {isDropdownOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "44px",
              left: "0",
              width: "600px",
              background: "#fff",
              border: "2px solid rgba(0,0,0,0.3)",
              borderRadius: "4px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              zIndex: 9999,
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent container click handler
                  handleOptionClick(option.value);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: "16px",
                  fontFamily: "'Montserrat', sans-serif",
                  color: "#8B9A5B",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid #eee",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div
      ref={containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        backgroundImage: "url('/Template/Template-03.png')",
        backgroundSize: "100% 100%",
        margin: "0 auto",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onSelect(null);
        }
      }}
    >
      {renderBingMapsField()}
      {renderField("premiseLocation", "www.(source).com/maps(mm/yyyy)")}
      
      {/* Image frame - 1 frame layout only for aerial views */}
      <div
        style={{
          position: "absolute",
          top: "108px",
          left: "108px",
          width: "1064px",
          height: "504px",
        }}
      >
        <FrameLayout
          layoutType={1}
          images={frameImages}
          imageTransforms={imageTransforms}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          onImageTransform={handleImageTransform}
        />
      </div>
    </div>
  );
});

SlideThree.displayName = 'SlideThree';
export default SlideThree;