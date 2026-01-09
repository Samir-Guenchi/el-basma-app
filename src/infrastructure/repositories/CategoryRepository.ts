/**
 * Category Repository Implementation
 * Implements ICategoryRepository interface
 * Single Responsibility: Category data access operations
 */

import { ICategoryRepository } from '@/domain/repositories';
import { CustomCategory } from '@/domain/entities';
import ApiClient from '../api/ApiClient';

export class CategoryRepository implements ICategoryRepository {
  private api = ApiClient.getInstance();

  async getAll(): Promise<CustomCategory[]> {
    const response = await this.api.get('/categories');
    return response.data;
  }

  async create(category: Omit<CustomCategory, 'id'>): Promise<CustomCategory> {
    const response = await this.api.post('/categories', category);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }
}

export const categoryRepository = new CategoryRepository();
