/**
 * Demo ISO Code Service - Safe mock implementation
 * Provides sample ISO codes without external API calls
 */

import { DEMO_DATA, demoUtils } from '../config/demoConfig.js';

class DemoIsoCodeService {
  constructor() {
    this.isoCodes = DEMO_DATA.SAMPLE_ISO_CODES;
    this.isLoaded = true; // Always loaded in demo mode
  }

  // Mock loadIsoCodes function
  loadIsoCodes() {
    console.log('🎭 Demo: ISO codes loaded (mock data)');
    return Promise.resolve(this.isoCodes);
  }

  // Mock findBestMatch function
  findBestMatch(searchText) {
    if (!searchText || searchText.length < 2) return null;
    
    const normalizedSearch = searchText.toLowerCase();
    
    // Simple matching against demo data
    const matches = this.isoCodes.filter(iso => 
      iso.description.toLowerCase().includes(normalizedSearch) ||
      iso.full_text.toLowerCase().includes(normalizedSearch)
    );
    
    console.log(`🎭 Demo: Found ${matches.length} ISO matches for "${searchText}"`);
    return matches.length > 0 ? matches[0] : null;
  }

  // Mock findSimilarMatches function
  findSimilarMatches(searchText) {
    if (!searchText || searchText.length < 2) return [];
    
    const normalizedSearch = searchText.toLowerCase();
    
    // Find matches in description or full text
    const matches = this.isoCodes.filter(iso => 
      iso.description.toLowerCase().includes(normalizedSearch) ||
      iso.full_text.toLowerCase().includes(normalizedSearch) ||
      normalizedSearch.includes(iso.description.toLowerCase().split(' ')[0]) // First word matching
    );
    
    // Add some fuzzy matching for common business types
    const businessTypeMatches = this.getBusinessTypeMatches(normalizedSearch);
    
    const allMatches = [...matches, ...businessTypeMatches]
      .filter((iso, index, arr) => 
        // Remove duplicates based on code
        arr.findIndex(item => item.code === iso.code) === index
      )
      .slice(0, 5); // Limit to 5 matches for demo
    
    console.log(`🎭 Demo: Found ${allMatches.length} similar ISO matches for "${searchText}"`);
    return allMatches;
  }

  // Helper method for business type matching
  getBusinessTypeMatches(searchText) {
    const businessKeywords = {
      'restaurant': [{ code: '9079', description: 'Restaurant - Fast Food', full_text: '9079 - Restaurant - Fast Food' }],
      'office': [{ code: '8810', description: 'Clerical Office Occupancy', full_text: '8810 - Clerical Office Occupancy' }],
      'manufacturing': [{ code: '3681', description: 'Manufacturing - Light Industrial', full_text: '3681 - Manufacturing - Light Industrial' }],
      'retail': [{ code: '5022', description: 'Retail Store - General Merchandise', full_text: '5022 - Retail Store - General Merchandise' }],
      'food': [{ code: '9079', description: 'Restaurant - Fast Food', full_text: '9079 - Restaurant - Fast Food' }],
      'store': [{ code: '5022', description: 'Retail Store - General Merchandise', full_text: '5022 - Retail Store - General Merchandise' }]
    };
    
    const matches = [];
    for (const [keyword, isos] of Object.entries(businessKeywords)) {
      if (searchText.includes(keyword)) {
        matches.push(...isos);
      }
    }
    
    return matches;
  }

  // Mock method to check if ISO codes are loaded
  isLoaded() {
    return true;
  }

  // Get all available ISO codes for demo
  getAllIsoCodes() {
    return [...this.isoCodes];
  }

  // Add a new ISO code to demo data (for testing purposes)
  addDemoIsoCode(code, description) {
    const newIso = {
      code: code,
      description: description,
      full_text: `${code} - ${description}`
    };
    this.isoCodes.push(newIso);
    console.log('🎭 Demo: Added ISO code', newIso);
    return newIso;
  }
}

// Create singleton instance
const demoIsoCodeService = new DemoIsoCodeService();

// Export the same interface as the real service
export const loadIsoCodes = () => demoIsoCodeService.loadIsoCodes();
export const findBestMatch = (searchText) => demoIsoCodeService.findBestMatch(searchText);
export const findSimilarMatches = (searchText) => demoIsoCodeService.findSimilarMatches(searchText);

export default demoIsoCodeService;