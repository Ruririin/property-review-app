/**
 * Best Places Automation Service
 * Coordinates with backend automation to fetch Best Places charts
 * Frontend service that calls the Django API endpoint
 */

class BestPlacesAutomation {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
  }

  /**
   * Fetch crime charts for a given ZIP code via backend automation
   * @param {string} zipCode - The ZIP code to fetch data for
   * @param {string} location - Location string (city, state)
   * @returns {Promise<Object>} Chart data with images
   */
  async fetchCrimeCharts(zipCode, location = '') {
    try {
      console.log(`🔍 Requesting Best Places charts for ZIP: ${zipCode}`);
      
      const requestBody = {
        zip_code: zipCode,
        location: location || this.getDefaultLocation(zipCode)
      };

      const response = await fetch(`${this.baseURL}/best-places/crime-data/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Successfully received Best Places charts from backend');
        return {
          success: true,
          chart_images: this.formatChartData(data.data),
          source: data.data.source || 'bestplaces_backend_automation',
          url: data.data.url,
          extracted_at: data.data.fetched_at || new Date().toISOString()
        };
      } else {
        console.warn('⚠️ Backend returned unsuccessful response:', data);
        return {
          success: false,
          error: data.error || 'Unknown error from backend',
          chart_images: null
        };
      }
      
    } catch (error) {
      console.error('❌ Error fetching charts from backend:', error);
      return {
        success: false,
        error: error.message,
        chart_images: null
      };
    }
  }

  /**
   * Format chart data from backend response to expected frontend format
   */
  formatChartData(data) {
    const formatted = {};
    
    if (data.chart_images) {
      // Handle both violent_crime and property_crime charts
      if (data.chart_images.violent_crime) {
        formatted.violentCrimeChart = {
          dataUrl: data.chart_images.violent_crime.dataUrl || data.chart_images.violent_crime,
          type: 'violent_crime',
          method: 'backend_automation'
        };
      }
      
      if (data.chart_images.property_crime) {
        formatted.propertyCrimeChart = {
          dataUrl: data.chart_images.property_crime.dataUrl || data.chart_images.property_crime,
          type: 'property_crime',
          method: 'backend_automation'
        };
      }
    }
    
    return formatted;
  }

  /**
   * Get default location string for a ZIP code
   */
  getDefaultLocation(zipCode) {
    const zipToLocation = {
      '90041': 'Los Angeles, CA',
      '90210': 'Beverly Hills, CA',
      '91601': 'North Hollywood, CA',
      '92101': 'San Diego, CA',
      '94102': 'San Francisco, CA',
      '95126': 'San Jose, CA',
      '90405': 'Santa Monica, CA',
      '90291': 'Venice, CA'
    };
    
    return zipToLocation[zipCode] || 'Los Angeles, CA';
  }

  /**
   * Backward compatibility method - wraps fetchCrimeCharts
   */
  async extractAllCharts(zipCode, location) {
    return await this.fetchCrimeCharts(zipCode, location);
  }

  /**
   * No-op cleanup for compatibility
   */
  async cleanup() {
    // No cleanup needed for API-based service
    console.log('✅ Best Places automation service ready');
  }

  /**
   * No-op dispose for compatibility
   */
  async dispose() {
    // No disposal needed for API-based service
  }
}

// Create singleton instance
const bestPlacesAutomation = new BestPlacesAutomation();

export default bestPlacesAutomation;
