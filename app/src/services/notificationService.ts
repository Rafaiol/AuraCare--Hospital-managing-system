import api from './api';
import type { ApiResponse, PaginationParams } from '@/types';

export interface Notification {
  id: number;
  userId: number | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (params?: PaginationParams & { unreadOnly?: boolean }): Promise<{ notifications: Notification[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications', {
      params,
    });
    return {
      notifications: response.data.data,
      pagination: response.data.pagination,
    };
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
