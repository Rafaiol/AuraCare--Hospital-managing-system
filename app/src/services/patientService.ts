import api from './api';
import type { ApiResponse, Patient, PaginationParams } from '@/types';

interface PatientFilter extends PaginationParams {
  search?: string;
  status?: string;
  doctorId?: string;
}

interface CreatePatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  chronicConditions?: string;
  assignedDoctorId?: number;
}

interface MedicalHistoryData {
  visitDate: string;
  doctorId: number;
  diagnosis?: string;
  symptoms?: string;
  prescription?: string;
  notes?: string;
  attachments?: string[];
  followUpDate?: string;
}

export const patientService = {
  getPatients: async (filters: PatientFilter): Promise<{ patients: Patient[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Patient[]>>('/patients', {
      params: filters,
    });
    return {
      patients: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getPatientById: async (id: number): Promise<Patient> => {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data.data;
  },

  createPatient: async (data: CreatePatientData): Promise<{ patientId: number; patientCode: string }> => {
    const response = await api.post<ApiResponse<{ patientId: number; patientCode: string }>>('/patients', data);
    return response.data.data;
  },

  updatePatient: async (id: number, data: Partial<CreatePatientData>): Promise<void> => {
    await api.put(`/patients/${id}`, data);
  },

  deletePatient: async (id: number): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  getMedicalHistory: async (patientId: number, params?: PaginationParams): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/patients/${patientId}/medical-history`, {
      params,
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  addMedicalHistory: async (patientId: number, data: MedicalHistoryData): Promise<{ historyId: number }> => {
    const response = await api.post<ApiResponse<{ historyId: number }>>(
      `/patients/${patientId}/medical-history`,
      data
    );
    return response.data.data;
  },

  getPatientAppointments: async (patientId: number, params?: PaginationParams): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/patients/${patientId}/appointments`, {
      params,
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
