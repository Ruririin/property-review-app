// Utility to clean up duplicate slides (improved version)
export function cleanupDuplicateSlides() {
  console.log('🧹 CLEANING UP DUPLICATE SLIDES');
  
  try {
    const projects = JSON.parse(localStorage.getItem('property_review_projects') || '{}');
    let totalCleaned = 0;
    
    // Types that should only have one instance
    const singleInstanceTypes = ['crime_rate', 'comments', 'ratings', 'website', 'fire_hazard', 'nearest_fire_station'];
    
    Object.entries(projects).forEach(([projectId, project]) => {
      if (!project.slides) return;
      
      console.log(`\n📁 Checking project ${projectId}...`);
      
      singleInstanceTypes.forEach(slideType => {
        const slidesOfType = project.slides.filter(s => s.type === slideType);
        
        if (slidesOfType.length > 1) {
          console.log(`  - Found ${slidesOfType.length} ${slideType} slides - cleaning up...`);
          
          // Keep only the first slide of this type
          const firstSlide = slidesOfType[0];
          const slidesToRemove = slidesOfType.slice(1);
          
          // Remove duplicate slides from slides array
          project.slides = project.slides.filter(slide => 
            slide.type !== slideType || slide.id === firstSlide.id
          );
          
          // Remove slide data for duplicate slides
          if (project.slideData) {
            slidesToRemove.forEach(slide => {
              if (project.slideData[slide.id]) {
                delete project.slideData[slide.id];
                console.log(`    - 🗑️ Removed slide data for ${slideType} slide ${slide.id}`);
              }
            });
          }
          
          totalCleaned += slidesToRemove.length;
          console.log(`    - ✅ Kept ${slideType} slide ${firstSlide.id}, removed ${slidesToRemove.length} duplicates`);
        }
      });
    });
    
    if (totalCleaned > 0) {
      localStorage.setItem('property_review_projects', JSON.stringify(projects));
      console.log(`\n🎉 Cleanup complete! Removed ${totalCleaned} duplicate slides total`);
      console.log('💡 Refresh the page to see changes');
    } else {
      console.log('\n✅ No duplicate slides found');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up slides:', error);
  }
}

// Legacy function for backward compatibility
export function cleanupDuplicateCrimeSlides() {
  cleanupDuplicateSlides();
}

// Make available globally
if (typeof window !== 'undefined') {
  window.cleanupDuplicateSlides = cleanupDuplicateSlides;
  window.cleanupDuplicateCrimeSlides = cleanupDuplicateCrimeSlides; // Legacy
  console.log('💡 Run cleanupDuplicateSlides() in console to remove all duplicate slides');
  console.log('💡 Or run cleanupDuplicateCrimeSlides() for just crime slides');
}

export default cleanupDuplicateCrimeSlides;
