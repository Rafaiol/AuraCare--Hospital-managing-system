import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import {
  Users,
  Calendar,
  DollarSign,
  Bed,
  Stethoscope,
  Building2,
  FileText,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  RefreshCcw,
} from 'lucide-react';

// Charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Services
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService'; 
import { appointmentService } from '@/services/appointmentService';
import { billingService } from '@/services/billingService';
import { roomService } from '@/services/roomService';     
import { departmentService } from '@/services/departmentService';
import { dashboardService } from '@/services/dashboardService';

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#10b981'];

// Mock data for initial analytics view
const mockRevenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },      
  { month: 'Feb', revenue: 52000, expenses: 35000 },      
  { month: 'Mar', revenue: 48000, expenses: 33000 },      
  { month: 'Apr', revenue: 61000, expenses: 38000 },      
  { month: 'May', revenue: 55000, expenses: 36000 },      
  { month: 'Jun', revenue: 67000, expenses: 40000 },      
];

const mockDepartmentData = [
  { name: 'Cardiology', value: 35 },
  { name: 'Neurology', value: 25 },
  { name: 'Pediatrics', value: 20 },
  { name: 'Orthopedics', value: 15 },
  { name: 'General', value: 5 },
];

const Reports = () => {
  const { showError, showSuccess } = useToast();
  const [view, setView] = useState<'analytics' | 'generator'>('analytics');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'hospital_summary',
      title: 'Hospital Executive Summary',
      description: 'High-level overview of hospital operations and performance.',
      icon: BarChart3,
      color: 'bg-teal-500',
      category: 'General'
    },
    {
      id: 'patients',
      title: 'Patient Directory',
      description: 'Detailed list of all registered patients and their current status.',
      icon: Users,
      color: 'bg-blue-500',
      category: 'Clinical'
    },
    {
      id: 'doctors',
      title: 'Doctor Registry',
      description: 'Complete roster of medical staff by specialization and department.',
      icon: Stethoscope,
      color: 'bg-indigo-500',
      category: 'Staff'
    },
    {
      id: 'appointments',
      title: 'Appointment Log',
      description: 'Chronological record of all past and upcoming consultations.',
      icon: Calendar,
      color: 'bg-purple-500',
      category: 'Operations'
    },
    {
      id: 'billing',
      title: 'Financial Revenue Report',
      description: 'Detailed breakdown of invoices, payments, and outstanding balances.',
      icon: DollarSign,
      color: 'bg-green-500',
      category: 'Financial'
    },
    {
      id: 'beds',
      title: 'Bed Occupancy & Census',
      description: 'Real-time status of hospital room and bed utilization.',
      icon: Bed,
      color: 'bg-orange-500',
      category: 'Operations'
    },
    {
      id: 'departments',
      title: 'Department Performance',
      description: 'Analysis of departmental throughput and staff allocation.',
      icon: Building2,
      color: 'bg-cyan-500',
      category: 'Operations'
    }
  ];

  const handleGenerateReport = async (type: string, format: 'pdf' | 'excel') => {
    setIsGenerating(`${type}-${format}`);
    try {
      let data: (string | number | boolean)[][] = [];
      let headers: string[] = [];
      let title = '';
      let filename = '';
      let summaryStats: { label: string; value: string | number }[] = [];

      const filters: Record<string, string | number> = {};
      if (dateRange.from) filters.dateFrom = dateRange.from;
      if (dateRange.to) filters.dateTo = dateRange.to;    

      switch (type) {
        case 'patients': {
          const { patients } = await patientService.getPatients({ limit: 1000, ...filters });
          title = 'Patient Directory Report';
          filename = 'patient_report';
          headers = ['Code', 'Name', 'Gender', 'DOB', 'Phone', 'Status', 'Registered'];
          data = patients.map(p => [
            p.patientCode,
            p.fullName,
            p.gender,
            new Date(p.dateOfBirth).toLocaleDateString(), 
            p.phone,
            p.status,
            new Date(p.createdAt).toLocaleDateString()    
          ]);
          summaryStats = [{ label: 'Total Records', value: patients.length }];
          break;
        }

        case 'doctors': {
          const { doctors } = await doctorService.getDoctors({ limit: 1000 });
          title = 'Medical Staff Registry';
          filename = 'doctor_report';
          headers = ['Emp ID', 'Name', 'Specialization', 'Department', 'Experience', 'Status'];
          data = doctors.map(d => [
            d.employeeId,
            d.user?.fullName || 'N/A',
            d.specialization,
            d.department?.deptName || 'N/A',
            `${d.experienceYears} Years`,
            d.status
          ]);
          summaryStats = [{ label: 'Active Doctors', value: doctors.length }];
          break;
        }

        case 'appointments': {
          const { appointments } = await appointmentService.getAppointments({ limit: 1000, ...filters });
          title = 'Appointment Log Report';
          filename = 'appointment_report';
          headers = ['Code', 'Date', 'Time', 'Patient', 'Doctor', 'Type', 'Status'];
          data = appointments.map(a => [
            a.appointmentCode,
            new Date(a.appointmentDate).toLocaleDateString(),
            a.appointmentTime,
            a.patient.name,
            a.doctor.name,
            a.type,
            a.status
          ]);
          summaryStats = [{ label: 'Total Appts', value: appointments.length }];
          break;
        }

        case 'billing': {
          const { invoices } = await billingService.getInvoices({ limit: 1000, ...filters });
          title = 'Financial Revenue Report';
          filename = 'billing_report';
          headers = ['Invoice #', 'Date', 'Patient', 'Total', 'Paid', 'Balance', 'Status'];
          data = invoices.map(i => [
            i.invoiceNumber,
            new Date(i.issueDate).toLocaleDateString(),   
            i.patient.name,
            `$${i.amounts.total}`,
            `$${i.amounts.paid}`,
            `$${i.amounts.balance}`,
            i.status
          ]);
          const totalRevenue = invoices.reduce((sum, i) => sum + i.amounts.total, 0);
          summaryStats = [
            { label: 'Total Invoices', value: invoices.length },
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` }
          ];
          break;
        }

        case 'beds': {
          const { beds } = await roomService.getBeds({ limit: 1000 });
          title = 'Hospital Bed Census';
          filename = 'bed_report';
          headers = ['Bed #', 'Room', 'Type', 'Status', 'Patient'];
          data = beds.map(b => [
            b.bedNumber,
            b.room?.roomNumber || 'N/A',
            b.bedType,
            b.status,
            b.patient?.name || 'N/A'
          ]);
          summaryStats = [
            { label: 'Total Beds', value: beds.length },  
            { label: 'Occupied', value: beds.filter(b => b.status === 'OCCUPIED').length }
          ];
          break;
        }

        case 'departments': {
          const { departments } = await departmentService.getDepartments();
          title = 'Departmental Analysis';
          filename = 'department_report';
          headers = ['Code', 'Department Name', 'Doctor Count', 'Status'];
          data = departments.map(d => [
            d.code,
            d.name,
            d.doctorCount || 0,
            'ACTIVE'
          ]);
          summaryStats = [{ label: 'Departments', value: departments.length }];
          break;
        }

        case 'hospital_summary': {
          const stats = await dashboardService.getStats();
          title = 'Executive Hospital Summary';
          filename = 'executive_summary';
          headers = ['Metric', 'Current Value', 'Target', 'Status'];
          data = [
            ['Total Patients', stats.totalPatients, 'N/A', 'GOOD'],
            ['Today\'s Appointments', stats.todayAppointments, '50', stats.todayAppointments > 40 ? 'HIGH' : 'NORMAL'],
            ['Today\'s Revenue', `$${stats.todayRevenue}`, '$5,000', stats.todayRevenue > 5000 ? 'EXCEEDED' : 'ON TRACK'],
            ['Bed Occupancy', `${stats.bedOccupancyRate}%`, '85%', stats.bedOccupancyRate > 90 ? 'CRITICAL' : 'OPTIMAL'],
            ['Inpatients', stats.inpatients, 'N/A', 'N/A'],
            ['Outstanding Collections', `$${stats.pendingBills.totalAmount}`, '< $10k', 'ACTION REQ']
          ];
          summaryStats = [
            { label: 'Total Patients', value: stats.totalPatients },
            { label: 'Occupancy', value: `${stats.bedOccupancyRate}%` }
          ];
          break;
        }

        default:
          throw new Error('Invalid report type');
      }

      if (format === 'pdf') {
        exportToPDF(title, headers, data, filename, {     
          dateRange: dateRange.from ? dateRange : undefined,
          summaryStats
        });
      } else {
        exportToExcel(headers, data, filename);
      }

      showSuccess(`${format.toUpperCase()} report generated successfully`);
    } catch (error) {
      console.error(error);
      showError('Failed to generate report. Please check your data and try again.');
    } finally {
      setIsGenerating(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">   
      {/* View Switcher Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {view === 'analytics' ? 'Analytics Dashboard' : 'Enterprise Report Center'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {view === 'analytics'
              ? 'Real-time performance metrics and trends.'
              : 'Generate audit-grade documentation and data exports.'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant={view === 'analytics' ? 'default' : 'outline'}
            className={view === 'analytics' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            onClick={() => setView('analytics')}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />  
            Analytics
          </Button>
          <Button
            variant={view === 'generator' ? 'default' : 'outline'}
            className={view === 'generator' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
            onClick={() => setView('generator')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Report Center
          </Button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-2xl">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Patients</p>
                      <p className="text-2xl font-bold">1,240</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Appointments</p>
                      <p className="text-2xl font-bold">3,560</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Revenue</p>
                      <p className="text-2xl font-bold">$328K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Invoices</p>
                      <p className="text-2xl font-bold">892</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={mockRevenueData}>     
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />    
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Bar dataKey="revenue" fill="#14b8a6" name="Revenue" radius={[6, 6, 0, 0]} barSize={20} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} barSize={20} />  
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg">Departmental Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={mockDepartmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                        nameKey="name"
                      >
                        {mockDepartmentData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Action to Generator */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-1 rounded-3xl bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600"
            >
              <div className="bg-white dark:bg-gray-950 p-8 rounded-[22px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-bold">Need a formal report?</h3>
                  <p className="text-gray-500">Access our enterprise report center to generate PDF audits and machine-readable data exports.</p>
                </div>
                <Button
                  size="lg"
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 rounded-2xl px-8"       
                  onClick={() => setView('generator')}    
                >
                  Open Report Center
                  <ArrowRight className="w-4 h-4 ml-2" /> 
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="generator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Filter Toolbelt */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col lg:flex-row items-center gap-6">    
              <div className="flex items-center gap-3">   
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <Filter className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-300">Target Range</span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Start Date</Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:ring-indigo-500"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">End Date</Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:ring-indigo-500"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="rounded-xl text-gray-400"    
                  onClick={() => setDateRange({ from: '', to: new Date().toISOString().split('T')[0] })}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" /> 
                  Reset
                </Button>
              </div>
            </div>

            {/* Entity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTypes.map((report, index) => (       
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}    
                >
                  <Card className="group border-none shadow-premium bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col">
                    <div className={`h-1.5 w-full ${report.color}`} />
                    <CardHeader className="flex-1">       
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${report.color} bg-opacity-10 text-white`}>
                          <report.icon className={`w-6 h-6 ${report.color.replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                          {report.category}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">  
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-6">    
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                          className="w-full bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 rounded-xl h-11 text-xs font-bold"
                          onClick={() => handleGenerateReport(report.id, 'pdf')}
                          disabled={!!isGenerating}       
                        >
                          {isGenerating === `${report.id}-pdf` ? '...' : (
                            <><Download className="w-3.5 h-3.5 mr-2" /> PDF</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-gray-100 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl h-11 text-xs font-bold"
                          onClick={() => handleGenerateReport(report.id, 'excel')}
                          disabled={!!isGenerating}       
                        >
                          {isGenerating === `${report.id}-excel` ? '...' : 'EXCEL'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
