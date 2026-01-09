/**
 * Chat Service
 * Single Responsibility: Chat and conversation operations
 */

import ApiClient from '../api/ApiClient';

export class ChatService {
  private api = ApiClient.getInstance();

  async getConversations() {
    const response = await this.api.get('/chat/conversations');
    return response.data;
  }

  async getConversation(id: number) {
    const response = await this.api.get(`/chat/conversations/${id}`);
    return response.data;
  }

  async sendMessage(conversationId: number, message: string) {
    const response = await this.api.post(`/chat/conversations/${conversationId}/send`, { message });
    return response.data;
  }

  async updateConversation(id: number, updates: Record<string, unknown>) {
    const response = await this.api.put(`/chat/conversations/${id}`, updates);
    return response.data;
  }

  async getQuickReplies() {
    const response = await this.api.get('/chat/quick-replies');
    return response.data;
  }

  async createQuickReply(data: Record<string, string>) {
    const response = await this.api.post('/chat/quick-replies', data);
    return response.data;
  }

  async getStats() {
    const response = await this.api.get('/chat/stats');
    return response.data;
  }
}

export const chatService = new ChatService();
