/**
 * Order Repository Interface
 * Dependency Inversion: High-level modules depend on abstractions
 * Interface Segregation: Focused interface for order operations
 */

import { Order } from '../entities/Order';

export interface IOrderRepository {
  getAll(): Promise<Order[]>;
  getById(id: string): Promise<Order>;
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: string, updates: Partial<Order>): Promise<Order>;
  delete(id: string): Promise<void>;
}
