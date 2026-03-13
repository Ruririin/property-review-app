import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Extract location from Google Maps iframe URL
 */
const extractLocationFromMapUrl = (url) => {
  if (!url) return null;
  
  try {
    const match = url.match(/[?&]q=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    
    // Try alternative patterns
    const centerMatch = url.match(/[?&]center=([^&]+)/);
    if (centerMatch) {
      return decodeURIComponent(centerMatch[1]);
    }
    
    return null;
  } catch (e) {
    console.warn('Failed to extract location from URL:', e);
    return null;
  }
};

/**
 * Create a fallback placeholder for maps
 */
const createMapPlaceholder = (clonedDoc, iframe) => {
  const div = clonedDoc.createElement('div');
  
  // Copy iframe styling
  div.style.cssText = iframe.style.cssText;
  div.style.border = '1px solid #ddd';
  div.style.borderRadius = '12px';
  div.style.backgroundColor = '#f8f9fa';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.flexDirection = 'column';
  div.style.fontFamily = "'Montserrat', sans-serif";
  div.style.fontSize = '16px';
  div.style.color = '#666';
  div.style.textAlign = 'center';
  div.style.padding = '20px';
  
  const iconDiv = clonedDoc.createElement('div');
  iconDiv.style.fontSize = '48px';
  iconDiv.style.marginBottom = '10px';
  iconDiv.textContent = '🗺️';
  
  const textDiv = clonedDoc.createElement('div');
  textDiv.style.fontSize = '14px';
  textDiv.textContent = 'Map Location';
  
  div.appendChild(iconDiv);
  div.appendChild(textDiv);
  
  if (iframe.parentNode) {
    iframe.parentNode.replaceChild(div, iframe);
  }
};

/**
 * Export slides to PDF - captures exactly what user sees on screen
 */
/**
 * Export slides to PDF using backend service
 */
export const exportToPDFBackend = async (allSlideData, slides, filename = 'Property Review.pdf') => {
  try {
    console.log('Starting backend PDF export...');
    
    if (!slides || slides.length === 0) {
      throw new Error('No slides provided for export');
    }

    // Prepare slide data for backend
    const slidesData = slides.map((slideElement, index) => {
      const slideId = slideElement.getAttribute('data-slide-id') || `slide_${index}`;
      const slideData = allSlideData[slideId] || {};
      const formData = slideData.formData || {};
      
      // Determine slide type based on background image
      let slideType = 'default';
      const bgImage = slideElement.style.backgroundImage || '';
      if (bgImage.includes('Template-04.png')) {
        slideType = 'street_view';
      } else if (bgImage.includes('interior.png')) {
        slideType = 'interior';
      } else if (bgImage.includes('Template-02.png')) {
        slideType = 'aerial';
      }
      
      return {
        id: slideId,
        type: slideType,
        formData: formData,
        imageData: slideData.imageData,
        imagePosition: slideData.imagePosition,
        title: `Slide ${index + 1}`
      };
    });

    // Send to backend
    const response = await fetch('/api/property_review/export-frontend-slides/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slides: slidesData,
        filename: filename
      })
    });

    if (!response.ok) {
      throw new Error(`Backend PDF export failed: ${response.status}`);
    }

    // Download the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log(`Backend PDF export completed: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('Backend PDF export failed:', error);
    throw error;
  }
};

export const exportToPDF = async (slides, filename = 'Property Review.pdf') => {
  try {
    console.log(`Starting PDF export with ${slides.length} slides`);
    
    if (!slides || slides.length === 0) {
      throw new Error('No slides provided for export');
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });
    
    for (let i = 0; i < slides.length; i++) {
      const slideElement = slides[i];
      
      if (!slideElement) {
        console.warn(`Slide ${i + 1} element not found, skipping`);
        continue;
      }

      console.log(`Processing slide ${i + 1}/${slides.length}`);

      // Make sure the element is visible for capture
      const originalStyle = slideElement.style.cssText;
      slideElement.style.position = 'fixed';
      slideElement.style.left = '0px';
      slideElement.style.top = '0px';
      slideElement.style.visibility = 'visible';
      slideElement.style.opacity = '1';
      slideElement.style.zIndex = '99999';

      // No direct DOM manipulation - let html2canvas capture as-is

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to capture iframe content using Screen Capture API (if available)
      let screenCapture = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          console.log('Attempting to use Screen Capture API for iframe content');
          // Note: This would require user interaction, so we'll skip for now
          // screenCapture = await navigator.mediaDevices.getDisplayMedia({
          //   video: { mediaSource: 'screen' }
          // });
        }
      } catch (e) {
        console.log('Screen Capture API not available or user denied');
      }

      // Configure html2canvas for high quality capture
      const canvas = await html2canvas(slideElement, {
        width: 1280,
        height: 720,
        scale: 0.8, // Reduced from 1 to 0.8 for faster processing
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false, // Disable excessive logging
        foreignObjectRendering: false, // Disable for better iframe handling
        onclone: (clonedDoc) => {
          try {
            console.log('Converting slide to static for PDF...');
            
            const textareas = clonedDoc.querySelectorAll('textarea');
            textareas.forEach(textarea => {
              try {
                const div = clonedDoc.createElement('div');
                div.textContent = textarea.value || textarea.placeholder || '';
                
                const fieldName = textarea.getAttribute('data-field') || 
                                textarea.dataset?.field ||
                                textarea.getAttribute('placeholder')?.replace(/\s+/g, '_').toLowerCase();
                
                const originalTextarea = slideElement.querySelector(`textarea[data-field="${fieldName}"]`) ||
                                       slideElement.querySelector(`textarea[value="${textarea.value}"]`) ||
                                       slideElement.querySelector(`textarea[placeholder="${textarea.placeholder}"]`);
                
                const isCommentsSlide = slideElement.style.backgroundImage.includes('Template-06.png');
                
                // Copy all computed styles to maintain exact appearance
                const computedStyle = getComputedStyle(textarea);
                div.style.cssText = textarea.style.cssText;
                
                const savedWidth = textarea.getAttribute('data-current-width');
                const savedHeight = textarea.getAttribute('data-current-height');
                
                if (savedWidth && savedHeight) {
                  div.style.width = `${savedWidth}px`;
                  div.style.height = `${savedHeight}px`;
                  console.log(`📐 Using saved dimensions for PDF: ${savedWidth}x${savedHeight} for text: "${div.textContent.substring(0, 50)}..."`);
                } else if (originalTextarea) {
                  // Fallback to current computed dimensions
                  const rect = originalTextarea.getBoundingClientRect();
                  div.style.width = `${rect.width}px`;
                  div.style.height = `${rect.height}px`;
                  console.log(`📐 Using computed dimensions for PDF: ${rect.width}x${rect.height} for text: "${div.textContent.substring(0, 50)}..."`);
                } else if (isCommentsSlide) {
                  // Last fallback for Comments slides only
                  div.style.width = '400px';
                  div.style.minHeight = '60px';
                  div.style.height = 'auto';
                }
                
                // Common styling for all slides
                div.style.whiteSpace = 'pre-wrap';
                div.style.wordWrap = 'break-word';
                div.style.overflow = 'hidden';
                div.style.textOverflow = 'clip';
                div.style.display = 'block';
                div.style.boxSizing = 'border-box';
                
                // Ensure static styling
                div.style.border = 'none';
                div.style.background = 'transparent';
                div.style.outline = 'none';
                div.style.resize = 'none';
                div.style.cursor = 'default';
                
                // Copy positioning from textarea or its parent container
                const parentElement = textarea.parentNode;
                const hasParentPosition = parentElement && 
                  getComputedStyle(parentElement).position === 'absolute';
                
                if (hasParentPosition) {
                  const parentStyles = getComputedStyle(parentElement);
                  div.style.position = parentStyles.position;
                  div.style.top = parentStyles.top;
                  div.style.left = parentStyles.left;
                  div.style.right = parentStyles.right;
                  div.style.bottom = parentStyles.bottom;
                  div.style.transform = parentStyles.transform;
                  console.log(`📍 Using parent positioning for ${fieldName}: top=${parentStyles.top}, left=${parentStyles.left}`);
                } else {
                  // Fallback to textarea's own positioning
                  div.style.position = textarea.style.position;
                  div.style.top = textarea.style.top;
                  div.style.left = textarea.style.left;
                  div.style.right = textarea.style.right;
                  div.style.bottom = textarea.style.bottom;
                  div.style.transform = textarea.style.transform;
                }
                
                // Copy text styling
                div.style.fontSize = textarea.style.fontSize;
                div.style.fontFamily = textarea.style.fontFamily;
                div.style.color = textarea.style.color;
                div.style.textAlign = textarea.style.textAlign;
                div.style.lineHeight = textarea.style.lineHeight;
                div.style.fontWeight = textarea.style.fontWeight;
                div.style.fontStyle = textarea.style.fontStyle;
                div.style.whiteSpace = textarea.style.whiteSpace;
                div.style.padding = textarea.style.padding;
                div.style.margin = textarea.style.margin;
                
                if (textarea.parentNode) {
                  textarea.parentNode.replaceChild(div, textarea);
                }
              } catch (e) {
                console.warn('Failed to convert textarea:', e);
              }
            });
            
            const buttonsToRemove = clonedDoc.querySelectorAll('button, .btn, .iso-dropdown');
            buttonsToRemove.forEach(btn => {
              btn.remove();
            });

            const imageButtons = clonedDoc.querySelectorAll('[style*="border-radius: 50%"]');
            imageButtons.forEach(btn => {
              const text = btn.textContent;
              if (text === '×' || text === '⤡' || btn.style.backgroundColor.includes('255, 0, 0')) {
                btn.remove();
              }
            });

            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                outline: none !important;
                box-shadow: none !important;
                cursor: default !important;
              }
              button, .btn, .iso-dropdown { 
                display: none !important;
                visibility: hidden !important;
              }
              textarea, input { 
                border: none !important;
                background: transparent !important;
                cursor: default !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
          } catch (error) {
            console.error('Error in onclone:', error);
          }
        }
      });

      // Restore original element style
      slideElement.style.cssText = originalStyle;

      if (canvas.width === 0 || canvas.height === 0) {
        console.error(`Canvas ${i + 1} has no dimensions: ${canvas.width}x${canvas.height}`);
        continue;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      if (!imgData || imgData === 'data:,') {
        console.error(`No image data for slide ${i + 1}`);
        continue;
      }

      console.log(`Canvas ${i + 1} dimensions: ${canvas.width}x${canvas.height}`);
      
      if (i > 0) {
        pdf.addPage([1280, 720], 'landscape');
      }
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
      
      console.log(`Slide ${i + 1} added to PDF`);
    }

    pdf.save(filename);
    console.log(`PDF saved as: ${filename}`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};