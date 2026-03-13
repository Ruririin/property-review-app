import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ImageFrame = ({
  id,
  image,
  onImageUpload,
  onImageRemove,
  onImageDimensionsChange, // New callback for image dimensions
  style,
  className = ''
}) => {
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);

  // Transform state for multi-frame repositioning
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        };
        setImageDimensions(dimensions);

        // Notify parent component of new dimensions
        if (onImageDimensionsChange) {
          onImageDimensionsChange(id, dimensions);
        }

        onImageUpload(id, reader.result, file);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
          e.preventDefault();
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setImageDimensions(null);
    setImageTransform({ x: 0, y: 0, scale: 1 });
    onImageRemove(id);
  };

  // Mouse handlers for dragging image within frame (multi-frame only)
  const handleImageMouseDown = (e) => {
    const isMultiFrame = style?.width !== '1064px' || style?.height !== '504px';
    if (!isMultiFrame || !image) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
    dragStartRef.current = {
      x: e.clientX - imageTransform.x,
      y: e.clientY - imageTransform.y
    };
  };

  const handleImageMouseMove = (e) => {
    if (!isDraggingImage) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    setImageTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  // Zoom handlers
  const handleZoomIn = (e) => {
    e.stopPropagation();
    setImageTransform(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.2)
    }));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setImageTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale - 0.2)
    }));
  };

  const handleResetTransform = (e) => {
    e.stopPropagation();
    setImageTransform({ x: 0, y: 0, scale: 1 });
  };

  useEffect(() => {
    if (isDraggingImage) {
      window.addEventListener('mousemove', handleImageMouseMove);
      window.addEventListener('mouseup', handleImageMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleImageMouseMove);
        window.removeEventListener('mouseup', handleImageMouseUp);
      };
    }
  }, [isDraggingImage, imageTransform.x, imageTransform.y]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
      return () => {
        container.removeEventListener('paste', handlePaste);
      };
    }
  }, []);

  const getContainerStyle = () => {
    if (!image || !imageDimensions) {
      return style;
    }

    const isSingleFrame = style?.width === '1064px' && style?.height === '504px';

    if (isSingleFrame) {
      const maxWidth = 1064;
      const maxHeight = 504;

      let width = imageDimensions.width;
      let height = imageDimensions.height;

      // Scale down if too large
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = width * scale;
        height = height * scale;
      }

      return {
        width: `${width}px`,
        height: `${height}px`,
      };
    }

    return style;
  };

  const containerStyle = getContainerStyle();

  const isMultiFrame = style?.width !== '1064px' || style?.height !== '504px';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative transition-all ${className}`}
      style={{
        ...containerStyle,
        border: image ? '4px solid #000' : (isDragging ? '2px dashed #8B9A5B' : (isFocused ? '2px solid #8B9A5B' : '2px dashed #d1d5db')),
        backgroundColor: isDragging ? '#f5f7f0' : (image ? '#1a1a1a' : 'white'),
        outline: isFocused && !image ? '2px solid #8B9A5B' : 'none',
        outlineOffset: '2px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto', // Center horizontally in parent
        cursor: isMultiFrame && image ? 'move' : 'default',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={(e) => {
        containerRef.current?.focus();
      }}
    >
      {image ? (
        <>
          <div
            className="w-full h-full"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              ref={imageRef}
              src={image}
              alt={`Frame ${id}`}
              draggable={false}
              onMouseDown={handleImageMouseDown}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                transform: isMultiFrame ? `translate(${imageTransform.x}px, ${imageTransform.y}px) scale(${imageTransform.scale})` : 'none',
                transition: isDraggingImage ? 'none' : 'transform 0.1s ease',
                cursor: isMultiFrame ? 'move' : 'default',
              }}
            />

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="no-export bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '20px',
                height: '20px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                zIndex: 9999,
                backgroundColor: '#dc2626'
              }}
              title="Remove image"
            >
              <X size={12} strokeWidth={3} color="white" />
            </button>

            {/* Zoom controls for multi-frame layouts */}
            {isMultiFrame && (
              <div
                className="no-export"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  display: 'flex',
                  gap: '4px',
                  zIndex: 9999,
                }}
              >
                <button
                  onClick={handleZoomOut}
                  className="bg-white hover:bg-gray-100 rounded shadow-md transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                  }}
                  title="Zoom out"
                >
                  <ZoomOut size={16} color="#333" />
                </button>
                <button
                  onClick={handleResetTransform}
                  className="bg-white hover:bg-gray-100 rounded shadow-md transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                  }}
                  title="Reset position and zoom"
                >
                  <Maximize2 size={16} color="#333" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="bg-white hover:bg-gray-100 rounded shadow-md transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                  }}
                  title="Zoom in"
                >
                  <ZoomIn size={16} color="#333" />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-200">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
            isFocused
              ? 'bg-[#8B9A5B] shadow-lg scale-110'
              : 'bg-gradient-to-br from-[#8B9A5B] to-[#7a8950] shadow-md'
          }`}>
            <Upload className="w-10 h-10 text-white" strokeWidth={2} />
          </div>

          <h3 className={`text-lg font-bold text-center mb-2 transition-colors duration-200 ${
            isFocused ? 'text-[#8B9A5B]' : 'text-gray-800'
          }`}>
            {isFocused ? 'Ready to Paste!' : 'Upload Image'}
          </h3>

          <p className="text-sm text-gray-600 text-center mb-6 px-4">
            {isFocused
              ? 'Press Ctrl+V to paste'
              : 'Click here, then paste or browse files'}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-6 py-3 bg-white border-2 border-[#8B9A5B] text-[#8B9A5B] hover:bg-[#8B9A5B] hover:text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Browse Files
          </button>

          <p className="text-xs text-gray-500 mt-5">
            Supports PNG, JPG, GIF (up to 10MB)
          </p>
        </div>
      )}

      {!image && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default ImageFrame;
