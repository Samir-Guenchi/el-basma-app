/**
 * Upload Service
 * Single Responsibility: File upload operations
 */

import { Platform } from 'react-native';
import { ApiConfig } from '../api/config';
import ApiClient from '../api/ApiClient';

export class UploadService {
  private baseUrl = ApiConfig.getBaseUrl();

  async uploadImage(imageUri: string, productId?: string, productName?: string) {
    const formData = new FormData();

    if (Platform.OS === 'web' && imageUri.startsWith('blob:')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const filename = `image_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
      formData.append('image', blob, filename);
    } else {
      const filename = imageUri.split('/').pop()?.split('?')[0] || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri: imageUri, name: filename, type } as unknown as Blob);
    }

    if (productId) formData.append('productId', productId);
    if (productName) formData.append('productName', productName);

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async uploadImages(imageUris: string[], productId?: string, productName?: string) {
    const formData = new FormData();

    imageUris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('images', { uri, name: filename, type } as unknown as Blob);
    });

    if (productId) formData.append('productId', productId);
    if (productName) formData.append('productName', productName);

    const response = await fetch(`${this.baseUrl}/upload/images`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async uploadVideo(videoUri: string, productId?: string, productName?: string) {
    const formData = new FormData();

    if (Platform.OS === 'web' && videoUri.startsWith('blob:')) {
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'mp4';
      const filename = `video_${Date.now()}.${ext}`;
      formData.append('video', blob, filename);
    } else {
      const filename = videoUri.split('/').pop()?.split('?')[0] || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';
      formData.append('video', { uri: videoUri, name: filename, type } as unknown as Blob);
    }

    if (productId) formData.append('productId', productId);
    if (productName) formData.append('productName', productName);

    const response = await fetch(`${this.baseUrl}/upload/video`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async getStats() {
    const api = ApiClient.getInstance();
    const response = await api.get('/upload/stats');
    return response.data;
  }

  async getEmbeddingStats() {
    const api = ApiClient.getInstance();
    const response = await api.get('/products/embedding-stats');
    return response.data;
  }

  async reindexAll() {
    const api = ApiClient.getInstance();
    const response = await api.post('/products/reindex-all-images');
    return response.data;
  }
}

export const uploadService = new UploadService();
