import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageFrame = ({
  id,
  image,
  onImageUpload,
  onImageRemove,
  style,
  className = ''
}) => {
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(id, reader.result, file);
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
    onImageRemove(id);
  };

  // Add paste event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
      return () => {
        container.removeEventListener('paste', handlePaste);
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative transition-all ${className}`}
      style={{
        ...style,
        border: image ? 'none' : (isDragging ? '2px dashed #8B9A5B' : (isFocused ? '2px solid #8B9A5B' : '2px dashed #d1d5db')),
        backgroundColor: isDragging ? '#f5f7f0' : (image ? 'transparent' : 'white'),
        outline: isFocused && !image ? '2px solid #8B9A5B' : 'none',
        outlineOffset: '2px',
        overflow: image ? 'visible' : 'hidden'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={(e) => {
        // Only focus the container, don't trigger file upload on click
        containerRef.current?.focus();
      }}
    >
      {image ? (
        <>
          <div
            className="w-full h-full"
            style={{
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              marginTop: '-20px',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={image}
                alt={`Frame ${id}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  border: '4px solid black'
                }}
              />
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
            </div>
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
