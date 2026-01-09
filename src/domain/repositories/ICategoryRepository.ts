/**
 * Category Repository Interface
 * Dependency Inversion: High-level modules depend on abstractions
 * Interface Segregation: Focused interface for category operations
 */

import { CustomCategory } from '../entities/Product';

export interface ICategoryRepository {
  getAll(): Promise<CustomCategory[]>;
  create(category: Omit<CustomCategory, 'id'>): Promise<CustomCategory>;
  delete(id: string): Promise<void>;
}
