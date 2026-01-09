/**
 * Product Repository Implementation
 * Implements IProductRepository interface
 * Single Responsibility: Product data access operations
 */

import { IProductRepository } from '@/domain/repositories';
import { Product } from '@/domain/entities';
import ApiClient from '../api/ApiClient';

export class ProductRepository implements IProductRepository {
  private api = ApiClient.getInstance();

  async getAll(): Promise<Product[]> {
    const response = await this.api.get('/products');
    return response.data;
  }

  async getById(id: string): Promise<Product> {
    const response = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await this.api.post('/products', product);
    return response.data;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const response = await this.api.put(`/products/${id}`, updates);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }
}

export const productRepository = new ProductRepository();
