import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { departmentService, type Department } from '@/services/departmentService';

interface EditPageProps {
  title: string;
  type: 'doctor' | 'patient' | 'appointment';
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

const EditPageTemplate = ({ title, type, onSave, initialData }: EditPageProps) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<any>({
    gender: 'MALE',
    status: 'ACTIVE'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Format an ISO date string or Date object to "yyyy-MM-dd" for <input type="date">
  const toDateInputValue = (val: any): string => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { departments } = await departmentService.getDepartments();
        setDepartments(departments);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Normalise data from initialData
      const normalised = { ...initialData };
      
      // Extract data from nested user object if it exists
      if (initialData.user) {
        normalised.firstName = initialData.user.firstName || '';
        normalised.lastName = initialData.user.lastName || '';
        normalised.email = initialData.user.email || '';
        normalised.phone = initialData.user.phone || '';
      }

      // Handle dates
      if (normalised.dateOfBirth) {
        normalised.dateOfBirth = toDateInputValue(normalised.dateOfBirth);
      }
      if (normalised.joiningDate) {
        normalised.joiningDate = toDateInputValue(normalised.joiningDate);
      }

      // Handle department ID mapping
      if (normalised.department && normalised.department.deptId) {
        normalised.deptId = String(normalised.department.deptId);
      } else if (normalised.deptId) {
        normalised.deptId = String(normalised.deptId);
      }

      setFormData((prev: any) => ({ ...prev, ...normalised }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      
      // Clean up dates
      if (payload.dateOfBirth && payload.dateOfBirth.includes('T')) {
        payload.dateOfBirth = payload.dateOfBirth.split('T')[0];
      }
      if (payload.joiningDate && payload.joiningDate.includes('T')) {
        payload.joiningDate = payload.joiningDate.split('T')[0];
      }
      
      // Map department ID for backend
      if (payload.deptId) {
        payload.departmentId = Number(payload.deptId);
      }

      await onSave(payload);
      showSuccess(`${title} successfully saved`);
      navigate(-1);
    } catch (error) {
      showError(`Failed to save ${title.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card className="border-none shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              {type === 'patient' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender || 'MALE'}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup || ''}
                      onChange={handleChange}
                      placeholder="e.g. O+"
                    />
                  </div>
                </div>
              )}

              {type !== 'appointment' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {type === 'doctor' && (
            <Card className="border-none shadow-premium">
              <CardHeader>
                <CardTitle className="text-lg">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId || ''}
                      onChange={handleChange}
                      placeholder="e.g. DOC001"
                      required
                      disabled={!!initialData}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber || ''}
                      onChange={handleChange}
                      placeholder="e.g. LIC123456"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization || ''}
                      onChange={handleChange}
                      placeholder="e.g. Cardiologist"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.deptId || ''}
                      onValueChange={(value) => handleSelectChange('deptId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.departmentId} value={String(dept.departmentId)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Experience (Years)</Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      value={formData.experienceYears || 0}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Consultation Fee</Label>
                    <Input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      value={formData.consultationFee || 0}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      name="joiningDate"
                      type="date"
                      value={formData.joiningDate || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status || 'ACTIVE'}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    name="qualification"
                    value={formData.qualification || ''}
                    onChange={handleChange}
                    placeholder="e.g. MBBS, MD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="Brief doctor biography"
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-premium">
            <CardFooter className="flex justify-end gap-3 p-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default EditPageTemplate;
