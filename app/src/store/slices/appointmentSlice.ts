import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Appointment } from '@/types';

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  calendarData: { date: string; time: string; status: string; type: string; patientName: string }[];
  totalAppointments: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  calendarData: [],
  totalAppointments: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments: (
      state,
      action: PayloadAction<{
        appointments: Appointment[];
        total: number;
        page: number;
        totalPages: number;
      }>
    ) => {
      state.appointments = action.payload.appointments;
      state.totalAppointments = action.payload.total;
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
    },
    setSelectedAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.selectedAppointment = action.payload;
    },
    setCalendarData: (
      state,
      action: PayloadAction<
        { date: string; time: string; status: string; type: string; patientName: string }[]
      >
    ) => {
      state.calendarData = action.payload;
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.unshift(action.payload);
      state.totalAppointments += 1;
    },
    updateAppointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex(
        (a) => a.appointmentId === action.payload.appointmentId
      );
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
      if (state.selectedAppointment?.appointmentId === action.payload.appointmentId) {
        state.selectedAppointment = action.payload;
      }
    },
    deleteAppointment: (state, action: PayloadAction<number>) => {
      state.appointments = state.appointments.filter(
        (a) => a.appointmentId !== action.payload
      );
      state.totalAppointments -= 1;
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
  setAppointments,
  setSelectedAppointment,
  setCalendarData,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  setLoading,
  setError,
} = appointmentSlice.actions;
export default appointmentSlice.reducer;
