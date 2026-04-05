import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { removeToast } from '@/store/slices/uiSlice';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
};

const Toast = ({ toast }: { toast: any }) => {
  const dispatch = useDispatch<AppDispatch>();
  const Icon = toastIcons[toast.type as keyof typeof toastIcons];

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 100, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 25,
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-premium min-w-[320px] max-w-md relative overflow-hidden',
        toastStyles[toast.type as keyof typeof toastStyles]
      )}
    >
      {/* Dynamic Progress Bar for Auto-dismiss */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className={cn(
          "absolute bottom-0 left-0 h-1 opacity-20",
          toast.type === 'success' ? "bg-green-600" :
          toast.type === 'error' ? "bg-red-600" :
          toast.type === 'warning' ? "bg-yellow-600" : "bg-blue-600"
        )}
      />

      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-semibold">{toast.message}</p>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector((state: RootState) => state.ui.toasts);

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
