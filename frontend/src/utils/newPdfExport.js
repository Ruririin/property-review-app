import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import React from 'react';

// Import all slide components
import SlideOne from '../pages/slides/SlideOne';
import SlideTwo from '../pages/slides/SlideTwo';
import SlideThree from '../pages/slides/SlideThree';
import StreetView from '../pages/slides/StreetView';
import Interior from '../pages/slides/Interior';
import OnlinePresence from '../pages/slides/OnlinePresence';
import License from '../pages/slides/License';
import Comments from '../pages/slides/Comments';
import FireHazard from '../pages/slides/FireHazard';
import CrimeRate from '../pages/slides/CrimeRate';
import NearestFireStation from '../pages/slides/NearestFireStation';
import Website from '../pages/slides/Website';
import Ratings from '../pages/slides/Ratings';

const slideComponents = {
  cover: SlideOne,
  'slide-2': SlideTwo,
  'slide-3': SlideThree,
  street_view: StreetView,
  interior: Interior,
  online_presence: OnlinePresence,
  license: License,
  comments: Comments,
  fire_hazard: FireHazard,
  crime_rate: CrimeRate,
  nearest_fire_station: NearestFireStation,
  website: Website,
  ratings: Ratings
};

export const exportAllSlidesToPDF = async (slides, slideData, globalLocationData, sessionUser) => {
  try {
    console.log('🚀 Starting PDF export of all slides...');
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

    // Create temporary container for rendering slides
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-10000px';
    tempContainer.style.left = '-10000px';
    tempContainer.style.width = '1280px';
    tempContainer.style.height = '720px';
    tempContainer.style.background = 'white';
    tempContainer.style.fontFamily = "'Montserrat', sans-serif";
    tempContainer.style.zIndex = '-1000';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`📄 Processing slide ${i + 1}/${slides.length}: ${slide.title}`);

      // Get slide type, handling numbered types like street_view_1
      let slideType = slide.type;
      if (slideType && slideType.startsWith('street_view_')) {
        slideType = 'street_view';
      }

      const SlideComponent = slideComponents[slideType];
      
      if (!SlideComponent) {
        console.error(`❌ No component found for slide type: ${slideType}`);
        continue;
      }

      // Clear container
      tempContainer.innerHTML = '';

      // Create React root and render slide
      const root = createRoot(tempContainer);
      
      const slideProps = {
        slideId: slide.id,
        device: { isMobile: false, isTablet: false, isDesktop: true },
        formData: slideData?.[slide.id]?.formData || {},
        globalFormData: slideData || {},
        setFormData: () => {}, // Dummy function for export
        fontSizes: {},
        showWebsite: true,
        setShowWebsite: () => {},
        multipleLocationsMode: false,
        setMultipleLocationsMode: () => {},
        selectedLocationIndex: 0,
        fieldPositions: {},
        setFieldPositions: () => {},
        zoomLevel: 100,
        sessionUser: sessionUser,
        currentFormId: slide.id,
        selectedField: null,
        onSelect: () => {},
        slideData: slideData?.[slide.id] || {},
        updateSlideData: () => {},
        allSlideData: slideData || {},
        slides: slides,
        isActiveSlide: true
      };

      // Render the slide component
      await new Promise((resolve) => {
        root.render(React.createElement(SlideComponent, slideProps));
        
        // Wait for component to render
        setTimeout(async () => {
          try {
            // Capture the slide as image
            const canvas = await html2canvas(tempContainer, {
              width: 1280,
              height: 720,
              scale: 1,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false
            });

            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');

            // Add page to PDF (add new page for all except first)
            if (i > 0) {
              pdf.addPage();
            }

            // Add image to PDF page
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
            
            console.log(`✅ Slide ${i + 1} captured and added to PDF`);
            
            // Clean up root
            root.unmount();
            resolve();
          } catch (error) {
            console.error(`❌ Error capturing slide ${i + 1}:`, error);
            root.unmount();
            resolve(); // Continue with next slide
          }
        }, 1000); // Give more time for complex slides to render
      });
    }

    // Clean up temporary container
    document.body.removeChild(tempContainer);

    // Save PDF and trigger download
    pdf.save(filename);
    
    console.log(`🎉 PDF export completed: ${filename}`);
    
    // TODO: Save to backend for homepage display
    await saveExportToBackend(filename, insuredName, slides.length, sessionUser);
    
    return { success: true, filename };

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

// Function to save export info to backend
const saveExportToBackend = async (filename, insuredName, slideCount, sessionUser) => {
  try {
    // TODO: Implement API call to save export info
    console.log('💾 Saving export to backend:', {
      filename,
      insuredName,
      slideCount,
      sessionUser,
      exportDate: new Date().toISOString()
    });
    
    // This would typically be an API call like:
    // await apiService.saveExport({
    //   filename,
    //   insuredName,
    //   slideCount,
    //   sessionUser,
    //   exportDate: new Date().toISOString()
    // });
    
  } catch (error) {
    console.error('❌ Error saving export to backend:', error);
    // Don't throw - export should still work even if backend save fails
  }
};
