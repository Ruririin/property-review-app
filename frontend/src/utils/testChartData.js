// Test the Best Places data generation to verify chart values
import bestPlacesService from '../services/bestPlacesService.js';

async function testBestPlacesChartData() {
  console.log('🧪 TESTING BEST PLACES CHART DATA GENERATION');
  console.log('==============================================');
  
  // Test with ZIP 90041 (the one from your project)
  const zipCode = '90041';
  
  try {
    console.log(`\n📍 Testing ZIP: ${zipCode}`);
    const data = await bestPlacesService.fetchCrimeData(zipCode);
    
    console.log('\n📊 CRIME INDEX VALUES:');
    console.log(`   Violent Crime Index: ${data.violent_crime}`);
    console.log(`   Property Crime Index: ${data.property_crime}`);
    console.log(`   US Avg Violent: ${data.violent_crime_us_avg}`);
    console.log(`   US Avg Property: ${data.property_crime_us_avg}`);
    
    if (data.chart_data && data.chart_data.length > 0) {
      const violentChart = data.chart_data.find(c => c.type === 'violent_crime');
      const propertyChart = data.chart_data.find(c => c.type === 'property_crime');
      
      console.log('\n📈 CHART DATA ANALYSIS:');
      
      if (violentChart) {
        const violentValues = violentChart.values;
        console.log('\n🔴 VIOLENT CRIME CHART:');
        console.log(`   Years: ${violentChart.labels[0]} - ${violentChart.labels[violentChart.labels.length - 1]}`);
        console.log(`   Data Points: ${violentValues.length}`);
        console.log(`   Current Value (2024): ${violentValues[violentValues.length - 1]} per 100k`);
        console.log(`   Peak Value: ${Math.max(...violentValues)} per 100k`);
        console.log(`   Lowest Value: ${Math.min(...violentValues)} per 100k`);
        console.log(`   Recent 5 years: [${violentValues.slice(-5).join(', ')}]`);
      }
      
      if (propertyChart) {
        const propertyValues = propertyChart.values;
        console.log('\n🔵 PROPERTY CRIME CHART:');
        console.log(`   Years: ${propertyChart.labels[0]} - ${propertyChart.labels[propertyChart.labels.length - 1]}`);
        console.log(`   Data Points: ${propertyValues.length}`);
        console.log(`   Current Value (2024): ${propertyValues[propertyValues.length - 1]} per 100k`);
        console.log(`   Peak Value: ${Math.max(...propertyValues)} per 100k`);
        console.log(`   Lowest Value: ${Math.min(...propertyValues)} per 100k`);
        console.log(`   Recent 5 years: [${propertyValues.slice(-5).join(', ')}]`);
      }
      
      console.log('\n🎯 EXPECTED VALUES (from Best Places image):');
      console.log('   Violent Crime: Should be around 150-200 per 100k');
      console.log('   Property Crime: Should be around 2500-3000 per 100k');
      console.log('   Chart should show declining trend from 2008-2020');
      
      // Validation
      const currentViolent = violentChart ? violentChart.values[violentChart.values.length - 1] : 0;
      const currentProperty = propertyChart ? propertyChart.values[propertyChart.values.length - 1] : 0;
      
      console.log('\n✅ VALIDATION:');
      console.log(`   Violent in expected range (150-300): ${currentViolent >= 150 && currentViolent <= 300 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Property in expected range (2000-3500): ${currentProperty >= 2000 && currentProperty <= 3500 ? '✅ YES' : '❌ NO'}`);
      
      // Show sample chart data for debugging
      if (violentChart && propertyChart) {
        console.log('\n📋 SAMPLE CHART DATA FOR DEBUGGING:');
        console.log('Year | Violent | Property');
        console.log('-----|---------|----------');
        for (let i = 0; i < violentChart.labels.length; i += 3) { // Show every 3rd year
          const year = violentChart.labels[i];
          const violent = violentChart.values[i];
          const property = propertyChart.values[i];
          console.log(`${year} | ${violent.toString().padStart(7)} | ${property.toString().padStart(8)}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing chart data:', error);
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.testBestPlacesChartData = testBestPlacesChartData;
  console.log('💡 Run testBestPlacesChartData() in console to test chart data generation');
}

export default testBestPlacesChartData;
