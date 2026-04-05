import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, type RootState, type AppDispatch } from '@/store';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import Doctors from '@/pages/Doctors';
import Appointments from '@/pages/Appointments';
import Billing from '@/pages/Billing';
import Rooms from '@/pages/Rooms';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import DoctorDetails from '@/pages/DoctorDetails';
import PatientDetails from '@/pages/PatientDetails';
import EditDoctor from '@/pages/EditDoctor';
import EditPatient from '@/pages/EditPatient';
import AddPatient from '@/pages/AddPatient';
import AddDoctor from '@/pages/AddDoctor';
import AppointmentForm from './pages/AppointmentForm';
import AppointmentDetails from './pages/AppointmentDetails';
import BillingForm from './pages/BillingForm';
import RoomForm from './pages/RoomForm';
import Users from '@/pages/Users';
import Departments from '@/pages/Departments';
import Notifications from '@/pages/Notifications';
import { useEffect } from 'react';
import { setCredentials, setLoading, logout } from '@/store/slices/authSlice';
import api from '@/services/api';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based Protected Route
const RoleProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role?.roleName || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Initialize dark mode
const DarkModeInitializer = () => {
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return null;
};

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        dispatch(setLoading(true));
        try {
          // Temporarily set token in headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/profile');
          dispatch(setCredentials({
            user: response.data.data,
            token,
            refreshToken: refreshToken || ''
          }));
        } catch (error) {
          console.error("Failed to restore session", error);
          dispatch(logout()); // Clear invalid session to avoid loops
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    fetchUser();
  }, [dispatch, token, user, refreshToken]);

  return <>{children}</>;
};

function App() {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <DarkModeInitializer />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Combined Admin & Doctor Routes for Reports */}
            <Route element={<RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}><MainLayout /></RoleProtectedRoute>}>
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']}><MainLayout /></RoleProtectedRoute>}>
              <Route path="/users" element={<Users />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/new" element={<RoomForm />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Protected Routes (All authenticated users) */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Patients */}
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/new" element={<AddPatient />} />
              <Route path="/patients/:id" element={<PatientDetails />} />
              <Route path="/patients/:id/edit" element={<EditPatient />} />

              {/* Doctors */}
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctors/new" element={<AddDoctor />} />
              <Route path="/doctors/:id" element={<DoctorDetails />} />
              <Route path="/doctors/:id/edit" element={<EditDoctor />} />

              {/* Appointments */}
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/appointments/:id/edit" element={<AppointmentForm />} />

              {/* Billing */}
              <Route path="/billing" element={<Billing />} />
              <Route path="/billing/new" element={<BillingForm />} />

              {/* Common */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthInitializer>
    </Provider>
  );
}

export default App;
