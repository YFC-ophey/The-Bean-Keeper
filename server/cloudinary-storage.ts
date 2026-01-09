import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageService {
  /**
   * Generate a unique file ID for upload
   */
  async getUploadURL(): Promise<string> {
    const fileId = randomUUID();
    // Return endpoint that will handle the upload
    return `/api/cloudinary-upload/${fileId}`;
  }

  /**
   * Upload a file to Cloudinary and return the public URL
   * @param fileId - Unique identifier for this upload
   * @param buffer - File data as Buffer
   * @param contentType - MIME type of the file
   * @returns Promise resolving to the Cloudinary URL
   */
  async saveFile(fileId: string, buffer: Buffer, contentType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'coffee-beans', // Organize uploads in a folder
          public_id: fileId,
          resource_type: 'image',
          // Optimize images automatically
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, height: 1600, crop: 'limit' } // Max dimensions
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            // Return the secure URL
            resolve(result.secure_url);
          } else {
            reject(new Error('No result from Cloudinary upload'));
          }
        }
      );

      // Write buffer to the upload stream
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - The Cloudinary public ID (extracted from URL)
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✓ Deleted image from Cloudinary: ${publicId}`);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}

export const cloudinaryStorageService = new CloudinaryStorageService();
