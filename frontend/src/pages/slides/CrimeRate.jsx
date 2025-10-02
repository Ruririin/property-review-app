import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import MultiImageComponent from "../../components/MultiImageComponent";
import bestPlacesService from "../../services/bestPlacesService";


const CrimeRate = forwardRef(({
  formData,
  setFormData,
  onSelect,
  selectedField,
  fontSizes,
  showWebsite,
  fieldPositions,
  setFieldPositions,
  zoomLevel,
  slideData,
  updateSlideData,
  isActiveSlide,
  slideId = 'crimeRate',
}, ref) => {

  const containerRef = useRef(null);
  
  // Use slideData directly as the source of truth for Best Places data state
  const showBestPlacesData = slideData?.bestPlacesDataLoaded || false;

  // Extract and validate ZIP code from premise location
  const extractZipCode = (address) => {
    if (!address) return null;
    
    // Try to match 5-digit ZIP code pattern
    const zipMatch = address.match(/\b(\d{5})\b/);
    
    if (zipMatch) {
      const zipCode = zipMatch[1];
      
      // Basic ZIP code validation - US ZIP codes are typically 00001-99999
      // But let's be more specific and check for realistic ranges
      const zipNum = parseInt(zipCode);
      
      // Basic validation: US ZIP codes range from 00501 to 99950
      if (zipNum >= 501 && zipNum <= 99950) {
        return zipCode;
      } else {
        console.warn('⚠️ Invalid ZIP code detected:', zipCode);
        return null;
      }
    }
    
    return null;
  };

  // Get ZIP code from the premise location
  const zipCode = extractZipCode(formData?.premiseLocation);
  
  // Best Places crime data - use saved data if available, otherwise use mock data
  const bestPlacesData = slideData?.bestPlacesData || {
    location: formData?.premiseLocation || "Property Location",
    zip_code: zipCode || "90041", // Use extracted ZIP or default to example
    violent_crime: 28,
    violent_crime_us_avg: 22.7,
    property_crime: 45,
    property_crime_us_avg: 35.4,
    chart_data: [
      {
        type: 'violent_crime',
        labels: ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'],
        values: [380, 420, 390, 350, 320, 300, 280, 290, 310, 330, 280, 260, 250, 240, 220, 210, 200, 190, 180, 170]
      },
      {
        type: 'property_crime', 
        labels: ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'],
        values: [2800, 3200, 3100, 2900, 2700, 2500, 2300, 2400, 2600, 2800, 2400, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400]
      }
    ]
  };

  // Expose method to sync current state positions to DOM for PDF export
  useImperativeHandle(ref, () => ({
    syncPositionsToDom: () => {
      if (setFieldPositions) {
        setFieldPositions({ ...(fieldPositions || {}) });
      }
    }
  }));



  return (
    <div
      ref={containerRef}
      style={{
        width: "1280px",
        height: "720px",
        position: "relative",
        background: "url('/Template/Template-10.png') center/100% 100% no-repeat",
        margin: "0 auto",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        fontFamily: "'Montserrat', sans-serif",
        userSelect: "none",
      }}
      onClick={(e) => {
        // If clicking on empty area (not on text field or image), deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {/* Best Places Button - show when no data is loaded */}
      {!showBestPlacesData && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          zIndex: 100,
          pointerEvents: "auto"
        }}>
          <div style={{
            padding: "30px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            fontFamily: "'Montserrat', sans-serif",
          }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Crime Rate Data</h3>
            <p style={{ marginBottom: "25px", color: "#666", fontSize: "16px" }}>
              Click below to download real Best Places crime charts and statistics for this location
            </p>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔴 Crime Rate: Fetching Best Places data and images');
                
                // Show loading state immediately
                if (updateSlideData) {
                  await updateSlideData({ 
                    bestPlacesDataLoaded: true,
                    isLoadingBestPlaces: true,
                    bestPlacesData: bestPlacesData // Keep existing data while loading
                  });
                }
                
                try {
                  // Fetch real Best Places data AND download PNG images
                  const locationData = formData?.premiseLocation || '';
                  console.log('📍 Using location for Best Places lookup:', locationData);
                  
                  const realData = await bestPlacesService.fetchCrimeData(zipCode || "90041", locationData);
                  console.log('📊 Fetched Best Places data:', realData);
                  
                  // Save the real data with images to slideData
                  if (updateSlideData) {
                    await updateSlideData({ 
                      bestPlacesDataLoaded: true,
                      isLoadingBestPlaces: false,
                      bestPlacesData: realData 
                    });
                  }
                  
                  console.log('✅ Successfully loaded Best Places data and images');
                  
                  // If images were downloaded, also open Best Places for reference
                  if (realData.images_downloaded) {
                    const { openBestPlaces } = await import('../../utils/editorHelpers');
                    openBestPlaces(locationData);
                  }
                  
                } catch (error) {
                  console.error('❌ Failed to fetch Best Places data:', error);
                  
                  // Fall back to mock data and try to open Best Places manually
                  const { openBestPlaces } = await import('../../utils/editorHelpers');
                  openBestPlaces(locationData); // Open Best Places as fallback
                  
                  if (updateSlideData) {
                    await updateSlideData({ 
                      bestPlacesDataLoaded: true,
                      isLoadingBestPlaces: false,
                      bestPlacesData: {
                        ...bestPlacesData,
                        source: 'fallback_estimated',
                        note: 'Could not download Best Places images. Opened Best Places tab for manual reference.',
                        error: error.message,
                        best_places_opened: new Date().toISOString()
                      }
                    });
                  }
                }
              }}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "600",
                backgroundColor: "#2d5d2d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontFamily: "'Montserrat', sans-serif",
                pointerEvents: "auto",
                zIndex: 101
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#1e4a1e"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#2d5d2d"}
            >
              📊 Download Best Places Charts
            </button>
          </div>
        </div>
      )}

      {/* Crime Statistics Display - show when Best Places data is loaded */}
      {showBestPlacesData && (
        <>
          {/* Top Text Statistics Box - exactly like the PDF */}
          <div
            style={{
              position: "absolute",
              left: "223px",
              top: "119px",
              width: "835px",
              height: "115px",
              backgroundColor: "white",
              border: "2px solid black",
              padding: "15px",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "1.4",
              zIndex: 10
            }}
          >
            <div style={{ marginBottom: "8px", fontSize: "16px" }}>
              Crime is ranked on a scale of 1 (low crime) to 100 (high crime)
            </div>
            <div style={{ marginBottom: "8px", fontSize: "16px" }}>
              <strong>{bestPlacesData.location} (zip {bestPlacesData.zip_code}) violent crime is {bestPlacesData.violent_crime}.</strong> (The US average is {bestPlacesData.violent_crime_us_avg})
            </div>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>
              <strong>{bestPlacesData.location} (zip {bestPlacesData.zip_code}) property crime is {bestPlacesData.property_crime}.</strong> (The US average is {bestPlacesData.property_crime_us_avg})
            </div>
            {bestPlacesData.source === 'bestplaces.net_manual' && (
              <div style={{ 
                fontSize: "14px", 
                color: "#0066cc", 
                fontStyle: "italic",
                padding: "8px",
                backgroundColor: "#f0f8ff",
                borderRadius: "4px",
                border: "1px solid #cce7ff"
              }}>
                💡 Check the Best Places tab for real-time crime statistics and trends
              </div>
            )}
            {slideData?.isLoadingBestPlaces && (
              <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                🔄 Loading real data from BestPlaces.net...
              </div>
            )}
            {bestPlacesData.source && (
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                Data source: {
                  bestPlacesData.source === 'bestplaces.net_images' ? 'BestPlaces.net (Downloaded Images)' :
                  bestPlacesData.source === 'bestplaces.net_structured' ? 'BestPlaces.net (Estimated Charts)' :
                  bestPlacesData.source === 'fallback_estimated' ? 'Estimated (Download Failed)' :
                  'Estimated based on area'
                }
                {bestPlacesData.images_downloaded && (
                  <span style={{ color: "#228B22" }}> ✅ Real Best Places charts downloaded</span>
                )}
                {bestPlacesData.images_downloaded === false && (
                  <span style={{ color: "#FFA500" }}> ⚠️ Could not download images, using estimated charts</span>
                )}
              </div>
            )}
          </div>

          {/* Violent Crime Chart - Large chart on left - takes up almost half the screen */}
          <div
            style={{
              position: "absolute",
              left: "223px",
              top: "250px",
              width: "520px",
              height: "410px",
              backgroundColor: "white",
              border: "2px solid black",
              padding: "15px",
              zIndex: 10
            }}
          >
            {/* Show downloaded Best Places image */}
            {bestPlacesData.chart_images?.violentCrimeChart ? (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <img
                  src={bestPlacesData.chart_images.violentCrimeChart.dataUrl}
                  alt="Violent Crime Chart from Best Places"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "10px",
                  fontSize: "10px",
                  color: "#666",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  padding: "2px 6px",
                  borderRadius: "3px"
                }}>
                  Downloaded from BestPlaces.net
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "#666",
                fontSize: "14px",
                marginTop: "180px"
              }}>
                {slideData?.isLoadingBestPlaces ? 'Downloading Best Places images...' : 'Click "Download Best Places Charts" to load crime data'}
              </div>
            )}
          </div>

          {/* Property Crime Chart - Large chart on right - fills remaining space */}
          <div
            style={{
              position: "absolute",
              left: "760px",
              top: "250px",
              width: "480px",
              height: "410px",
              backgroundColor: "white",
              border: "2px solid black",
              padding: "15px",
              zIndex: 10
            }}
          >
            {/* Show downloaded Best Places image */}
            {bestPlacesData.chart_images?.propertyCrimeChart ? (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <img
                  src={bestPlacesData.chart_images.propertyCrimeChart.dataUrl}
                  alt="Property Crime Chart from Best Places"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "10px",
                  fontSize: "10px",
                  color: "#666",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  padding: "2px 6px",
                  borderRadius: "3px"
                }}>
                  Downloaded from BestPlaces.net
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "#666",
                fontSize: "14px",
                marginTop: "180px"
              }}>
                {slideData?.isLoadingBestPlaces ? 'Downloading Best Places images...' : 'Click "Download Best Places Charts" to load crime data'}
              </div>
            )}
          </div>

          {/* Best Places Attribution - bottom right */}
          <div
            style={{
              position: "absolute",
              right: "30px",
              bottom: "30px",
              fontSize: "24px",
              color: "#666",
              fontFamily: "'Montserrat', sans-serif",
              zIndex: 10
            }}
          >
            www.bestplaces.com
          </div>
        </>
      )}

      {/* Image Component for additional screenshots */}
      <MultiImageComponent
        images={slideData?.images || []}
        onUpdateImages={async (updatedImages) => {
          if (updateSlideData) {
            await updateSlideData({ images: updatedImages });
          }
        }}
        zoomLevel={zoomLevel}
      />
    </div>
  );
});

CrimeRate.displayName = 'CrimeRate';
export default CrimeRate;