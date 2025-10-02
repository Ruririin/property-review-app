// Debug utility to check project data structure
export function debugProjectData() {
  console.log('🔍 DEBUGGING PROJECT DATA STRUCTURE');
  
  // Check localStorage for project data
  const projects = JSON.parse(localStorage.getItem('property_review_projects') || '{}');
  console.log('📦 All projects in localStorage:', Object.keys(projects));
  
  Object.entries(projects).forEach(([projectId, project]) => {
    console.log(`\n📁 Project ${projectId}:`);
    console.log('  - Slides count:', project.slides?.length || 0);
    console.log('  - Slide types:', project.slides?.map(s => s.type) || []);
    
    // Check for crime slides specifically
    const crimeSlides = project.slides?.filter(s => s.type === 'crime_rate') || [];
    if (crimeSlides.length > 0) {
      console.log(`  - 🚨 Found ${crimeSlides.length} crime slides:`, crimeSlides.map(s => ({ id: s.id, title: s.title })));
    }
    
    // Check slideData for crime data
    if (project.slideData) {
      const slideIds = Object.keys(project.slideData);
      console.log('  - SlideData keys:', slideIds);
      
      slideIds.forEach(slideId => {
        const data = project.slideData[slideId];
        if (data && (data.bestPlacesData || data.bestPlacesDataLoaded)) {
          console.log(`  - 📊 Slide ${slideId} has crime data:`, {
            bestPlacesDataLoaded: data.bestPlacesDataLoaded,
            hasData: !!data.bestPlacesData
          });
        }
      });
    }
  });
}

// Run debug in console
if (typeof window !== 'undefined') {
  window.debugProjectData = debugProjectData;
  console.log('💡 Run debugProjectData() in console to debug project structure');
}

export default debugProjectData;
