import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const cleanSlidesToRenderPDF = (slides, allSlideData, filename) => {
  return generatePDFFromSlides(slides, allSlideData, filename);
};

const generatePDFFromSlides = async (slides, allSlideData, filename = 'Property_Review.pdf') => {
  try {
    console.log('Starting PDF generation...');
    console.log('Total slides:', slides.length);

    if (!slides || slides.length === 0) {
      throw new Error('No slides provided for PDF generation');
    }

    // Create PDF in landscape orientation (1280x720 matches slide dimensions)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px', 
      format: [1280, 720]
    });
    
    for (let i = 0; i < slides.length; i++) {
      const slideElement = slides[i];
      
      if (!slideElement) {
        console.error(`Slide ${i + 1} is null or undefined`);
        continue;
      }

      console.log(`Processing slide ${i + 1}/${slides.length}`);

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

      // Wait a moment for rendering and log element info
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Slide ${i + 1} element rect:`, slideElement.getBoundingClientRect());
      console.log(`Slide ${i + 1} computed style:`, getComputedStyle(slideElement));
      console.log(`Slide ${i + 1} children count:`, slideElement.children.length);

      try {
        // Check if this is the comments slide (slide 1, index 0) to handle differently
        const isCommentsSlide = i === 0; // 0-based index, so slide 1 is index 0
        
        // For comments slide, use simplified capture to avoid CSS parsing issues
        const canvasOptions = {
          width: 1280,
          height: 720,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          foreignObjectRendering: false, // Disable to avoid textarea rendering issues
        };
        
        // Disable onclone processing entirely to avoid CSS parsing issues
        // Will use basic html2canvas capture for all slides
        
        // Force all child elements to be visible and render backgrounds
        const childElements = slideElement.querySelectorAll('*');
        const originalChildStyles = [];
        
        childElements.forEach((el, index) => {
          originalChildStyles[index] = el.style.cssText;
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
        });

        // Ensure background images are loaded by checking the main slide element
        const backgroundImage = getComputedStyle(slideElement).backgroundImage;
        console.log(`Slide ${i + 1} background image:`, backgroundImage);
        
        // Force background image to be loaded
        if (backgroundImage && backgroundImage !== 'none') {
          slideElement.style.backgroundImage = backgroundImage;
          slideElement.style.backgroundSize = '100% 100%';
          slideElement.style.backgroundRepeat = 'no-repeat';
          slideElement.style.backgroundPosition = 'center center';
        }

        // Simple approach - just capture what's visible with better settings
        canvasOptions.scale = 1;
        canvasOptions.width = 1280;
        canvasOptions.height = 720;
        canvasOptions.useCORS = true;
        canvasOptions.allowTaint = true;
        canvasOptions.backgroundColor = '#ffffff';
        canvasOptions.logging = true;
        canvasOptions.foreignObjectRendering = false;
        canvasOptions.removeContainer = true;
        canvasOptions.onclone = (clonedDoc) => {
          // Convert all textareas to divs for better PDF rendering
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
          console.error(`Canvas ${i + 1} has no dimensions: ${canvas.width}x${canvas.height}`);
          continue;
        }

        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Check if image data is valid
        if (!imgData || imgData === 'data:,') {
          console.error(`No image data for slide ${i + 1}`);
          continue;
        }

        console.log(`Canvas ${i + 1} dimensions: ${canvas.width}x${canvas.height}`);
        
        if (i > 0) {
          pdf.addPage([1280, 720], 'landscape');
        }
        
        // Add image to PDF normally
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        
        console.log(`Slide ${i + 1} added to PDF`);
      } catch (slideError) {
        console.error(`Error processing slide ${i + 1}:`, slideError);
        console.error('Error stack:', slideError.stack);
        // Restore original style even on error
        slideElement.style.cssText = originalStyle;
        continue;
      }
    }

    // Save the PDF
    pdf.save(filename);
    console.log(`PDF saved as: ${filename}`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Keep the original export name for compatibility
const exportToPDF = generatePDFFromSlides;

export { cleanSlidesToRenderPDF, exportToPDF };