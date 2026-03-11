/**
 * PDF Preview Service
 * Handles API calls for PDF preview functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generate PDF preview from slides data
 * @param {Array} slidesData - Array of slide data
 * @param {string} filename - PDF filename
 * @param {string} method - Export method ('weasyprint' or 'reportlab')
 * @returns {Promise<string>} - PDF URL for preview
 */
export const generatePDFPreview = async (slidesData, filename = 'Property Review Preview.pdf', method = 'weasyprint') => {
  try {
    const response = await fetch(`${API_BASE_URL}/preview-pdf/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        slides: slidesData,
        filename: filename,
        method: method
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Create blob URL for the PDF
    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw error;
  }
};

/**
 * Generate PDF preview for a specific project
 * @param {string} projectId - Project UUID
 * @param {string} method - Export method ('weasyprint' or 'reportlab')
 * @returns {Promise<string>} - PDF URL for preview
 */
export const generateProjectPDFPreview = async (projectId, method = 'weasyprint') => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/preview-pdf/?method=${method}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Create blob URL for the PDF
    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating project PDF preview:', error);
    throw error;
  }
};

/**
 * Cleanup PDF preview URL to free memory
 * @param {string} pdfUrl - The blob URL to cleanup
 */
export const cleanupPDFPreview = (pdfUrl) => {
  if (pdfUrl && pdfUrl.startsWith('blob:')) {
    URL.revokeObjectURL(pdfUrl);
  }
};

export default {
  generatePDFPreview,
  generateProjectPDFPreview,
  cleanupPDFPreview
};