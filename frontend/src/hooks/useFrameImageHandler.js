import { useState, useCallback } from 'react';

/**
 * Frame Image Handler Hook
 * Handles uploading, storing, and deleting frame images to/from backend
 */
export const useFrameImageHandler = (projectId, slideId) => {
  const [uploadingFrames, setUploadingFrames] = useState({});
  const [errors, setErrors] = useState({});

  /**
   * Upload a single frame image to backend
   */
  const uploadFrameImage = useCallback(async (frameId, base64Data) => {
    if (!projectId || !slideId) {
      console.error('Project ID and Slide ID required for upload');
      return null;
    }

    setUploadingFrames(prev => ({ ...prev, [frameId]: true }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[frameId];
      return newErrors;
    });

    try {
      const response = await fetch('http://127.0.0.1:8080/api/slides/upload-frame-image/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          slide_id: slideId,
          frame_id: frameId,
          image_data: base64Data
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`Frame ${frameId} uploaded successfully:`, result);

      return {
        success: true,
        frameId,
        filePath: result.file_path,
        url: result.url,
        width: result.width,
        height: result.height,
        aspectRatio: result.aspect_ratio
      };

    } catch (error) {
      console.error(`Error uploading frame ${frameId}:`, error);
      setErrors(prev => ({ ...prev, [frameId]: error.message }));
      return {
        success: false,
        frameId,
        error: error.message
      };
    } finally {
      setUploadingFrames(prev => {
        const newUploading = { ...prev };
        delete newUploading[frameId];
        return newUploading;
      });
    }
  }, [projectId, slideId]);

  /**
   * Delete a frame image from backend
   */
  const deleteFrameImage = useCallback(async (frameId, filePath) => {
    if (!projectId || !slideId || !filePath) {
      console.error('Project ID, Slide ID, and file path required for deletion');
      return false;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8080/api/slides/${projectId}/${slideId}/delete-frame-image/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame_id: frameId,
          file_path: filePath
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`Frame ${frameId} deleted successfully`);
      return true;

    } catch (error) {
      console.error(`Error deleting frame ${frameId}:`, error);
      return false;
    }
  }, [projectId, slideId]);

  /**
   * Upload multiple frame images in parallel
   */
  const uploadMultipleFrames = useCallback(async (frameImagesMap) => {
    const uploadPromises = Object.entries(frameImagesMap).map(([frameId, base64Data]) =>
      uploadFrameImage(frameId, base64Data)
    );

    const results = await Promise.all(uploadPromises);

    // Return a map of frameId -> result
    return results.reduce((acc, result) => {
      if (result) {
        acc[result.frameId] = result;
      }
      return acc;
    }, {});
  }, [uploadFrameImage]);

  /**
   * Check if any frame is currently uploading
   */
  const isAnyFrameUploading = Object.keys(uploadingFrames).length > 0;

  return {
    uploadFrameImage,
    deleteFrameImage,
    uploadMultipleFrames,
    uploadingFrames,
    errors,
    isAnyFrameUploading
  };
};
