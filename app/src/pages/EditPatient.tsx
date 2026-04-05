import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceNumber: '',
    allergies: '',
    chronicConditions: '',
    status: 'OUTPATIENT',
  });

  // Helper: convert ISO timestamp → yyyy-MM-dd (always in UTC to avoid timezone shift)
  const toDateOnly = (val: any) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    // Use UTC parts to avoid timezone offset shifting the displayed date
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data: any = await patientService.getPatientById(Number(id));
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dateOfBirth: toDateOnly(data.dateOfBirth),
          gender: data.gender || 'MALE',
          bloodGroup: data.bloodGroup || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          emergencyContactName: data.emergencyContact?.name || data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContact?.phone || data.emergencyContactPhone || '',
          insuranceProvider: data.insurance?.provider || data.insuranceProvider || '',
          insuranceNumber: data.insurance?.number || data.insuranceNumber || '',
          allergies: data.medicalInfo?.allergies || data.allergies || '',
          chronicConditions: data.medicalInfo?.chronicConditions || data.chronicConditions || '',
          status: data.status || 'OUTPATIENT',
        });
      } catch (err) {
        showError('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSaving(true);
    try {
      await patientService.updatePatient(Number(id), {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        insuranceProvider: form.insuranceProvider || undefined,
        insuranceNumber: form.insuranceNumber || undefined,
        allergies: form.allergies || undefined,
        chronicConditions: form.chronicConditions || undefined,
        status: form.status,
      } as any);
      showSuccess('Patient updated successfully');
      navigate(`/patients/${id}`);
    } catch (err) {
      showError('Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" /></div>;
  }

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof typeof form; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal Info */}
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" placeholder="First name" />
            <Field label="Last Name" name="lastName" placeholder="Last name" />
            <Field label="Date of Birth" name="dateOfBirth" type="date" />
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => handleSelect('gender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Blood Group" name="bloodGroup" placeholder="e.g. O+" />
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => handleSelect('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTPATIENT">Outpatient</SelectItem>
                  <SelectItem value="INPATIENT">Inpatient</SelectItem>
                  <SelectItem value="DISCHARGED">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone" name="phone" placeholder="+1 (555) 000-0000" />
            <Field label="Email" name="email" type="email" placeholder="email@example.com" />
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={form.address} onChange={handleChange} placeholder="Street address" className="min-h-[80px]" />
            </div>
            <Field label="City" name="city" placeholder="City" />
            <Field label="State / Province" name="state" placeholder="State" />
            <Field label="Zip Code" name="zipCode" placeholder="Zip" />
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" name="emergencyContactName" placeholder="Full name" />
            <Field label="Phone" name="emergencyContactPhone" placeholder="+1 (555) 000-0000" />
          </CardContent>
        </Card>

        {/* Insurance */}
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Insurance</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Insurance Provider" name="insuranceProvider" placeholder="Provider name" />
            <Field label="Insurance Number" name="insuranceNumber" placeholder="Policy number" />
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea id="allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="List any allergies" className="min-h-[80px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chronicConditions">Chronic Conditions</Label>
              <Textarea id="chronicConditions" name="chronicConditions" value={form.chronicConditions} onChange={handleChange} placeholder="List any chronic conditions" className="min-h-[80px]" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
};

export default EditPatient;
