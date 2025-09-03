/**
 * Demo Image Handler Hook - Safe image handling for demo mode
 * Provides placeholder images and simulated image operations
 */

import { useState, useCallback } from 'react';
import { DEMO_CONFIG, demoUtils } from '../config/demoConfig.js';

export const useDemoImageHandler = (slideData, updateSlideData, zoomLevel, isActiveSlide, slideType) => {
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get demo placeholder image
  const getPlaceholderImage = useCallback(() => {
    return demoUtils.getDemoPlaceholderImage(slideType);
  }, [slideType]);

  // Simulated image upload
  const handleImageUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    console.log('🎭 Demo: Image upload simulated - using placeholder');
    
    // Simulate upload delay
    await demoUtils.simulateDelay(800);
    
    // Use placeholder image data
    const placeholderImageData = getPlaceholderImage();
    
    const newSlideData = {
      ...slideData,
      imageData: placeholderImageData,
      imagePosition: slideData.imagePosition || { x: 100, y: 100, width: 800, height: 600 },
      hasImage: true
    };
    
    updateSlideData(newSlideData);
    
    return {
      success: true,
      message: 'Demo mode: Placeholder image added',
      imageData: placeholderImageData
    };
  }, [slideData, updateSlideData, getPlaceholderImage]);

  // Handle image positioning
  const handleImageMove = useCallback((e) => {
    if (!isDraggingImage || !slideData.hasImage) return;
    
    const newX = e.clientX / (zoomLevel / 100) - dragOffset.x;
    const newY = e.clientY / (zoomLevel / 100) - dragOffset.y;
    
    const newPosition = {
      ...slideData.imagePosition,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    };
    
    updateSlideData({
      ...slideData,
      imagePosition: newPosition
    });
  }, [isDraggingImage, slideData, updateSlideData, zoomLevel, dragOffset]);

  // Start image drag
  const handleImageMouseDown = useCallback((e) => {
    if (!isActiveSlide || !slideData.hasImage) return;
    
    e.preventDefault();
    setIsDraggingImage(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / (zoomLevel / 100),
      y: (e.clientY - rect.top) / (zoomLevel / 100)
    });
    
    console.log('🎭 Demo: Started image drag');
  }, [isActiveSlide, slideData.hasImage, zoomLevel]);

  // End image drag
  const handleImageMouseUp = useCallback(() => {
    if (isDraggingImage) {
      setIsDraggingImage(false);
      console.log('🎭 Demo: Ended image drag');
    }
  }, [isDraggingImage]);

  // Remove image (demo mode - just removes from slide data)
  const removeImage = useCallback(() => {
    if (!slideData.hasImage) return;
    
    console.log('🎭 Demo: Removing placeholder image');
    
    updateSlideData({
      ...slideData,
      imageData: null,
      imagePosition: null,
      hasImage: false
    });
  }, [slideData, updateSlideData]);

  // Add placeholder image programmatically
  const addPlaceholderImage = useCallback(async () => {
    console.log('🎭 Demo: Adding placeholder image');
    
    await demoUtils.simulateDelay(300);
    
    const placeholderImageData = getPlaceholderImage();
    
    updateSlideData({
      ...slideData,
      imageData: placeholderImageData,
      imagePosition: { x: 100, y: 100, width: 800, height: 600 },
      hasImage: true
    });
  }, [slideData, updateSlideData, getPlaceholderImage]);

  // Check if slide has image
  const hasImage = slideData?.hasImage || false;
  const imageData = slideData?.imageData || null;
  const imagePosition = slideData?.imagePosition || { x: 100, y: 100, width: 800, height: 600 };

  return {
    // State
    hasImage,
    imageData,
    imagePosition,
    isDraggingImage,
    
    // Actions
    handleImageUpload,
    handleImageMove,
    handleImageMouseDown,
    handleImageMouseUp,
    removeImage,
    addPlaceholderImage,
    
    // Utilities
    getPlaceholderImage
  };
};