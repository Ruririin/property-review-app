/**
 * PDF Export using Backend Screenshot Service (Playwright)
 * This provides pixel-perfect exports by screenshotting the actual rendered HTML
 */

/**
 * Convert all images in slide elements to base64 data URIs
 * This ensures the backend can render them without network access
 */
const convertImagesToBase64 = async (slideElements) => {
  const promises = [];

  slideElements.forEach(slideElement => {
    if (!slideElement) return;

    // Convert <img> tags to base64
    const images = slideElement.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        const promise = new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';

          tempImg.onload = () => {
            canvas.width = tempImg.naturalWidth || tempImg.width;
            canvas.height = tempImg.naturalHeight || tempImg.height;
            ctx.drawImage(tempImg, 0, 0);

            try {
              const dataURL = canvas.toDataURL('image/png');
              img.src = dataURL;
            } catch (e) {
              console.warn('Failed to convert image to base64:', e);
            }
            resolve();
          };

          tempImg.onerror = () => {
            console.warn('Failed to load image:', img.src);
            resolve();
          };

          tempImg.src = img.src;
        });

        promises.push(promise);
      }
    });

    // Convert background-image CSS to base64
    const elementsWithBg = slideElement.querySelectorAll('*');
    elementsWithBg.forEach(el => {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none' && !bgImage.includes('data:')) {
        // Extract URL from background-image
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          const imageUrl = urlMatch[1];

          const promise = new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';

            tempImg.onload = () => {
              canvas.width = tempImg.naturalWidth || tempImg.width;
              canvas.height = tempImg.naturalHeight || tempImg.height;
              ctx.drawImage(tempImg, 0, 0);

              try {
                const dataURL = canvas.toDataURL('image/png');
                el.style.backgroundImage = `url('${dataURL}')`;
              } catch (e) {
                console.warn('Failed to convert background image to base64:', e);
              }
              resolve();
            };

            tempImg.onerror = () => {
              console.warn('Failed to load background image:', imageUrl);
              resolve();
            };

            tempImg.src = imageUrl;
          });

          promises.push(promise);
        }
      }
    });
  });

  await Promise.all(promises);
};

/**
 * Export slides to PDF using backend screenshot service
 * @param {Array} slideElements - Array of DOM elements to screenshot
 * @param {Object} slideData - Slide data object (not used in this approach)
 * @param {string} filename - Output PDF filename
 * @returns {Promise<Blob>} PDF blob
 */
export const exportToPDFScreenshot = async (slideElements, slideData, filename = 'Property Review.pdf') => {
  try {
    console.log(`Starting screenshot-based PDF export with ${slideElements.length} slides`);

    if (!slideElements || slideElements.length === 0) {
      throw new Error('No slides provided for export');
    }

    // Convert all images to base64 first
    console.log('Converting images to base64...');
    await convertImagesToBase64(slideElements);

    // Extract HTML from each slide element
    const slidesHTML = slideElements.map((slideElement, index) => {
      if (!slideElement) {
        console.warn(`Slide ${index + 1} element not found, skipping`);
        return null;
      }

      // Get the outer HTML of the slide
      let html = slideElement.outerHTML;

      // Wrap in a complete HTML document with styles
      const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1280px;
      height: 720px;
      overflow: hidden;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    /* Import Montserrat font */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    /* Ensure slide fills the viewport */
    .slide {
      width: 1280px !important;
      height: 720px !important;
      position: relative;
    }

    /* Hide interactive elements */
    button, .btn, .iso-dropdown {
      display: none !important;
    }

    /* Remove outlines and shadows */
    * {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Static textarea styling */
    textarea {
      border: none !important;
      background: transparent !important;
      resize: none !important;
      cursor: default !important;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
      `;

      return wrappedHTML;
    }).filter(Boolean); // Remove null entries

    console.log(`Sending ${slidesHTML.length} slides to backend for screenshot`);

    // Get CSRF token from cookie
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    // Send to backend
    const response = await fetch('/api/export-screenshot-pdf/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        slides_html: slidesHTML,
        filename: filename
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend screenshot PDF export failed: ${response.status} - ${errorText}`);
    }

    // Get PDF blob
    const blob = await response.blob();

    // Download the PDF
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log(`Screenshot-based PDF export completed: ${filename}`);
    return blob;

  } catch (error) {
    console.error('Screenshot-based PDF export failed:', error);
    throw error;
  }
};

/**
 * Preview PDF using backend screenshot service
 * @param {Array} slideElements - Array of DOM elements to screenshot
 * @param {Object} slideData - Slide data object (not used in this approach)
 * @param {string} filename - Output PDF filename
 * @returns {Promise<string>} Blob URL for preview
 */
export const previewPDFScreenshot = async (slideElements, slideData, filename = 'Property Review Preview.pdf') => {
  try {
    console.log(`Starting screenshot-based PDF preview with ${slideElements.length} slides`);

    if (!slideElements || slideElements.length === 0) {
      throw new Error('No slides provided for preview');
    }

    // Convert all images to base64 first
    console.log('Converting images to base64...');
    await convertImagesToBase64(slideElements);

    // Extract HTML from each slide element
    const slidesHTML = slideElements.map((slideElement, index) => {
      if (!slideElement) {
        console.warn(`Slide ${index + 1} element not found, skipping`);
        return null;
      }

      // Get the outer HTML of the slide
      let html = slideElement.outerHTML;

      // Wrap in a complete HTML document with styles
      const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1280px;
      height: 720px;
      overflow: hidden;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    /* Import Montserrat font */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

    /* Ensure slide fills the viewport */
    .slide {
      width: 1280px !important;
      height: 720px !important;
      position: relative;
    }

    /* Hide interactive elements */
    button, .btn, .iso-dropdown {
      display: none !important;
    }

    /* Remove outlines and shadows */
    * {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Static textarea styling */
    textarea {
      border: none !important;
      background: transparent !important;
      resize: none !important;
      cursor: default !important;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
      `;

      return wrappedHTML;
    }).filter(Boolean); // Remove null entries

    console.log(`Sending ${slidesHTML.length} slides to backend for preview screenshot`);

    // Get CSRF token from cookie
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    // Send to backend
    const response = await fetch('/api/preview-screenshot-pdf/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({
        slides_html: slidesHTML,
        filename: filename
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend screenshot PDF preview failed: ${response.status} - ${errorText}`);
    }

    // Get PDF blob and create URL for preview
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    console.log(`Screenshot-based PDF preview completed`);
    return url;

  } catch (error) {
    console.error('Screenshot-based PDF preview failed:', error);
    throw error;
  }
};
