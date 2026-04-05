import api from './api';
import type { ApiResponse, Doctor, PaginationParams } from '@/types';

interface DoctorFilter extends PaginationParams {
  search?: string;
  specialization?: string;
  departmentId?: string;
  status?: string;
}

interface CreateDoctorData {
  userId: number;
  employeeId: string;
  specialization: string;
  departmentId?: number;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  licenseNumber: string;
  joiningDate: string;
  bio?: string;
}

interface ScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  maxPatients?: number;
  isAvailable?: boolean;
}

export const doctorService = {
  getDoctors: async (filters: DoctorFilter): Promise<{ doctors: Doctor[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Doctor[]>>('/doctors', {
      params: filters,
    });
    return {
      doctors: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getDoctorById: async (id: number): Promise<Doctor> => {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data;
  },

  createDoctor: async (data: CreateDoctorData): Promise<{ doctorId: number }> => {
    const response = await api.post<ApiResponse<{ doctorId: number }>>('/doctors', data);
    return response.data.data;
  },

  updateDoctor: async (id: number, data: Partial<CreateDoctorData>): Promise<void> => {
    await api.put(`/doctors/${id}`, data);
  },

  deleteDoctor: async (id: number): Promise<void> => {
    await api.delete(`/doctors/${id}`);
  },

  getSpecializations: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/doctors/specializations');
    return response.data.data;
  },

  getDoctorPatients: async (doctorId: number, params?: PaginationParams): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/doctors/${doctorId}/patients`, {
      params,
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getDoctorSchedule: async (doctorId: number): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/doctors/${doctorId}/schedule`);
    return response.data.data;
  },

  updateDoctorSchedule: async (doctorId: number, schedules: ScheduleData[]): Promise<void> => {
    await api.post(`/doctors/${doctorId}/schedule`, { schedules });
  },

  getAvailableSlots: async (doctorId: number, date: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(`/doctors/${doctorId}/available-slots`, {
      params: { date },
    });
    return response.data.data;
  },
};
