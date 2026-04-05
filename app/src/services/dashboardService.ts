import api from './api';
import type { ApiResponse, DashboardStats, ChartData, DoctorPerformance, Appointment } from '@/types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },

  getAppointmentsChart: async (year?: number): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/appointments-chart', {
      params: { year },
    });
    return response.data.data;
  },

  getRevenueChart: async (year?: number): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/revenue-chart', {
      params: { year },
    });
    return response.data.data;
  },

  getPatientsByDepartment: async (): Promise<{ department: string; count: number }[]> => {
    const response = await api.get<ApiResponse<{ department: string; count: number }[]>>(
      '/dashboard/patients-by-department'
    );
    return response.data.data;
  },

  getDoctorPerformance: async (limit?: number): Promise<DoctorPerformance[]> => {
    const response = await api.get<ApiResponse<DoctorPerformance[]>>('/dashboard/doctor-performance', {
      params: { limit },
    });
    return response.data.data;
  },

  getTodayAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get<ApiResponse<Appointment[]>>('/dashboard/today-appointments');
    return response.data.data;
  },

  getRecentActivities: async (): Promise<{ type: string; description: string; time: string; icon: string }[]> => {
    const response = await api.get<ApiResponse<{ type: string; description: string; time: string; icon: string }[]>>(
      '/dashboard/recent-activities'
    );
    return response.data.data;
  },
};
