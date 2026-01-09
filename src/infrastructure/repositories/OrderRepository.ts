/**
 * Order Repository Implementation
 * Implements IOrderRepository interface
 * Single Responsibility: Order data access operations
 */

import { IOrderRepository } from '@/domain/repositories';
import { Order } from '@/domain/entities';
import ApiClient from '../api/ApiClient';

export class OrderRepository implements IOrderRepository {
  private api = ApiClient.getInstance();

  async getAll(): Promise<Order[]> {
    const response = await this.api.get('/orders');
    return response.data;
  }

  async getById(id: string): Promise<Order> {
    const response = await this.api.get(`/orders/${id}`);
    return response.data;
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const response = await this.api.post('/orders', order);
    return response.data;
  }

  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const response = await this.api.put(`/orders/${id}`, updates);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/orders/${id}`);
  }
}

export const orderRepository = new OrderRepository();
