/**
 * API Services - Backward compatibility layer
 * Re-exports from infrastructure layer
 */

import { productRepository } from '@/infrastructure/repositories/ProductRepository';
import { orderRepository } from '@/infrastructure/repositories/OrderRepository';
import { categoryRepository } from '@/infrastructure/repositories/CategoryRepository';
import { settingsRepository } from '@/infrastructure/repositories/SettingsRepository';
import { uploadService } from '@/infrastructure/services/UploadService';
import { chatService } from '@/infrastructure/services/ChatService';
import ApiClient from '@/infrastructure/api/ApiClient';

// Legacy API exports for backward compatibility
export const productApi = {
  getProducts: () => productRepository.getAll(),
  getProductById: (id: string) => productRepository.getById(id),
  createProduct: (product: Parameters<typeof productRepository.create>[0]) => productRepository.create(product),
  updateProduct: (id: string, updates: Parameters<typeof productRepository.update>[1]) => productRepository.update(id, updates),
  deleteProduct: (id: string) => productRepository.delete(id),
};

export const orderApi = {
  getOrders: () => orderRepository.getAll(),
  getOrderById: (id: string) => orderRepository.getById(id),
  createOrder: (order: Parameters<typeof orderRepository.create>[0]) => orderRepository.create(order),
  updateOrder: (id: string, updates: Parameters<typeof orderRepository.update>[1]) => orderRepository.update(id, updates),
  deleteOrder: (id: string) => orderRepository.delete(id),
};

export const categoryApi = {
  getCategories: () => categoryRepository.getAll(),
  createCategory: (category: Parameters<typeof categoryRepository.create>[0]) => categoryRepository.create(category),
  deleteCategory: (id: string) => categoryRepository.delete(id),
};

export const settingsApi = {
  getSettings: () => settingsRepository.get(),
  updateSettings: (settings: Record<string, unknown>) => settingsRepository.update(settings),
};

export const chatApi = {
  getConversations: () => chatService.getConversations(),
  getConversation: (id: number) => chatService.getConversation(id),
  sendMessage: (conversationId: number, message: string) => chatService.sendMessage(conversationId, message),
  updateConversation: (id: number, updates: Record<string, unknown>) => chatService.updateConversation(id, updates),
  getQuickReplies: () => chatService.getQuickReplies(),
  createQuickReply: (data: Record<string, string>) => chatService.createQuickReply(data),
  getStats: () => chatService.getStats(),
};

export const uploadApi = {
  uploadImage: (imageUri: string, productId?: string, productName?: string) => 
    uploadService.uploadImage(imageUri, productId, productName),
  uploadImages: (imageUris: string[], productId?: string, productName?: string) => 
    uploadService.uploadImages(imageUris, productId, productName),
  uploadVideo: (videoUri: string, productId?: string, productName?: string) => 
    uploadService.uploadVideo(videoUri, productId, productName),
  uploadProductImage: async (productId: string, imageUri: string) => 
    uploadService.uploadImage(imageUri, productId),
  getStats: () => uploadService.getStats(),
  getEmbeddingStats: () => uploadService.getEmbeddingStats(),
  reindexAll: () => uploadService.reindexAll(),
};

export default ApiClient.getInstance();
