import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Calendar, FileText, Activity, Heart,
  Smartphone, Mail, MapPin, User, Shield, AlertTriangle, Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { patientService } from '@/services/patientService';
import type { Patient } from '@/types';
import { useToast } from '@/hooks/useToast';

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{value || 'N/A'}</span>
  </div>
);

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data = await patientService.getPatientById(Number(id));
        setPatient(data);
      } catch (error) {
        showError('Failed to load patient details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id, showError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient not found</h2>
        <Button onClick={() => navigate('/patients')} className="mt-4">Back to Patients</Button>
      </div>
    );
  }

  const formatDate = (val?: string | null) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    // Use UTC to avoid timezone offset shifting the displayed date
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  const statusColor: Record<string, string> = {
    INPATIENT: 'bg-red-100 text-red-700',
    OUTPATIENT: 'bg-green-100 text-green-700',
    DISCHARGED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/patients/${id}/edit`)} className="gap-2">
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2" onClick={() => navigate(`/appointments/new?patientId=${id}`)}>
            <Calendar className="w-4 h-4" /> Book Appointment
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <FileText className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-600" />
              <div className="px-6 pb-6 text-center -mt-12">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-white dark:ring-gray-800">
                  <AvatarFallback className="text-2xl bg-teal-100 text-teal-600">
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{patient.patientCode}</p>
                  <Badge className={`mt-2 border-none ${statusColor[patient.status] || 'bg-gray-100 text-gray-600'}`}>
                    {patient.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-medium">{patient.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-medium break-all">{patient.email || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="font-medium">{[patient.address, patient.city, patient.state].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital/Quick Info */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-400">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-rose-500"><Heart className="w-4 h-4" /><span>Blood Group</span></div>
                <span className="font-bold">{patient.bloodGroup || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-blue-500"><User className="w-4 h-4" /><span>Gender</span></div>
                <span className="font-bold capitalize">{patient.gender?.toLowerCase() || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-purple-500"><Activity className="w-4 h-4" /><span>DOB</span></div>
                <span className="font-bold">{formatDate(patient.dateOfBirth as unknown as string)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Personal Information */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoRow label="First Name" value={patient.firstName} />
                <InfoRow label="Last Name" value={patient.lastName} />
                <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth as unknown as string)} />
                <InfoRow label="Gender" value={patient.gender} />
                <InfoRow label="Blood Group" value={patient.bloodGroup} />
                <InfoRow label="Phone" value={patient.phone} />
                <InfoRow label="Email" value={patient.email} />
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="City" value={patient.city} />
                <InfoRow label="State / Province" value={patient.state} />
                <InfoRow label="Zip Code" value={patient.zipCode} />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <InfoRow label="Contact Name" value={(patient as any).emergencyContact?.name || (patient as any).emergencyContactName} />
                <InfoRow label="Contact Phone" value={(patient as any).emergencyContact?.phone || (patient as any).emergencyContactPhone} />
              </div>
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" /> Insurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <InfoRow label="Provider" value={(patient as any).insurance?.provider || (patient as any).insuranceProvider} />
                <InfoRow label="Insurance Number" value={(patient as any).insurance?.number || (patient as any).insuranceNumber} />
              </div>
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-500" /> Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Chronic Conditions</h4>
                  <p className="text-sm">{(patient as any).medicalInfo?.chronicConditions || 'None reported.'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Allergies</h4>
                  <p className="text-sm">{(patient as any).medicalInfo?.allergies || 'None reported.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Doctor */}
          {(patient as any).assignedDoctor && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Assigned Doctor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <InfoRow label="Doctor Name" value={(patient as any).assignedDoctor.name} />
                  <InfoRow label="Specialization" value={(patient as any).assignedDoctor.specialization} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admission */}
          {(patient.admissionDate || patient.dischargeDate) && (
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle className="text-lg">Admission Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <InfoRow label="Admission Date" value={formatDate(patient.admissionDate as unknown as string)} />
                  <InfoRow label="Discharge Date" value={formatDate(patient.dischargeDate as unknown as string)} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
