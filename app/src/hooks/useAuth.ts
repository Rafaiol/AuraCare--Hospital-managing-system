import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store';
import { setCredentials, logout, updateUser, setLoading } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch(setLoading(true));
      try {
        const data = await authService.login({ email, password });
        dispatch(setCredentials({
          user: data.user,
          token: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        }));
        return { success: true };
      } catch (err) {
        const error = err as any;
        return {
          success: false,
          error: error.response?.data?.message || 'Login failed',
        };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (userData: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      dispatch(setLoading(true));
      try {
        const data = await authService.register(userData);
        dispatch(setCredentials({
          user: data.user,
          token: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        }));
        return { success: true };
      } catch (err) {
        const error = err as any;
        return {
          success: false,
          error: error.response?.data?.message || 'Registration failed',
        };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(logout());
    }
  }, [dispatch]);

  const refreshProfile = useCallback(async () => {
    try {
      const user = await authService.getProfile();
      dispatch(updateUser(user));
      return user;
    } catch (_error) {
      return null;
    }
  }, [dispatch]);

  const hasRole = useCallback(
    (roles: string[]) => {
      return auth.user?.role ? roles.includes(auth.user.role.roleName) : false;
    },
    [auth.user]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      return auth.user?.role?.permissions?.includes(permission) || auth.user?.role?.permissions?.includes('all') || false;
    },
    [auth.user]
  );

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    token: auth.token,
    login,
    register,
    logout: handleLogout,
    refreshProfile,
    hasRole,
    hasPermission,
  };
};
