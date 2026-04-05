import api from './api';
import type { ApiResponse, Appointment, PaginationParams } from '@/types';

interface AppointmentFilter extends PaginationParams {
  patientId?: string;
  doctorId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateAppointmentData {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  type?: string;
  reason?: string;
  duration?: number;
}

export const appointmentService = {
  getAppointments: async (filters: AppointmentFilter): Promise<{ appointments: Appointment[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Appointment[]>>('/appointments', {
      params: filters,
    });
    return {
      appointments: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getAppointmentById: async (id: number): Promise<Appointment> => {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data.data;
  },

  createAppointment: async (data: CreateAppointmentData): Promise<{ appointmentId: number; appointmentCode: string }> => {
    const response = await api.post<ApiResponse<{ appointmentId: number; appointmentCode: string }>>(
      '/appointments',
      data
    );
    return response.data.data;
  },

  updateAppointment: async (id: number, data: Partial<CreateAppointmentData>): Promise<void> => {
    await api.put(`/appointments/${id}`, data);
  },

  deleteAppointment: async (id: number): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  cancelAppointment: async (id: number, cancellationReason?: string): Promise<void> => {
    await api.put(`/appointments/${id}/cancel`, { cancellationReason });
  },

  completeAppointment: async (id: number): Promise<void> => {
    await api.put(`/appointments/${id}/complete`);
  },

  getCalendarData: async (params: { doctorId?: string; month: string; year: string }): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/appointments/calendar', {
      params,
    });
    return response.data.data;
  },

  getAppointmentStatistics: async (params?: { dateFrom?: string; dateTo?: string }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/appointments/statistics', {
      params,
    });
    return response.data.data;
  },
};
