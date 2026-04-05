import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '@/store';
import { addToast, removeToast } from '@/store/slices/uiSlice';

export const useToast = () => {
  const dispatch = useDispatch<AppDispatch>();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      dispatch(addToast({ message, type }));
    },
    [dispatch]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast(message, 'warning');
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, 'info');
    },
    [showToast]
  );

  const dismissToast = useCallback(
    (id: string) => {
      dispatch(removeToast(id));
    },
    [dispatch]
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
  };
};
