/**
 * Simple encryption utility for localStorage data
 * Uses AES-256-GCM encryption via Web Crypto API
 *
 * NOTE: This provides basic encryption. For highly sensitive data,
 * consider server-side encryption instead.
 */

class StorageEncryption {
  constructor() {
    // Generate or retrieve encryption key from sessionStorage
    // Key is lost when browser closes (not persisted)
    this.keyPromise = this.getOrCreateKey();
  }

  /**
   * Generate a new encryption key or retrieve existing one
   */
  async getOrCreateKey() {
    try {
      // Check if key exists in sessionStorage
      const storedKey = sessionStorage.getItem('_ek');

      if (storedKey) {
        // Import existing key
        const keyData = JSON.parse(atob(storedKey));
        return await window.crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      }

      // Generate new key
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Export and store key
      const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
      sessionStorage.setItem('_ek', btoa(JSON.stringify(exportedKey)));

      return key;
    } catch (error) {
      console.warn('Encryption not available, using plaintext storage:', error);
      return null;
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(plaintext) {
    try {
      const key = await this.keyPromise;
      if (!key) return plaintext; // Fallback to plaintext if encryption fails

      // Convert string to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Generate random IV (initialization vector)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, using plaintext:', error);
      return plaintext;
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(ciphertext) {
    try {
      const key = await this.keyPromise;
      if (!key) return ciphertext; // Fallback to plaintext if decryption fails

      // Convert from base64
      const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Convert bytes to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, returning as-is:', error);
      return ciphertext;
    }
  }

  /**
   * Store encrypted data in localStorage
   */
  async setItem(key, value) {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = await this.encrypt(jsonString);
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      // Fallback to unencrypted storage
      localStorage.setItem(key, JSON.stringify(value));
      return false;
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  async getItem(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Failed to decrypt data, trying plaintext parse:', error);
      // Fallback: try parsing as plaintext (for backward compatibility)
      try {
        const plaintext = localStorage.getItem(key);
        return JSON.parse(plaintext);
      } catch (parseError) {
        console.error('Failed to parse stored data:', parseError);
        return null;
      }
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all localStorage
   */
  clear() {
    localStorage.clear();
  }
}

// Create singleton instance
const secureStorage = new StorageEncryption();

export default secureStorage;
