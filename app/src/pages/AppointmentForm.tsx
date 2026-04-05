import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import type { Doctor, Patient } from '@/types';

const AppointmentForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const isEdit = !!id;
  const initialPatientId = searchParams.get('patientId');
  const initialDoctorId = searchParams.get('doctorId');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    patientId: initialPatientId || '',
    doctorId: initialDoctorId || '',
    appointmentDate: '',
    appointmentTime: '',
    type: 'CONSULTATION',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.doctorId, formData.appointmentDate]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [doctorsData, patientsData] = await Promise.all([
        doctorService.getDoctors({ page: 1, limit: 100, status: 'ACTIVE' }),
        patientService.getPatients({ page: 1, limit: 100 }),
      ]);
      setDoctors(doctorsData.doctors);
      setPatients(patientsData.patients);

      if (isEdit) {
        const appointment = await appointmentService.getAppointmentById(Number(id));
        setFormData({
          patientId: appointment.patient.patientId.toString(),
          doctorId: appointment.doctor.doctorId.toString(),
          appointmentDate: appointment.appointmentDate.split('T')[0],
          appointmentTime: appointment.appointmentTime,
          type: appointment.type,
          reason: appointment.reason || '',
          notes: appointment.notes || '',
        });
      }
    } catch {
      showError('Failed to load form data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const slots = await doctorService.getAvailableSlots(Number(formData.doctorId), formData.appointmentDate);
      setAvailableSlots(slots);
    } catch {
      console.error('Failed to fetch slots');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        patientId: Number(formData.patientId),
        doctorId: Number(formData.doctorId),
      };

      if (isEdit) {
        await appointmentService.updateAppointment(Number(id), payload);
        showSuccess('Appointment updated successfully');
      } else {
        await appointmentService.createAppointment(payload);
        showSuccess('Appointment booked successfully');
      }
      navigate('/appointments');
    } catch {
      showError(isEdit ? 'Failed to update appointment' : 'Failed to book appointment');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Reschedule Appointment' : 'Book New Appointment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-premium">
              <CardHeader>
                <CardTitle className="text-lg">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select
                      value={formData.patientId}
                      onValueChange={(val) => handleSelectChange('patientId', val)}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.patientId} value={p.patientId.toString()}>
                            {p.fullName} ({p.patientCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Select
                      value={formData.doctorId}
                      onValueChange={(val) => handleSelectChange('doctorId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => (
                          <SelectItem key={d.doctorId} value={d.doctorId.toString()}>
                            {d.user.fullName} - {d.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(val) => handleSelectChange('type', val)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSULTATION">General Consultation</SelectItem>
                        <SelectItem value="FOLLOW_UP">Follow-up Visit</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        <SelectItem value="SURGERY">Surgery</SelectItem>
                        <SelectItem value="CHECKUP">Checkup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Visit</Label>
                    <Input
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="e.g. Routine checkup"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any specific information for the doctor..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-premium bg-teal-50/50 dark:bg-teal-900/10">
              <CardHeader>
                <CardTitle className="text-lg">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      value={formData.appointmentDate}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time Slot</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Select
                      value={formData.appointmentTime}
                      onValueChange={(val) => handleSelectChange('appointmentTime', val)}
                    >
                      <SelectTrigger id="appointmentTime" className="pl-10">
                        <SelectValue placeholder="Select Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.length > 0 ? (
                          availableSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-slots" disabled>No slots available</SelectItem>
                        )}
                        {/* Fallback mock slots if none fetched */}
                        {availableSlots.length === 0 && !formData.appointmentDate && (
                          <SelectItem value="no-date" disabled>Select date first</SelectItem>
                        )}
                        {availableSlots.length === 0 && formData.appointmentDate && (
                          ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? 'Processing...' : (isEdit ? 'Update Appointment' : 'Confirm Booking')}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>Verified patient profile</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Stethoscope className="w-4 h-4" />
                  <span>Licensed medical staff</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>Stored in medical records</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
