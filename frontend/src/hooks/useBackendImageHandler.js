import { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';

/**
 * Backend-powered image handler
 * Uses Django backend for image processing and storage instead of frontend base64
 */
export const useBackendImageHandler = (
  slideData, 
  updateSlideData, 
  zoomLevel, 
  isActiveSlide, 
  slideType = 'default',
  projectId,
  slideId
) => {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState(null);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const containerRef = useRef(null);
  const imageData = slideData?.imageData || null;
  const imagePosition = slideData?.imagePosition || { top: 300, left: 400 };

  // Handle paste events for adding images - only for the active slide
  useEffect(() => {
    const handlePaste = async (e) => {
      // Only handle paste if this is the active slide and we have required IDs
      if (!isActiveSlide || !projectId || !slideId) return;
      
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          const reader = new FileReader();
          
          reader.onload = async (event) => {
            try {
              setIsUploading(true);
              
              // Upload to backend
              const response = await uploadImageToBackend(event.target.result);
              
              if (response.success) {
                // Update slide data with backend response
                updateSlideData({
                  imageData: response.image_data,
                  imagePosition: response.image_position,
                  imageMeta: {
                    file_path: response.file_path,
                    uploaded_at: new Date().toISOString()
                  }
                });
                setIsImageSelected(true);

              } else {
                console.error('❌ Backend image upload failed:', response.error);
                alert('Failed to upload image. Please try again.');
              }
            } catch (error) {
              console.error('❌ Error uploading image:', error);
              alert('Failed to upload image. Please try again.');
            } finally {
              setIsUploading(false);
            }
          };
          
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [updateSlideData, isActiveSlide, projectId, slideId]);

  /**
   * Upload image to backend
   */
  const uploadImageToBackend = async (base64Data) => {
    try {
      const response = await fetch('http://127.0.0.1:8080/api/slides/upload-image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          slide_id: slideId,
          image_data: base64Data,
          slide_type: slideType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Backend upload error:', error);
      throw error;
    }
  };

  /**
   * Delete image from backend
   */
  const deleteImageFromBackend = async (filePath) => {
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/slides/${projectId}/${slideId}/delete-image/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Backend delete error:', error);
      throw error;
    }
  };

  // Mouse down on image - start dragging
  const handleMouseDownImage = (e) => {
    e.stopPropagation();
    setIsDraggingImage(true);
    setIsImageSelected(true);
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Account for zoom level when calculating offset
    const zoomFactor = (zoomLevel || 100) / 100;
    
    setDragOffset({
      x: (e.clientX - rect.left) / zoomFactor,
      y: (e.clientY - rect.top) / zoomFactor,
    });
  };

  // Mouse move - handle dragging and resizing
  const handleMouseMove = (e) => {
    if (isDraggingImage && imageData && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating new position
      const zoomFactor = (zoomLevel || 100) / 100;
      
      const newLeft = (e.clientX - containerRect.left) / zoomFactor - dragOffset.x;
      const newTop = (e.clientY - containerRect.top) / zoomFactor - dragOffset.y;
      
      updateSlideData({
        imagePosition: {
          left: Math.max(0, newLeft),
          top: Math.max(0, newTop),
        }
      });
    }

    if (isResizingImage && resizeStart && imageData && containerRef.current) {
      // Get container bounds for proper coordinate calculation
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Account for zoom level when calculating resize delta
      const zoomFactor = (zoomLevel || 100) / 100;
      
      // Calculate mouse position relative to container
      const currentMouseX = (e.clientX - containerRect.left) / zoomFactor;
      const currentMouseY = (e.clientY - containerRect.top) / zoomFactor;
      
      // Calculate the distance from the resize start point
      const deltaX = currentMouseX - resizeStart.mouseStartX;
      const deltaY = currentMouseY - resizeStart.mouseStartY;
      
      // Use the larger of the two deltas to maintain aspect ratio
      const delta = Math.max(deltaX, deltaY);
      
      const newWidth = Math.max(50, resizeStart.startWidth + delta);
      const newHeight = newWidth / imageData.aspectRatio;
      
      updateSlideData({
        imageData: {
          ...imageData,
          width: newWidth,
          height: newHeight,
        }
      });
    }
  };

  // Mouse up - stop dragging/resizing
  const handleMouseUp = () => {
    setIsDraggingImage(false);
    setIsResizingImage(false);
    setResizeStart(null);
  };

  // Start resizing
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizingImage(true);
    setIsImageSelected(true);
    
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const zoomFactor = (zoomLevel || 100) / 100;
      
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        mouseStartX: (e.clientX - containerRect.left) / zoomFactor,
        mouseStartY: (e.clientY - containerRect.top) / zoomFactor,
        startWidth: imageData.width,
        startHeight: imageData.height,
      });
    }
  };

  // Delete image (now handles backend deletion)
  const handleDeleteImage = async (e) => {
    e.stopPropagation();
    
    try {
      // Get file path from slide data
      const filePath = slideData?.imageMeta?.file_path;
      
      if (filePath) {
        await deleteImageFromBackend(filePath);

      }
      
      // Clear frontend data
      updateSlideData({
        imageData: null,
        imagePosition: { top: 300, left: 400 },
        imageMeta: null
      });
      setIsImageSelected(false);
      
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      // Still clear frontend even if backend deletion fails
      updateSlideData({
        imageData: null,
        imagePosition: { top: 300, left: 400 },
        imageMeta: null
      });
      setIsImageSelected(false);
    }
  };

  // Handle container clicks to deselect image
  const handleContainerClick = (e, onSelect) => {
    if (e.target === containerRef.current) {
      onSelect(null);
      setIsImageSelected(false);
    }
  };

  return {
    containerRef,
    imageData,
    imagePosition,
    isDraggingImage,
    isImageSelected,
    isUploading,
    setIsImageSelected,
    handleMouseDownImage,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
    handleDeleteImage,
    handleContainerClick,
  };
};