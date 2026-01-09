/**
 * Product Repository Interface
 * Dependency Inversion: High-level modules depend on abstractions
 * Interface Segregation: Focused interface for product operations
 */

import { Product } from '../entities/Product';

export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}
