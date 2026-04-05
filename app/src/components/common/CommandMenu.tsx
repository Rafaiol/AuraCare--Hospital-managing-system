import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  Settings,
  User,
  Users,
  Plus,
  FileText,
  Building2,
  LayoutDashboard,
  Stethoscope,
  LogOut,
  Moon,
  Sun,
  Bed,
  Search,
  Command as CommandIcon,
  ChevronRight
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '@/store';
import { toggleDarkMode } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const Shortcut = ({ keys }: { keys: string[] }) => (
    <div className="flex items-center gap-1 ml-auto">
      {keys.map((k, i) => (
        <kbd key={i} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-gray-500 font-semibold shadow-sm">
          {k}
        </kbd>
      ))}
    </div>
  );

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      className="overflow-hidden rounded-2xl shadow-premium border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sm:max-w-[600px]"
    >
      <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50">
        <CommandIcon className="w-5 h-5 text-teal-500 mr-3" />
        <CommandInput 
          placeholder="Search everywhere or type a command..." 
          className="border-none focus:ring-0 p-0 text-base bg-transparent flex-1 shadow-none outline-none focus-visible:ring-0 h-auto"
        />
        <kbd className="hidden sm:inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-[10px] font-mono text-gray-400 font-semibold shadow-sm ml-2">
          ESC
        </kbd>
      </div>
      
      <CommandList className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        <CommandEmpty className="py-12 text-center text-gray-500 text-sm flex flex-col items-center">
          <Search className="w-8 h-8 text-gray-300 mb-3" />
          No results found. Try a different search term.
        </CommandEmpty>
        
        <CommandGroup heading={<div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions</div>}>
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/dashboard'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/20 aria-selected:text-teal-600 dark:aria-selected:text-teal-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-teal-100 dark:group-aria-selected:bg-teal-900/40 flex items-center justify-center mr-3 transition-colors">
              <LayoutDashboard className="h-4 w-4 text-gray-500 group-aria-selected:text-teal-600 dark:group-aria-selected:text-teal-400" />
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-teal-700 dark:group-aria-selected:text-teal-300">Dashboard Overview</span>
            <Shortcut keys={['G', 'D']} />
          </CommandItem>
          
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/appointments'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/20 aria-selected:text-teal-600 dark:aria-selected:text-teal-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-teal-100 dark:group-aria-selected:bg-teal-900/40 flex items-center justify-center mr-3 transition-colors">
              <Calendar className="h-4 w-4 text-gray-500 group-aria-selected:text-teal-600 dark:group-aria-selected:text-teal-400" />
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-teal-700 dark:group-aria-selected:text-teal-300">View Appointments</span>
            <Shortcut keys={['G', 'A']} />
          </CommandItem>

          <CommandItem 
            onSelect={() => runCommand(() => navigate('/patients'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/20 aria-selected:text-teal-600 dark:aria-selected:text-teal-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-teal-100 dark:group-aria-selected:bg-teal-900/40 flex items-center justify-center mr-3 transition-colors">
              <Users className="h-4 w-4 text-gray-500 group-aria-selected:text-teal-600 dark:group-aria-selected:text-teal-400" />
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-teal-700 dark:group-aria-selected:text-teal-300">Patient Directory</span>
            <Shortcut keys={['G', 'P']} />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-2 bg-gray-100 dark:bg-gray-800" />
        
        <CommandGroup heading={<div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</div>}>
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/appointments/new'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-indigo-100 dark:group-aria-selected:bg-indigo-900/40 flex items-center justify-center mr-3 transition-colors">
              <Plus className="h-4 w-4 text-gray-500 group-aria-selected:text-indigo-600 dark:group-aria-selected:text-indigo-400" />
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-indigo-700 dark:group-aria-selected:text-indigo-300">Book New Appointment</span>
            <Shortcut keys={['⌘', 'N']} />
          </CommandItem>

          <CommandItem 
            onSelect={() => runCommand(() => navigate('/patients/new'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-indigo-100 dark:group-aria-selected:bg-indigo-900/40 flex items-center justify-center mr-3 transition-colors">
              <User className="h-4 w-4 text-gray-500 group-aria-selected:text-indigo-600 dark:group-aria-selected:text-indigo-400" />
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-indigo-700 dark:group-aria-selected:text-indigo-300">Register New Patient</span>
            <Shortcut keys={['⇧', 'N']} />
          </CommandItem>

          <CommandItem 
            onSelect={() => runCommand(() => dispatch(toggleDarkMode()))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-yellow-50 dark:aria-selected:bg-yellow-900/20 aria-selected:text-yellow-600 dark:aria-selected:text-yellow-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-aria-selected:bg-yellow-100 dark:group-aria-selected:bg-yellow-900/40 flex items-center justify-center mr-3 transition-colors">
              {darkMode ? <Sun className="h-4 w-4 text-gray-500 group-aria-selected:text-yellow-600 dark:group-aria-selected:text-yellow-400" /> : <Moon className="h-4 w-4 text-gray-500 group-aria-selected:text-yellow-600 dark:group-aria-selected:text-yellow-400" />}
            </div>
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-aria-selected:text-yellow-700 dark:group-aria-selected:text-yellow-300">Toggle Theme</span>
            <Shortcut keys={['⌘', 'T']} />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-2 bg-gray-100 dark:bg-gray-800" />
        
        <CommandGroup heading={<div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Management</div>}>
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/doctors'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors group"
          >
            <Stethoscope className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-gray-600 dark:group-aria-selected:text-gray-200" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-gray-900 dark:group-aria-selected:text-white">Doctors</span>
          </CommandItem>
          
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/rooms'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors group"
          >
            <Bed className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-gray-600 dark:group-aria-selected:text-gray-200" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-gray-900 dark:group-aria-selected:text-white">Room Management</span>
          </CommandItem>

          <CommandItem 
            onSelect={() => runCommand(() => navigate('/billing'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors group"
          >
            <CreditCard className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-gray-600 dark:group-aria-selected:text-gray-200" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-gray-900 dark:group-aria-selected:text-white">Billing & Invoices</span>
            <Shortcut keys={['G', 'B']} />
          </CommandItem>
          
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/reports'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors group"
          >
            <FileText className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-gray-600 dark:group-aria-selected:text-gray-200" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-gray-900 dark:group-aria-selected:text-white">Report Center</span>
            <Shortcut keys={['G', 'R']} />
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator className="my-2 bg-gray-100 dark:bg-gray-800" />

        <CommandGroup heading={<div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">System</div>}>
          <CommandItem 
            onSelect={() => runCommand(() => navigate('/settings'))}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors group"
          >
            <Settings className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-gray-600 dark:group-aria-selected:text-gray-200" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-gray-900 dark:group-aria-selected:text-white">Settings</span>
            <Shortcut keys={['⌘', ',']} />
          </CommandItem>
          <CommandItem 
            onSelect={() => runCommand(() => { logout(); navigate('/login'); })}
            className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20 transition-colors group"
          >
            <LogOut className="h-4 w-4 text-gray-400 mr-3 group-aria-selected:text-red-500" />
            <span className="font-medium text-sm text-gray-600 dark:text-gray-400 group-aria-selected:text-red-600 dark:group-aria-selected:text-red-400">Log out</span>
            <Shortcut keys={['⇧', '⌘', 'Q']} />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
