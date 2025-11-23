// ImgBB Image Upload Service
// This service handles image uploads to ImgBB and returns the URL

class ImgBBService {
  constructor() {
    this.apiKey = '26ec829d181576079e5fd46e958b587d';
    this.baseUrl = 'https://api.imgbb.com/1/upload';
  }

  /**
   * Upload image to ImgBB
   * @param {string} imageUri - Local image URI
   * @param {string} imageName - Optional image name
   * @returns {Promise<string>} - ImgBB image URL
   */
  async uploadImage(imageUri, imageName = null) {
    try {
      // Create form data
      const formData = new FormData();
      
      // Generate a unique name if not provided
      const name = imageName || `agrocure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add image file to form data
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${name}.jpg`,
      });
      
      // Add API key
      formData.append('key', this.apiKey);
      
      // Optional: Set expiration (in seconds, max 15552000 for free plan)
      // formData.append('expiration', '604800'); // 7 days
      
      console.log('Uploading image to ImgBB...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const responseData = await response.json();
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error?.message || 'Failed to upload image to ImgBB');
      }
      
      const imageUrl = responseData.data.url;
      console.log('Image uploaded successfully to ImgBB:', imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload image with retry mechanism
   * @param {string} imageUri - Local image URI
   * @param {string} imageName - Optional image name
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<string>} - ImgBB image URL
   */
  async uploadImageWithRetry(imageUri, imageName = null, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadImage(imageUri, imageName);
      } catch (error) {
        lastError = error;
        console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate image before upload
   * @param {string} imageUri - Local image URI
   * @returns {Promise<boolean>} - Whether image is valid
   */
  async validateImage(imageUri) {
    try {
      // Check if image URI exists and is accessible
      const response = await fetch(imageUri, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image validation error:', error);
      return false;
    }
  }

  /**
   * Get upload limits and info
   * @returns {Object} - ImgBB service info
   */
  getServiceInfo() {
    return {
      maxFileSize: '32MB',
      supportedFormats: ['JPG', 'PNG', 'BMP', 'GIF', 'TIFF', 'WEBP'],
      maxRetentionFree: '6 months',
      provider: 'ImgBB',
    };
  }
}

// Export singleton instance
const imgbbService = new ImgBBService();
export default imgbbService;

export { ImgBBService };