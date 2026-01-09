/**
 * API Client
 * Single Responsibility: HTTP client configuration and base operations
 */

import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { ApiConfig } from './config';

class ApiClient {
  private static instance: AxiosInstance | null = null;

  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: ApiConfig.getBaseUrl(),
        timeout: ApiConfig.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    return this.instance;
  }

  static getBaseUrl(): string {
    return ApiConfig.getBaseUrl();
  }
}

export default ApiClient;
