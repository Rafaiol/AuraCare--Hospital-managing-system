import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DashboardStats, ChartData, DoctorPerformance, Appointment } from '@/types';

interface DashboardState {
  stats: DashboardStats | null;
  appointmentsChart: ChartData[];
  revenueChart: ChartData[];
  patientsByDepartment: { department: string; count: number }[];
  doctorPerformance: DoctorPerformance[];
  todayAppointments: Appointment[];
  recentActivities: { type: string; description: string; time: string; icon: string }[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  appointmentsChart: [],
  revenueChart: [],
  patientsByDepartment: [],
  doctorPerformance: [],
  todayAppointments: [],
  recentActivities: [],
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    setAppointmentsChart: (state, action: PayloadAction<ChartData[]>) => {
      state.appointmentsChart = action.payload;
    },
    setRevenueChart: (state, action: PayloadAction<ChartData[]>) => {
      state.revenueChart = action.payload;
    },
    setPatientsByDepartment: (state, action: PayloadAction<{ department: string; count: number }[]>) => {
      state.patientsByDepartment = action.payload;
    },
    setDoctorPerformance: (state, action: PayloadAction<DoctorPerformance[]>) => {
      state.doctorPerformance = action.payload;
    },
    setTodayAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.todayAppointments = action.payload;
    },
    setRecentActivities: (state, action: PayloadAction<{ type: string; description: string; time: string; icon: string }[]>) => {
      state.recentActivities = action.payload;
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
  setStats,
  setAppointmentsChart,
  setRevenueChart,
  setPatientsByDepartment,
  setDoctorPerformance,
  setTodayAppointments,
  setRecentActivities,
  setLoading,
  setError,
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
