import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export all slides to PDF using the main branch's sophisticated capture logic
 * This approach temporarily renders each slide in the existing DOM container
 */
export const exportAllSlidesMainBranchStyle = async (slides, slideData, globalLocationData, sessionUser, currentSlide, setCurrentSlide) => {
  try {
    console.log('🚀 Starting PDF export using main branch logic...');
    console.log('Total slides to export:', slides.length);

    if (!slides || slides.length === 0) {
      throw new Error('No slides provided for PDF generation');
    }

    // Get insured name for filename
    const insuredName = globalLocationData?.insuredName || 
                       slideData?.[1]?.formData?.insuredName || 
                       'Unknown';
    const filename = `Property Review (${insuredName}).pdf`;

    // Create PDF in landscape orientation (1280x720 matches slide dimensions)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px', 
      format: [1280, 720]
    });

    // Store the original current slide to restore later
    const originalCurrentSlide = currentSlide;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`📄 Processing slide ${i + 1}/${slides.length}: ${slide.title}`);

      // Switch to this slide to render it in the DOM
      setCurrentSlide(slide.id);
      
      // Wait for React to re-render the slide
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find the slide DOM element
      const slideElement = document.querySelector(`#slide-container-${slide.id}`);
      
      if (!slideElement) {
        console.error(`❌ No DOM element found for slide ${slide.id}`);
        continue;
      }

      console.log(`Processing slide ${i + 1}/${slides.length}`);

      // === MAIN BRANCH CAPTURE LOGIC STARTS HERE ===
      
      // Make sure the element is visible for capture and properly positioned
      const originalStyle = slideElement.style.cssText;
      slideElement.style.position = 'fixed';
      slideElement.style.left = '0px';
      slideElement.style.top = '0px';
      slideElement.style.visibility = 'visible';
      slideElement.style.opacity = '1';
      slideElement.style.zIndex = '99999';
      slideElement.style.transform = 'none';
      slideElement.style.margin = '0px';
      slideElement.style.padding = '0px';

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Force all child elements to be visible and render backgrounds
        const childElements = slideElement.querySelectorAll('*');
        const originalChildStyles = [];
        
        childElements.forEach((el, index) => {
          originalChildStyles[index] = el.style.cssText;
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
        });

        // Ensure background images are loaded
        const backgroundImage = getComputedStyle(slideElement).backgroundImage;
        console.log(`Slide ${i + 1} background image:`, backgroundImage);
        
        // Force background image to be loaded
        if (backgroundImage && backgroundImage !== 'none') {
          slideElement.style.backgroundImage = backgroundImage;
          slideElement.style.backgroundSize = '100% 100%';
          slideElement.style.backgroundRepeat = 'no-repeat';
          slideElement.style.backgroundPosition = 'center center';
        }

        // Main branch canvas options
        const canvasOptions = {
          width: 1280,
          height: 720,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true,
          foreignObjectRendering: false,
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Convert all textareas to divs for better PDF rendering (main branch logic)
            const textareas = clonedDoc.querySelectorAll('textarea');
            textareas.forEach(textarea => {
              const div = clonedDoc.createElement('div');
              const fieldName = textarea.getAttribute('data-field');
              const textContent = textarea.value || textarea.placeholder || '';
              
              // Don't add bullets here as they're already rendered visually in the component
              // Just use the text content as-is
              div.textContent = textContent;
              
              // Copy styling but ensure clean rendering
              div.style.cssText = textarea.style.cssText;
              div.style.border = 'none';
              div.style.backgroundColor = 'transparent';
              div.style.outline = 'none';
              div.style.whiteSpace = 'pre-wrap';
              div.style.wordWrap = 'break-word';
              
              textarea.parentNode.replaceChild(div, textarea);
            });
          }
        };

        // Capture with DOM manipulation to convert interactive elements to static
        const canvas = await html2canvas(slideElement, canvasOptions);

        // Restore original element style and child styles
        slideElement.style.cssText = originalStyle;
        childElements.forEach((el, index) => {
          el.style.cssText = originalChildStyles[index];
        });

        // Check if canvas has content
        if (canvas.width === 0 || canvas.height === 0) {
          console.error(`❌ Canvas ${i + 1} has no dimensions: ${canvas.width}x${canvas.height}`);
          continue;
        }

        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Check if image data is valid
        if (!imgData || imgData === 'data:,') {
          console.error(`❌ No image data for slide ${i + 1}`);
          continue;
        }

        // Add page to PDF (add new page for all except first)
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF page
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        
        console.log(`✅ Slide ${i + 1} captured and added to PDF`);

      } catch (slideError) {
        console.error(`❌ Error capturing slide ${i + 1}:`, slideError);
        // Restore original style even if there's an error
        slideElement.style.cssText = originalStyle;
      }
    }

    // Restore the original current slide
    setCurrentSlide(originalCurrentSlide);
    
    // Wait for the final slide to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Save PDF and trigger download
    pdf.save(filename);
    
    console.log(`🎉 PDF export completed: ${filename}`);
    
    return { success: true, filename };

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};
