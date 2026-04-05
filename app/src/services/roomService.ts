import api from './api';
import type { ApiResponse, Room, Bed } from '@/types';

interface RoomFilter {
  page?: number;
  limit?: number;
  roomType?: string;
  status?: string;
  departmentId?: string;
  floor?: string;
}

interface CreateRoomData {
  roomNumber: string;
  roomType: string;
  departmentId?: number;
  floor?: number;
  capacity?: number;
  rentPerDay?: number;
  facilities?: string[];
}

export const roomService = {
  getRooms: async (filters: RoomFilter): Promise<{ rooms: Room[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Room[]>>('/rooms', {
      params: filters,
    });
    return {
      rooms: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getRoomById: async (id: number): Promise<Room> => {
    const response = await api.get<ApiResponse<Room>>(`/rooms/${id}`);
    return response.data.data;
  },

  createRoom: async (data: CreateRoomData): Promise<{ roomId: number }> => {
    const response = await api.post<ApiResponse<{ roomId: number }>>('/rooms', data);
    return response.data.data;
  },

  updateRoom: async (id: number, data: Partial<CreateRoomData>): Promise<void> => {
    await api.put(`/rooms/${id}`, data);
  },

  deleteRoom: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },

  getBeds: async (filters?: { page?: number; limit?: number; roomId?: string; status?: string; bedType?: string }): Promise<{ beds: Bed[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Bed[]>>('/rooms/beds/all', {
      params: filters,
    });
    return {
      beds: response.data.data,
      pagination: response.data.pagination,
    };
  },

  assignBed: async (bedId: number, patientId: number, notes?: string): Promise<{ assignmentId: number }> => {
    const response = await api.post<ApiResponse<{ assignmentId: number }>>(
      `/rooms/beds/${bedId}/assign`,
      { patientId, notes }
    );
    return response.data.data;
  },

  dischargePatient: async (bedId: number, notes?: string): Promise<void> => {
    await api.post(`/rooms/beds/${bedId}/discharge`, { notes });
  },

  getRoomStatistics: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/rooms/statistics');
    return response.data.data;
  },
};
