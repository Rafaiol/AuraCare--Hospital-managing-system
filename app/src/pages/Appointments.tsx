import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { setAppointments } from '@/store/slices/appointmentSlice';
import { appointmentService } from '@/services/appointmentService';
import { useToast } from '@/hooks/useToast';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import '@/styles/calendar.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Appointment } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const localizer = momentLocalizer(moment);

const Appointments = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess, showError } = useToast();
  const { appointments, totalAppointments, currentPage, totalPages, isLoading } = useSelector(
    (state: RootState) => state.appointments
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<any>('month');

  const fetchAppointments = async () => {
    try {
      const result = await appointmentService.getAppointments({
        page: currentPage,
        limit: 10,
      });
      dispatch(
        setAppointments({
          appointments: result.appointments,
          total: result.pagination.total,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        })
      );
    } catch (_error) {
      showError('Failed to load appointments');
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleCancel = async (id: number) => {
    try {
      await appointmentService.cancelAppointment(id);
      showSuccess('Appointment cancelled');
      fetchAppointments();
    } catch (_error) {
      showError('Failed to cancel appointment');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await appointmentService.completeAppointment(id);
      showSuccess('Appointment marked as completed');
      fetchAppointments();
    } catch (_error) {
      showError('Failed to complete appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SCHEDULED: 'secondary',
      CONFIRMED: 'default',
      IN_PROGRESS: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      NO_SHOW: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: 'appointmentCode',
      header: 'Appointment ID',
    },
    {
      accessorKey: 'appointmentDate',
      header: 'Date & Time',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{new Date(row.original.appointmentDate).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">{row.original.appointmentTime}</p>
        </div>
      ),
    },
    {
      accessorKey: 'patient.name',
      header: 'Patient',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.patient.name}</p>
          <p className="text-sm text-gray-500">{row.original.patient.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'doctor.name',
      header: 'Doctor',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.doctor.name}</p>
          <p className="text-sm text-gray-500">{row.original.doctor.specialization}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.type.toLowerCase().replace('_', ' ')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/appointments/${row.original.appointmentId}`)}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {row.original.status === 'SCHEDULED' && (
              <>
                <DropdownMenuItem onClick={() => handleComplete(row.original.appointmentId)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCancel(row.original.appointmentId)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Tabs defaultValue="list" className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-500">Manage patient appointments</p>
        </div>
        <div className="flex gap-2 items-center">
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user?.role?.roleName || '') && (
            <Button
              onClick={() => navigate('/appointments/new')}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book
            </Button>
          )}
        </div>
      </motion.div>

      <TabsContent value="list" className="space-y-6 outline-none !mt-0">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAppointments();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </form>
          <Button variant="outline" onClick={() => fetchAppointments()}>
            Search
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DataTable
            columns={columns}
            data={appointments}
            pagination={{
              page: currentPage,
              limit: 10,
              total: totalAppointments,
              totalPages,
            }}
            onPageChange={(page) => dispatch(setAppointments({ appointments, total: totalAppointments, page, totalPages }))}
            isLoading={isLoading}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="calendar" className="outline-none !mt-0 h-[800px] w-full p-4 bg-white dark:bg-gray-900 border border-border shadow-sm rounded-lg">
        <Calendar
          localizer={localizer}
          date={calendarDate}
          view={calendarView}
          onNavigate={(newDate) => setCalendarDate(newDate)}
          onView={(newView) => setCalendarView(newView)}
          events={appointments.map((apt) => {
            let start = new Date();
            let end = new Date();
            try {
              const date = new Date(apt.appointmentDate || new Date());
              const timeStr = apt.appointmentTime || '09:00';
              const [hours, minutes] = timeStr.split(':').map(Number);
              start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours || 0, minutes || 0);
              end = new Date(start.getTime() + 30 * 60000); // 30 minutes duration assumption
            } catch (e) {
              console.error("Invalid date parsing for appointment:", apt);
            }
            return {
              title: `${apt.patient?.name || 'Unknown'} - ${(apt.type || '').replace('_', ' ')}`,
              start,
              end,
              resource: apt,
            };
          })}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={(event) => {
            navigate(`/appointments/${event.resource.appointmentId}`);
          }}
          className="rbc-calendar"
          components={{
            event: ({ event }) => (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-0.5 w-full h-full cursor-pointer"
                  >
                    <span className="font-semibold text-[11px] leading-tight truncate">{event.title}</span>
                    <span className="text-[10px] opacity-80 leading-tight truncate">
                      Dr. {event.resource.doctor?.name || 'Unknown'}
                    </span>
                  </motion.div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 z-50">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Time: {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="pt-2">
                      <Badge variant="outline">{event.resource.status}</Badge>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ),
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default Appointments;
