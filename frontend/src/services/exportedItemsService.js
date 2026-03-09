// Service to manage exported PDF items (database-backed with localStorage fallback)

class ExportedItemsService {
  constructor() {
    this.baseURL = '/api';
    this.cachedItems = null;
  }

  // Get CSRF token from cookie
  getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Fetch exported items from backend
  async getExportedItems() {
    try {
      const csrfToken = this.getCookie('csrftoken');
      const response = await fetch(`${this.baseURL}/exported-pdfs/`, {
        headers: {
          'Accept': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`API Error ${response.status}`);
      const items = await response.json();
      this.cachedItems = items;
      return items;
    } catch (error) {
      console.error('Error loading exported items from backend:', error);
      // Return cached items if available
      return this.cachedItems || [];
    }
  }

  // Upload exported PDF to backend
  async addExportedItem({ pdfBlob, filename, project_name, project_id }) {
    try {
      const csrfToken = this.getCookie('csrftoken');
      const formData = new FormData();
      formData.append('pdf_file', pdfBlob, filename);
      formData.append('filename', filename);
      formData.append('project_name', project_name || 'Untitled Project');
      if (project_id) {
        formData.append('project_id', project_id);
      }

      const response = await fetch(`${this.baseURL}/exported-pdfs/upload/`, {
        method: 'POST',
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
          // Don't set Content-Type - browser sets it with boundary for FormData
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      // Invalidate cache so next load fetches fresh data
      this.cachedItems = null;
      return result;
    } catch (error) {
      console.error('Error uploading exported PDF:', error);
      throw error;
    }
  }

  // Delete an exported item
  async removeExportedItem(itemId) {
    try {
      const csrfToken = this.getCookie('csrftoken');
      const response = await fetch(`${this.baseURL}/exported-pdfs/${itemId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      this.cachedItems = null;
      return true;
    } catch (error) {
      console.error('Error removing exported item:', error);
      return false;
    }
  }

  // Alias for consistency with apiService naming
  async deleteExportedItem(itemId) {
    return this.removeExportedItem(itemId);
  }
}

export default new ExportedItemsService();
