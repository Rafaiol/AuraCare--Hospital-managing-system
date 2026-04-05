import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Clipboard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { appointmentService } from '@/services/appointmentService';
import type { Appointment } from '@/types';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAppointment = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointmentById(Number(id));
      setAppointment(data);
    } catch {
      showError('Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await appointmentService.cancelAppointment(Number(id));
      showSuccess('Appointment cancelled');
      fetchAppointment();
    } catch {
      showError('Failed to cancel appointment');
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await appointmentService.completeAppointment(Number(id));
      showSuccess('Appointment marked as completed');
      fetchAppointment();
    } catch {
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

    let icon = <Clock className="w-3 h-3 mr-1" />;
    if (status === 'COMPLETED') icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
    if (status === 'CANCELLED') icon = <XCircle className="w-3 h-3 mr-1" />;
    if (status === 'IN_PROGRESS') icon = <AlertCircle className="w-3 h-3 mr-1" />;

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!appointment) return <div>Appointment not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Appointment #{appointment.appointmentCode}
              </h1>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-gray-500">Booked on {new Date(appointment.createdAt || '').toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {appointment.status === 'SCHEDULED' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/appointments/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </>
          )}
          <Button variant="outline" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-teal-500" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Type of Visit</p>
                  <p className="font-medium text-lg capitalize">{appointment.type.toLowerCase().replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <div className="flex items-center gap-2 font-medium text-lg">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                    <Clock className="w-4 h-4 ml-2 text-teal-500" />
                    <span>{appointment.appointmentTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Reason for Visit</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  {appointment.reason || 'No reason specified'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Consultation Notes</p>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border min-h-[100px]">
                  {appointment.notes || 'No notes added yet.'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-teal-500" />
                Attachments & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8 italic">No documents attached to this appointment.</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card className="border-none shadow-premium overflow-hidden">
            <div className="h-2 bg-blue-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Patient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white leading-tight">{appointment.patient.name}</p>
                  <p className="text-sm text-gray-500">{appointment.patient.patientCode}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{appointment.patient.phone}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/patients/${appointment.patient.patientId}`)}>
                View Patient File
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Info */}
          <Card className="border-none shadow-premium overflow-hidden">
            <div className="h-2 bg-teal-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Primary Doctor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white leading-tight">{appointment.doctor.name}</p>
                  <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/doctors/${appointment.doctor.doctorId}`)}>
                View Doctor Profile
              </Button>
            </CardContent>
          </Card>

          {/* Payment Status (Placeholder) */}
          <Card className="border-none shadow-premium bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Billing Status</p>
                <p className="font-medium">Unpaid</p>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-gray-700">Pending</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
