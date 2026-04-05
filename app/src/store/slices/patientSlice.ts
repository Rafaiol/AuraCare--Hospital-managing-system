import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Patient } from '@/types';

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  totalPatients: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  totalPatients: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients: (
      state,
      action: PayloadAction<{
        patients: Patient[];
        total: number;
        page: number;
        totalPages: number;
      }>
    ) => {
      state.patients = action.payload.patients;
      state.totalPatients = action.payload.total;
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
    },
    setSelectedPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    addPatient: (state, action: PayloadAction<Patient>) => {
      state.patients.unshift(action.payload);
      state.totalPatients += 1;
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const index = state.patients.findIndex((p) => p.patientId === action.payload.patientId);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
      if (state.selectedPatient?.patientId === action.payload.patientId) {
        state.selectedPatient = action.payload;
      }
    },
    deletePatient: (state, action: PayloadAction<number>) => {
      state.patients = state.patients.filter((p) => p.patientId !== action.payload);
      state.totalPatients -= 1;
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
  setPatients,
  setSelectedPatient,
  addPatient,
  updatePatient,
  deletePatient,
  setLoading,
  setError,
} = patientSlice.actions;
export default patientSlice.reducer;
