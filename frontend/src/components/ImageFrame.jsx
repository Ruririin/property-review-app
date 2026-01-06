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
      className={`relative overflow-hidden transition-all ${className}`}
      style={{
        ...style,
        border: image ? 'none' : (isDragging ? '2px dashed #8B9A5B' : '2px dashed #d1d5db'),
        backgroundColor: isDragging ? '#f5f7f0' : (image ? 'transparent' : 'white')
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !image && fileInputRef.current?.click()}
    >
      {image ? (
        <>
          <div
            className="w-full h-full"
            style={{
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={image}
              alt={`Frame ${id}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                border: '4px solid black'
              }}
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-[#8B9A5B] hover:bg-[#7a8950] text-white p-2 rounded-full shadow-lg transition-colors z-10"
            title="Remove image"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#fafbf8] transition-colors">
          <Upload className="w-12 h-12 text-[#8B9A5B] mb-3 opacity-60" />
          <p className="text-sm text-[#6b7a4b] text-center px-4 font-medium">
            Click, drag, or paste (Ctrl+V) image here
          </p>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, GIF up to 10MB
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
