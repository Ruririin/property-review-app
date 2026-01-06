// Service to fetch LRO form data and integrate with property review
const API_BASE_URL = 'http://localhost:8000/api';

class LRODataService {
  // Search for LRO forms
  async searchForms(searchParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchParams.app_name) queryParams.append('app_name', searchParams.app_name);
      if (searchParams.location) queryParams.append('location', searchParams.location);
      if (searchParams.operations) queryParams.append('operations', searchParams.operations);
      if (searchParams.web_address) queryParams.append('web_address', searchParams.web_address);
      
      const response = await fetch(`${API_BASE_URL}/forms/search/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching LRO forms:', error);
      throw error;
    }
  }

  // Get all LRO forms
  async getAllForms() {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching LRO forms:', error);
      throw error;
    }
  }

  // Get formatted form data for property review
  async getFormDataForPropertyReview(formId) {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/for-property-review/?id=${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching formatted form data:', error);
      throw error;
    }
  }

  // Get specific form by ID
  async getFormById(formId) {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching form by ID:', error);
      throw error;
    }
  }
}

export default new LRODataService();