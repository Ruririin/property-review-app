// Service to manage exported PDF items
const EXPORTED_ITEMS_KEY = 'exported_pdf_items';

class ExportedItemsService {
  // Get all exported items from localStorage
  getExportedItems() {
    try {
      const items = localStorage.getItem(EXPORTED_ITEMS_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error loading exported items:', error);
      return [];
    }
  }

  // Add a new exported item
  addExportedItem(itemData) {
    try {
      const items = this.getExportedItems();
      const newItem = {
        id: Date.now(), // Simple ID generation
        filename: itemData.filename,
        project_name: itemData.project_name || 'Untitled Project',
        file_size: itemData.file_size || 0,
        export_date: new Date().toISOString(),
        file_path: itemData.file_path || itemData.filename,
        ...itemData
      };

      // Add to beginning of array (most recent first)
      items.unshift(newItem);

      // Keep only last 50 exports to prevent localStorage from growing too large
      if (items.length > 50) {
        items.splice(50);
      }

      localStorage.setItem(EXPORTED_ITEMS_KEY, JSON.stringify(items));
      return newItem;
    } catch (error) {
      console.error('Error saving exported item:', error);
      throw error;
    }
  }

  // Remove an exported item
  removeExportedItem(itemId) {
    try {
      const items = this.getExportedItems();
      const filteredItems = items.filter(item => item.id !== itemId);
      localStorage.setItem(EXPORTED_ITEMS_KEY, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('Error removing exported item:', error);
      return false;
    }
  }

  // Clear all exported items
  clearExportedItems() {
    try {
      localStorage.removeItem(EXPORTED_ITEMS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing exported items:', error);
      return false;
    }
  }

  // Get exported items count
  getExportedItemsCount() {
    return this.getExportedItems().length;
  }
}

export default new ExportedItemsService();