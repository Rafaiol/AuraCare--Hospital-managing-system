import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { toggleSidebar, toggleDarkMode } from '@/store/slices/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  ChevronDown,
  X,
  UserRound,
  Stethoscope,
  CalendarDays,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Services
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { notificationService, type Notification } from '@/services/notificationService';

const TopNav = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    patients: any[];
    doctors: any[];
    appointments: any[];
  }>({ patients: [], doctors: [], appointments: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { notifications: data } = await notificationService.getNotifications({ limit: 5 });
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Global Search Logic
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const [pRes, dRes] = await Promise.all([
            patientService.getPatients({ search: searchQuery, limit: 3 }),
            doctorService.getDoctors({ search: searchQuery, limit: 3 })
          ]);
          setSearchResults({
            patients: pRes.patients,
            doctors: dRes.doctors,
            appointments: []
          });
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ patients: [], doctors: [], appointments: [] });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-all duration-300",
      sidebarOpen ? "left-0 lg:left-64" : "left-0 lg:left-20"
    )}>
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Enhanced Global Search */}
          <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10",
                searchQuery ? "text-teal-500" : "text-gray-400"
              )} />
              <Input
                type="text"
                placeholder="Search Patients, Doctors, Records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-full border-transparent bg-gray-50/50 dark:bg-gray-800/50 focus-visible:bg-white dark:focus-visible:bg-gray-900 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 dark:focus-visible:ring-teal-500/10 shadow-none transition-all duration-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchQuery.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-premium border border-gray-100 dark:border-gray-800 overflow-hidden max-h-[400px] overflow-y-auto"
                >
                  <div className="p-2">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                    ) : (
                      <>
                        {/* Patients */}
                        {searchResults.patients.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patients</div>
                            {searchResults.patients.map(p => (
                              <button
                                key={p.patientId}
                                onClick={() => { navigate(`/patients/${p.patientId}`); setSearchQuery(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 text-left transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600">
                                  <UserRound className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{p.fullName}</p>
                                  <p className="text-[10px] text-gray-500">ID: {p.patientCode}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Doctors */}
                        {searchResults.doctors.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctors</div>
                            {searchResults.doctors.map(d => (
                              <button
                                key={d.doctorId}
                                onClick={() => { navigate(`/doctors/${d.doctorId}`); setSearchQuery(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                                  <Stethoscope className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">Dr. {d.user.fullName}</p>
                                  <p className="text-[10px] text-gray-500">{d.specialization}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.patients.length === 0 && searchResults.doctors.length === 0 && !isSearching && (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Search className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No matches found for "{searchQuery}"</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleDarkMode())}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-5 h-5 text-teal-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-5 h-5 text-orange-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Real Notification System */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-pulse")} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-2xl shadow-premium border-none overflow-hidden">
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{unreadCount} UNREAD ALERTS</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-teal-600 font-semibold" onClick={clearAllNotifications}>
                  Mark all as read
                </Button>
              </div>
              
              <div className="max-h-[400px] overflow-auto py-2">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <DropdownMenuItem 
                      key={n.id} 
                      className={cn(
                        "flex items-start gap-4 px-4 py-3 cursor-pointer transition-colors border-l-4",
                        n.isRead ? "border-transparent opacity-60" : 
                        n.type === 'ERROR' ? "border-red-500 bg-red-50/30 dark:bg-red-900/10" :
                        n.type === 'SUCCESS' ? "border-teal-500" : "border-blue-500"
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className={cn(
                        "p-2 rounded-xl mt-0.5",
                        n.type === 'ERROR' ? "bg-red-100 text-red-600" :
                        n.type === 'SUCCESS' ? "bg-teal-100 text-teal-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {n.type === 'ERROR' ? <AlertCircle className="w-4 h-4" /> :
                         n.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{n.title}</p>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-gray-200" />
                    </div>
                    <p className="text-sm text-gray-500">All caught up!</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                <Button 
                  variant="ghost" 
                  className="w-full h-9 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  onClick={() => navigate('/notifications')}
                >
                  VIEW ALL NOTIFICATIONS
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 h-11 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{user?.fullName || 'User'}</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{user?.role?.roleName || 'Role'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                  <User className="w-5 h-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-premium border-none">
              <DropdownMenuLabel className="px-3 pt-3 pb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage Account</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl px-3 py-2 cursor-pointer">
                <User className="w-4 h-4 mr-3 text-gray-400" />
                <span className="font-semibold text-sm">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl px-3 py-2 cursor-pointer">
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                <span className="font-semibold text-sm">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-3 py-2 cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-3" />
                <span className="font-semibold text-sm">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
