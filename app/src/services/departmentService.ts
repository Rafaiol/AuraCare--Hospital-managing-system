import api from './api';
import type { ApiResponse, PaginationParams } from '@/types';

export interface Department {
  departmentId: number;
  name: string;
  code: string;
  description?: string;
  doctorCount?: number;
  createdAt?: string;
}

export const departmentService = {
  getDepartments: async (params?: PaginationParams): Promise<{ departments: Department[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Department[]>>('/departments', {
      params,
    });
    // The backend returns an array directly in data if no pagination is used, 
    // or if the ApiResponse wrapper is consistent, it's in response.data.data
    const departments = Array.isArray(response.data) ? response.data : response.data.data || [];
    
    return {
      departments,
      pagination: response.data.pagination || { total: departments.length, page: 1, limit: departments.length, totalPages: 1 },
    };
  },

  getDepartmentById: async (id: number): Promise<Department> => {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data.data;
  },
};
