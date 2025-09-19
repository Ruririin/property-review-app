const ImageComponent = ({
  imageData,
  imagePosition,
  isImageSelected,
  isDraggingImage,
  onMouseDownImage,
  onResizeMouseDown,
  onDeleteImage,
}) => {
  // Touch event handlers for tablet compatibility
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => e.stopPropagation()
      };
      onMouseDownImage(syntheticEvent);
    }
    // Only prevent default if the event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
  };
  
  const handleResizeTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => e.stopPropagation()
      };
      onResizeMouseDown(syntheticEvent);
    }
    // Only prevent default if the event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  if (!imageData) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: imagePosition.top,
        left: imagePosition.left,
        zIndex: 10,
      }}
    >
      <img
        src={imageData.src}
        alt="Pasted"
        onMouseDown={onMouseDownImage}
        onTouchStart={handleTouchStart}
        style={{
          width: imageData.width,
          height: imageData.height,
          objectFit: "contain",
          border: isImageSelected ? "5px solid #000" : "5px solid #000",
          borderRadius: "6px",
          cursor: isDraggingImage ? "grabbing" : "grab",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          userSelect: "none",
        }}
      />
      {isImageSelected && (
        <>
          {/* Corner resize handles for better control */}
          <div
            onMouseDown={onResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{
              position: "absolute",
              bottom: "-6px",
              right: "-6px",
              width: "12px",
              height: "12px",
              background: "#007bff",
              border: "2px solid #fff",
              borderRadius: "2px",
              cursor: "nwse-resize",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              zIndex: 20,
            }}
          />
          
          {/* Additional resize handles for better UX */}
          <div
            onMouseDown={onResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "12px",
              height: "8px",
              background: "#007bff",
              border: "2px solid #fff",
              borderRadius: "2px",
              cursor: "ns-resize",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              zIndex: 20,
            }}
          />
          
          <div
            onMouseDown={onResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{
              position: "absolute",
              right: "-6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "12px",
              background: "#007bff",
              border: "2px solid #fff",
              borderRadius: "2px",
              cursor: "ew-resize",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              zIndex: 20,
            }}
          />

          {/* Delete Handle */}
          <div
            onClick={onDeleteImage}
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              background: "#ff4d4d",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              zIndex: 20,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#ff3333"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#ff4d4d"}
          >
            ×
          </div>
        </>
      )}
    </div>
  );
};

export default ImageComponent;