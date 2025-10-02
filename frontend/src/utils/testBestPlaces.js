/**
 * Test script to analyze Best Places URL patterns and chart image availability
 */

// Test different Best Places URL patterns
const testBestPlacesUrls = async (zipCode = "90210") => {
  console.log(`🔍 Testing Best Places URLs for ZIP: ${zipCode}`);
  
  // Common patterns observed on Best Places
  const testUrls = [
    // Direct page URLs
    `https://www.bestplaces.net/crime/zip-code/california/beverly_hills/${zipCode}`,
    `https://www.bestplaces.net/search/?q=${zipCode}`,
    
    // Potential chart image URLs (these are educated guesses based on common patterns)
    `https://www.bestplaces.net/images/charts/crime/violent/${zipCode}.png`,
    `https://www.bestplaces.net/images/charts/crime/property/${zipCode}.png`,
    `https://chart.bestplaces.net/crime/violent_${zipCode}.png`,
    `https://chart.bestplaces.net/crime/property_${zipCode}.png`,
    `https://www.bestplaces.net/crime/charts/${zipCode}_violent.png`,
    `https://www.bestplaces.net/crime/charts/${zipCode}_property.png`,
    
    // Alternative patterns
    `https://images.bestplaces.net/crime/zip/${zipCode}/violent.png`,
    `https://images.bestplaces.net/crime/zip/${zipCode}/property.png`,
    `https://www.bestplaces.net/images/zip/${zipCode}/crime_violent.png`,
    `https://www.bestplaces.net/images/zip/${zipCode}/crime_property.png`,
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'HEAD', // Just check if the resource exists
        mode: 'no-cors' // Avoid CORS issues for testing
      });
      
      console.log(`✅ ${url} - Status: ${response.status || 'ok'}`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
};

// Export for use in console
window.testBestPlacesUrls = testBestPlacesUrls;

// Auto-run test
if (typeof window !== 'undefined') {
  console.log('🧪 Best Places URL tester loaded. Run testBestPlacesUrls("90210") in console to test.');
}
