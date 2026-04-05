import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Doctor } from '@/types';

interface DoctorState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  specializations: string[];
  totalDoctors: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  selectedDoctor: null,
  specializations: [],
  totalDoctors: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
};

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctors: (
      state,
      action: PayloadAction<{
        doctors: Doctor[];
        total: number;
        page: number;
        totalPages: number;
      }>
    ) => {
      state.doctors = action.payload.doctors;
      state.totalDoctors = action.payload.total;
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
    },
    setSelectedDoctor: (state, action: PayloadAction<Doctor | null>) => {
      state.selectedDoctor = action.payload;
    },
    setSpecializations: (state, action: PayloadAction<string[]>) => {
      state.specializations = action.payload;
    },
    addDoctor: (state, action: PayloadAction<Doctor>) => {
      state.doctors.unshift(action.payload);
      state.totalDoctors += 1;
    },
    updateDoctor: (state, action: PayloadAction<Doctor>) => {
      const index = state.doctors.findIndex((d) => d.doctorId === action.payload.doctorId);
      if (index !== -1) {
        state.doctors[index] = action.payload;
      }
      if (state.selectedDoctor?.doctorId === action.payload.doctorId) {
        state.selectedDoctor = action.payload;
      }
    },
    deleteDoctor: (state, action: PayloadAction<number>) => {
      state.doctors = state.doctors.filter((d) => d.doctorId !== action.payload);
      state.totalDoctors -= 1;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDoctors,
  setSelectedDoctor,
  setSpecializations,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  setLoading,
  setError,
} = doctorSlice.actions;
export default doctorSlice.reducer;
