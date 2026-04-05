import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import {
  setStats,
  setAppointmentsChart,
  setPatientsByDepartment,
  setDoctorPerformance,
  setTodayAppointments,
  setLoading,
} from '@/store/slices/dashboardSlice';
import { dashboardService } from '@/services/dashboardService';
import { useToast } from '@/hooks/useToast';
import { StatCard } from '@/components/common/StatCard';
import {
  Users,
  Calendar,
  DollarSign,
  Bed,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#10b981'];

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useToast();
  const {
    stats,
    appointmentsChart,
    patientsByDepartment,
    doctorPerformance,
    todayAppointments,
  } = useSelector((state: RootState) => state.dashboard);

  const fetchDashboardData = async () => {
    dispatch(setLoading(true));
    try {
      const [
        statsData,
        appointmentsData,
        departmentData,
        performanceData,
        todayAppointmentsData,
      ] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getAppointmentsChart(),
        dashboardService.getPatientsByDepartment(),
        dashboardService.getDoctorPerformance(5),
        dashboardService.getTodayAppointments(),
      ]);

      dispatch(setStats(statsData));
      dispatch(setAppointmentsChart(appointmentsData));
      dispatch(setPatientsByDepartment(departmentData));
      dispatch(setDoctorPerformance(performanceData));
      dispatch(setTodayAppointments(todayAppointmentsData));
    } catch (_error) {
      showError('Failed to load dashboard data');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          trend={12}
          trendLabel="vs last month"
          color="teal"
          delay={0}
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={Calendar}
          trend={5}
          trendLabel="vs yesterday"
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Revenue Summary"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={DollarSign}
          trend={8}
          trendLabel="vs yesterday"
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Bed Occupancy Rate"
          value={`${stats?.bedOccupancyRate || 0}%`}
          icon={Bed}
          trend={-2}
          trendLabel="vs last week"
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Appointments Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appointmentsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="appointments" fill="#14b8a6" name="Appointments" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#3b82f6" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patients by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Patients by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patientsByDepartment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="department"
                  >
                    {patientsByDepartment.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinical Volume (Top Doctors) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Doctors by Volume (Patients Seen)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorPerformance.map((doctor, index) => (
                  <motion.div
                    key={doctor.doctorId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-teal-100 text-teal-600">
                        {doctor.doctorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {doctor.doctorName}
                      </p>
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                          {doctor.patientsSeen}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">Total Patients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {doctor.completedAppointments || 0}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">Appointments</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appointment, index) => (
                  <motion.div
                    key={appointment.appointmentId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {appointment.appointmentTime}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {appointment.patient.name}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.doctor.name}</p>
                    </div>
                    <Badge
                      variant={
                        appointment.status === 'COMPLETED'
                          ? 'default'
                          : appointment.status === 'CANCELLED'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </motion.div>
                ))}
                {todayAppointments.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No appointments today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
