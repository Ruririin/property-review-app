// Best Places Chart Analysis Tool
// This will help us understand the exact chart data structure

class BestPlacesAnalyzer {
  constructor() {
    this.baseUrl = 'https://www.bestplaces.net';
  }

  /**
   * Analyze Best Places URL structure and chart data
   */
  async analyzeBestPlacesChart(zipCode) {
    console.log('🔍 ANALYZING BEST PLACES CHART STRUCTURE');
    console.log('📍 ZIP Code:', zipCode);
    
    // Get location info first
    const location = await this.getLocationFromZip(zipCode);
    const bestPlacesUrl = `https://www.bestplaces.net/crime/zip-code/${location.state}/${location.city}/${zipCode}`;
    
    console.log('🌐 Best Places URL:', bestPlacesUrl);
    console.log('📍 Location:', location);
    
    // Try to access the page and analyze its structure
    await this.analyzePageStructure(bestPlacesUrl, zipCode);
    
    // Generate analysis of what we know about Best Places charts
    this.generateChartAnalysis();
    
    return {
      url: bestPlacesUrl,
      location: location,
      analysis: this.getKnownPatterns()
    };
  }

  /**
   * Get location from ZIP (simplified version)
   */
  async getLocationFromZip(zipCode) {
    // Known ZIP mappings for testing
    const zipMappings = {
      '90041': { city: 'los_angeles', state: 'california', displayName: 'Los Angeles, CA' },
      '90210': { city: 'beverly_hills', state: 'california', displayName: 'Beverly Hills, CA' },
      '94102': { city: 'san_francisco', state: 'california', displayName: 'San Francisco, CA' },
      '10001': { city: 'new_york', state: 'new_york', displayName: 'New York, NY' }
    };
    
    return zipMappings[zipCode] || { 
      city: 'unknown', 
      state: 'unknown', 
      displayName: `ZIP ${zipCode}` 
    };
  }

  /**
   * Analyze the page structure (this would need to be done manually since CORS blocks us)
   */
  async analyzePageStructure(url, zipCode) {
    console.log('\n📊 CHART STRUCTURE ANALYSIS:');
    console.log('Since we cannot directly scrape due to CORS, here\'s what we know:');
    
    // Based on the provided image, analyze the structure
    console.log('\n📈 From the provided Best Places image:');
    console.log('1. Violent Crime Chart:');
    console.log('   - Y-axis: "Crime Rate per 100,000 Pop"');
    console.log('   - Scale: 0 to 800');
    console.log('   - Values appear to be around 150-200 range');
    console.log('   - Time range: 2006-2024');
    console.log('   - Shows declining trend');
    
    console.log('\n2. Property Crime Chart:');
    console.log('   - Y-axis: "Crime Rate per 100,000 Pop"');
    console.log('   - Scale: 0 to 5.6k (5,600)');
    console.log('   - Values appear to be around 2,000-3,000 range');
    console.log('   - Same time range: 2006-2024');
    console.log('   - Shows declining trend');
    
    console.log('\n3. Legend shows:');
    console.log('   - Green dot: South Pasadena/California');
    console.log('   - Blue dot: USA');
    console.log('   - Location appears to be "South Pasadena"');
    
    // Try to extract patterns from the image data
    this.analyzeImagePatterns();
  }

  /**
   * Analyze patterns from the Best Places image
   */
  analyzeImagePatterns() {
    console.log('\n🔬 IMAGE PATTERN ANALYSIS:');
    
    // From the image, we can see:
    const violentCrimeObservations = {
      approximate_current_value: 180, // per 100k
      trend: 'declining',
      peak_around: 220, // around 2008-2010
      low_around: 160, // recent years
      scale_max: 800
    };
    
    const propertyCrimeObservations = {
      approximate_current_value: 2800, // per 100k
      trend: 'declining', 
      peak_around: 3200, // around 2008-2010
      low_around: 2500, // recent years
      scale_max: 5600
    };
    
    console.log('📊 Violent Crime Observations:', violentCrimeObservations);
    console.log('📊 Property Crime Observations:', propertyCrimeObservations);
    
    // Calculate potential conversion factors
    this.calculateConversionFactors(violentCrimeObservations, propertyCrimeObservations);
  }

  /**
   * Calculate conversion factors from Best Places index to chart values
   */
  calculateConversionFactors(violentObs, propertyObs) {
    console.log('\n🧮 CONVERSION FACTOR ANALYSIS:');
    
    // We know from Best Places that:
    // - National average violent crime index is 22.7
    // - National average property crime index is 35.4
    
    // From FBI data, national averages per 100k are approximately:
    // - Violent crime: ~380 per 100k
    // - Property crime: ~2,400 per 100k
    
    const nationalViolentPer100k = 380;
    const nationalPropertyPer100k = 2400;
    const nationalViolentIndex = 22.7;
    const nationalPropertyIndex = 35.4;
    
    const violentConversionFactor = nationalViolentPer100k / nationalViolentIndex;
    const propertyConversionFactor = nationalPropertyPer100k / nationalPropertyIndex;
    
    console.log('📐 Calculated conversion factors:');
    console.log(`   Violent: ${violentConversionFactor.toFixed(2)} (index * ${violentConversionFactor.toFixed(2)} = per 100k)`);
    console.log(`   Property: ${propertyConversionFactor.toFixed(2)} (index * ${propertyConversionFactor.toFixed(2)} = per 100k)`);
    
    // Test with ZIP 90041 data (index 31.9 violent, 39.0 property)
    const zip90041ViolentIndex = 31.9;
    const zip90041PropertyIndex = 39.0;
    
    const zip90041ViolentPer100k = zip90041ViolentIndex * violentConversionFactor;
    const zip90041PropertyPer100k = zip90041PropertyIndex * propertyConversionFactor;
    
    console.log('\n🧪 Testing with ZIP 90041:');
    console.log(`   Violent: ${zip90041ViolentIndex} index → ${zip90041ViolentPer100k.toFixed(0)} per 100k`);
    console.log(`   Property: ${zip90041PropertyIndex} index → ${zip90041PropertyPer100k.toFixed(0)} per 100k`);
    
    return {
      violentFactor: violentConversionFactor,
      propertyFactor: propertyConversionFactor
    };
  }

  /**
   * Generate comprehensive analysis
   */
  generateChartAnalysis() {
    console.log('\n📋 COMPREHENSIVE CHART ANALYSIS SUMMARY:');
    console.log('=====================================');
    
    console.log('\n1. CHART STRUCTURE:');
    console.log('   - Format: Line charts with time series data');
    console.log('   - X-axis: Years 2006-2024 (19 data points)');
    console.log('   - Y-axis: "Crime Rate per 100,000 Pop"');
    console.log('   - Two series: Local area + USA average');
    
    console.log('\n2. VALUE RANGES:');
    console.log('   - Violent Crime: 0-800 scale, typical values 100-400');
    console.log('   - Property Crime: 0-5600 scale, typical values 1500-4000');
    
    console.log('\n3. CONVERSION FORMULA:');
    console.log('   - Best Places Index → Per 100k Rate');
    console.log('   - Violent: index × 16.7 ≈ per 100k rate');
    console.log('   - Property: index × 67.8 ≈ per 100k rate');
    
    console.log('\n4. HISTORICAL PATTERNS:');
    console.log('   - Peak crime rates: 2008-2010 (recession period)');
    console.log('   - Steady decline: 2010-2020');
    console.log('   - Recent stabilization: 2020-2024');
  }

  /**
   * Get known patterns for implementation
   */
  getKnownPatterns() {
    return {
      conversionFactors: {
        violent: 16.7, // index to per-100k
        property: 67.8 // index to per-100k
      },
      chartRanges: {
        violent: { min: 0, max: 800 },
        property: { min: 0, max: 5600 }
      },
      timeRange: {
        start: 2006,
        end: 2024,
        totalYears: 19
      },
      historicalPattern: {
        peakYears: [2008, 2009, 2010],
        declineYears: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
        stabilizationYears: [2020, 2021, 2022, 2023, 2024]
      }
    };
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.BestPlacesAnalyzer = BestPlacesAnalyzer;
  window.analyzeBestPlaces = async (zipCode) => {
    const analyzer = new BestPlacesAnalyzer();
    return await analyzer.analyzeBestPlacesChart(zipCode || '90041');
  };
  
  console.log('💡 Run analyzeBestPlaces("90041") in console to analyze Best Places chart structure');
}

export default BestPlacesAnalyzer;
