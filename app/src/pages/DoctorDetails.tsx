import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Edit,
  Clock,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { doctorService } from '@/services/doctorService';
import type { Doctor } from '@/types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const DoctorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      try {
        const data = await doctorService.getDoctorById(Number(id));
        setDoctor(data);
      } catch (error) {
        showError('Failed to load doctor details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id, showError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor not found</h2>
        <Button onClick={() => navigate('/doctors')} className="mt-4">
          Back to Doctors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/doctors')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/doctors/${id}/edit`)} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
            onClick={() => navigate(`/appointments/new?doctorId=${id}`)}
          >
            <Calendar className="w-4 h-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-premium">
            <CardContent className="p-0">
              <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600" />
              <div className="px-6 pb-6 text-center -mt-16">
                <Avatar className="h-32 w-32 mx-auto ring-4 ring-white dark:ring-gray-800">
                  <AvatarImage src={doctor.user?.profileImage} />
                  <AvatarFallback className="text-3xl bg-teal-100 text-teal-600">
                    {doctor.user?.firstName?.charAt(0) || 'D'}{doctor.user?.lastName?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dr. {doctor.user?.fullName}
                  </h2>
                  <p className="text-teal-600 font-medium">{doctor.specialization}</p>
                  <p className="text-gray-500 text-sm mt-1">{doctor.department?.deptName || 'Department'}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="default" className="bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border-none">
                    License: {doctor.licenseNumber || 'N/A'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.patientsSeen || 0}</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold group flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> Total Patients Seen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Email Address</p>
                  <p className="text-sm font-medium">{doctor.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Phone Number</p>
                  <p className="text-sm font-medium">{doctor.user?.phone || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-700 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-0 pb-3 text-base">Overview</TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-0 pb-3 text-base">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card className="border-none shadow-premium">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {doctor.bio || `Dr. ${doctor.user?.fullName} is a board-certified ${doctor.specialization} with over ${doctor.experienceYears} years of experience.`}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-premium">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {doctor.qualification || 'Information not provided.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="border-none shadow-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center">
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">{day}</p>
                        <div className={cn(
                          "h-24 rounded-lg flex flex-col items-center justify-center p-2",
                          day === 'Sat' || day === 'Sun'
                            ? "bg-gray-50 dark:bg-gray-800 text-gray-400"
                            : "bg-teal-50 dark:bg-teal-900/20 text-teal-600 border border-teal-100 dark:border-teal-900/40"
                        )}>
                          {day === 'Sat' || day === 'Sun' ? (
                            <span className="text-[10px] uppercase font-bold">Closed</span>
                          ) : (
                            <>
                              <span className="text-xs font-bold">09:00</span>
                              <span className="text-[10px] my-1">to</span>
                              <span className="text-xs font-bold">17:00</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;
