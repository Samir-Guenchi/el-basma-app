import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { Product, Order, CustomCategory } from '@/types';

// ============================================
// API CONFIGURATION
// ============================================
// PRODUCTION URL (Railway)
const PRODUCTION_API_URL = 'https://web-production-1c70.up.railway.app/api';

// For DEVELOPMENT: Your local computer IP
const DEV_ANDROID_URL = 'http://192.168.43.220:3001/api';
const DEV_IOS_URL = 'http://localhost:3001/api';

// Set to true for production, false for local development
const USE_PRODUCTION = true;

// Automatically detect the correct URL
const getApiUrl = () => {
  // Use production URL if enabled
  if (USE_PRODUCTION && PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }
  
  // Use environment variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development defaults
  if (Platform.OS === 'android') {
    return DEV_ANDROID_URL;
  }
  
  return DEV_IOS_URL;
};

const API_BASE_URL = getApiUrl();
console.log('🌐 API URL:', API_BASE_URL);

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// PRODUCT API
// ============================================

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const response = await apiClient.post('/products', product);
    return response.data;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, updates);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};

// ============================================
// ORDER API
// ============================================

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const response = await apiClient.post('/orders', order);
    return response.data;
  },

  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    const response = await apiClient.put(`/orders/${id}`, updates);
    return response.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },
};

// ============================================
// CATEGORY API
// ============================================

export const categoryApi = {
  getCategories: async (): Promise<CustomCategory[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  createCategory: async (category: Omit<CustomCategory, 'id'>): Promise<CustomCategory> => {
    const response = await apiClient.post('/categories', category);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

// ============================================
// SETTINGS API
// ============================================

export const settingsApi = {
  getSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Record<string, unknown>) => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },
};

// ============================================
// CHAT API
// ============================================

export const chatApi = {
  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  getConversation: async (id: number) => {
    const response = await apiClient.get(`/chat/conversations/${id}`);
    return response.data;
  },

  sendMessage: async (conversationId: number, message: string) => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/send`, { message });
    return response.data;
  },

  updateConversation: async (id: number, updates: Record<string, unknown>) => {
    const response = await apiClient.put(`/chat/conversations/${id}`, updates);
    return response.data;
  },

  getQuickReplies: async () => {
    const response = await apiClient.get('/chat/quick-replies');
    return response.data;
  },

  createQuickReply: async (data: Record<string, string>) => {
    const response = await apiClient.post('/chat/quick-replies', data);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/chat/stats');
    return response.data;
  },
};

// ============================================
// UPLOAD API - Image upload with embedding creation
// ============================================

export const uploadApi = {
  /**
   * Upload a single image and optionally create embedding
   * @param imageUri - Local file URI (file://...)
   * @param productId - Optional product ID to associate embedding
   * @param productName - Optional product name for embedding
   */
  uploadImage: async (imageUri: string, productId?: string, productName?: string) => {
    const formData = new FormData();
    
    // Get filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append image file
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);
    
    if (productId) formData.append('productId', productId);
    if (productName) formData.append('productName', productName);
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.json();
  },

  /**
   * Upload multiple images
   */
  uploadImages: async (imageUris: string[], productId?: string, productName?: string) => {
    const formData = new FormData();
    
    imageUris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('images', {
        uri,
        name: filename,
        type,
      } as unknown as Blob);
    });
    
    if (productId) formData.append('productId', productId);
    if (productName) formData.append('productName', productName);
    
    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.json();
  },

  /**
   * Upload image for existing product and create embedding
   */
  uploadProductImage: async (productId: string, imageUri: string) => {
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);
    
    const response = await fetch(`${API_BASE_URL}/upload/product/${productId}/image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.json();
  },

  /**
   * Get upload stats
   */
  getStats: async () => {
    const response = await apiClient.get('/upload/stats');
    return response.data;
  },

  /**
   * Get embedding stats
   */
  getEmbeddingStats: async () => {
    const response = await apiClient.get('/products/embedding-stats');
    return response.data;
  },

  /**
   * Reindex all product images
   */
  reindexAll: async () => {
    const response = await apiClient.post('/products/reindex-all-images');
    return response.data;
  },
};

export default apiClient;
