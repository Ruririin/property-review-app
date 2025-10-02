// Test the new crime data service
import bestPlacesService from './bestPlacesService.js';

async function testCrimeData() {
  console.log('🧪 Testing crime data service...');
  
  // Test with known zip codes
  const testZips = ['90041', '90210', '94102'];
  
  for (const zip of testZips) {
    try {
      console.log(`\n📍 Testing ZIP: ${zip}`);
      const data = await bestPlacesService.fetchCrimeData(zip);
      
      console.log('📊 Crime Data:', {
        location: data.location,
        violent_crime: data.violent_crime,
        property_crime: data.property_crime,
        source: data.source,
        category: data.category,
        chart_data_points: data.chart_data ? data.chart_data.length : 0
      });
      
      // Test chart data structure
      if (data.chart_data && data.chart_data.length > 0) {
        const violentChart = data.chart_data.find(c => c.type === 'violent_crime');
        const propertyChart = data.chart_data.find(c => c.type === 'property_crime');
        
        console.log('📈 Chart data structure:', {
          violent_years: violentChart ? violentChart.labels.length : 0,
          violent_values: violentChart ? violentChart.values.length : 0,
          property_years: propertyChart ? propertyChart.labels.length : 0,
          property_values: propertyChart ? propertyChart.values.length : 0
        });
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${zip}:`, error);
    }
  }
}

// Only run test if this file is executed directly
if (typeof window !== 'undefined') {
  testCrimeData();
}

export default testCrimeData;
