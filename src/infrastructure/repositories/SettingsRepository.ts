/**
 * Settings Repository Implementation
 * Implements ISettingsRepository interface
 * Single Responsibility: Settings data access operations
 */

import { ISettingsRepository } from '@/domain/repositories';
import ApiClient from '../api/ApiClient';

export class SettingsRepository implements ISettingsRepository {
  private api = ApiClient.getInstance();

  async get(): Promise<Record<string, unknown>> {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async update(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.api.put('/settings', settings);
    return response.data;
  }
}

export const settingsRepository = new SettingsRepository();
