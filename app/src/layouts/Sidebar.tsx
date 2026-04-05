import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { toggleSidebar, setSidebarOpen } from '@/store/slices/uiSlice';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Bed,
  FileText,
  Settings,
  ChevronLeft,
  Stethoscope,
  Shield,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

interface NavGroup {
  menu: string;
  items: {
    title: string;
    icon: React.ReactNode;
    path: string;
    roles?: string[];
  }[];
}

const navItems: (NavItem | NavGroup)[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { path: '/billing', label: 'Billing', icon: CreditCard, roles: ['ADMIN', 'RECEPTIONIST'] },
  { path: '/rooms', label: 'Room Mgmt', icon: Bed, roles: ['ADMIN', 'NURSE', 'RECEPTIONIST'] },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['ADMIN'] },
  {
    menu: 'Admin',
    items: [
      { title: 'Departments', icon: <Building2 className="w-5 h-5" />, path: '/departments', roles: ['ADMIN'] },
      { title: 'User Profiles', icon: <Shield className="w-5 h-5" />, path: '/users', roles: ['ADMIN'] },
      { title: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings', roles: ['ADMIN'] },
    ]
  }
];

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const user = useSelector((state: RootState) => state.auth.user);

  const toggle = () => dispatch(toggleSidebar());

  const filteredNavItems = navItems.map((item) => {
    if ('menu' in item) {
      return {
        ...item,
        items: item.items.filter(subItem => !subItem.roles || (user?.role && subItem.roles.includes(user.role.roleName)))
      };
    }
    return item;
  }).filter((item) => {
    if ('path' in item) { // Regular NavItem
      return !item.roles || (user?.role && item.roles.includes(user.role.roleName));
    } else if ('menu' in item) { // NavGroup
      return item.items.length > 0; // Only show group if it has visible items
    }
    return false;
  });

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 80,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-50 h-[100dvh] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          !sidebarOpen ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center border-b border-gray-200 dark:border-gray-700 px-4 flex-shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-800 dark:text-white whitespace-nowrap">
                  AuraCare
                </span>
              </div>
              <button
                onClick={toggle}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center"
              title="Expand sidebar"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {filteredNavItems.map((item, index) => {
            if ('menu' in item) {
              return (
                <div key={index} className="pt-4">
                  <p className={cn(
                    "px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2",
                    !sidebarOpen && "hidden"
                  )}>{item.menu}</p>
                  {item.items.map((subItem) => {
                    const isActive = location.pathname.startsWith(subItem.path);
                    return (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          )
                        }
                      >
                        <div className={cn(
                          'w-5 h-5 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        )}
                        >{subItem.icon}</div>
                        <motion.span
                          initial={false}
                          animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
                          className="whitespace-nowrap overflow-hidden font-medium text-sm"
                        >
                          {subItem.title}
                        </motion.span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            } else {
              const Icon = item.icon as any;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    )
                  }
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    )}
                  />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: sidebarOpen ? 1 : 0,
                      width: sidebarOpen ? 'auto' : 0,
                    }}
                    className="whitespace-nowrap overflow-hidden font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-teal-500 rounded-r-full"
                    />
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

      </motion.aside>
    </>
  );
};

export default Sidebar;
