const SlidePreview = ({
  slide,
  index,
  isActive,
  onClick,
  onDelete,
  canDelete,
  multipleLocationsMode,
  slideLocationIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver
}) => (
  <div
    className={`position-relative cursor-pointer border ${isActive ? "border-primary border-2" : "border-light"}`}
    onClick={() => onClick(slide.id)}
    draggable="true"
    onDragStart={(e) => onDragStart && onDragStart(e, index, slide)}
    onDragEnd={(e) => onDragEnd && onDragEnd(e)}
    onDragOver={(e) => onDragOver && onDragOver(e, index)}
    onDrop={(e) => onDrop && onDrop(e, index)}
    style={{
      width: "130px", // Fixed width instead of minWidth
      height: "80px", // Fixed height
      cursor: isDragging ? "grabbing" : "grab",
      borderRadius: "8px",
      background: isActive ? "#f8f9ff" : isDragOver ? "#e3f2fd" : "#f8f9fa",
      margin: "10px 8px 10px 8px",
      flexShrink: 0, // Crucial for horizontal scrolling
      boxShadow: isActive ? "0 2px 8px rgba(0,123,255,0.3)" : isDragging ? "0 4px 12px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
      opacity: isDragging ? 0.7 : 1,
      transform: isDragging ? "rotate(5deg)" : "none"
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

export default SlidePreview;