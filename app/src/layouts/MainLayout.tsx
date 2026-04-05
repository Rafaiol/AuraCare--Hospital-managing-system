import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/store';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Toaster } from '@/components/ui/sonner';
import { ToastContainer } from '@/components/common/ToastContainer';
import { CommandMenu } from '@/components/common/CommandMenu';
import { Command } from 'lucide-react';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
      >
        <TopNav />
        <main className="p-4 lg:p-6 mt-16 pb-24">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" />
      <ToastContainer />
      <CommandMenu />

      {/* Floating Quick Actions Button */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300 group overflow-hidden",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50",
          "text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400",
          "opacity-60 hover:opacity-100 hover:shadow-premium hover:-translate-y-1"
        )}
      >
        <Command className="w-5 h-5 flex-shrink-0" />
        <div className="flex items-center gap-2 pr-1 max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap">
          <span className="text-sm font-bold tracking-wide">Quick Actions</span>
          <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-500 shadow-inner">Ctrl+K</span>
        </div>
      </button>
    </div>
  );
};

export default MainLayout;
