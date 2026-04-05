import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { setPatients } from '@/store/slices/patientSlice';
import { patientService } from '@/services/patientService';
import { useToast } from '@/hooks/useToast';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Calendar, User, Download, FileText, FileSpreadsheet } from 'lucide-react';
import type { Patient } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

const Patients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useToast();
  const { patients, totalPatients, currentPage, totalPages, isLoading } = useSelector(
    (state: RootState) => state.patients
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const fetchPatients = async () => {
    try {
      const result = await patientService.getPatients({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      });
      dispatch(
        setPatients({
          patients: result.patients,
          total: result.pagination.total,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        })
      );
    } catch (_error) {
      showError('Failed to load patients');
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchPatients();
  };

  const getExportData = () => {
    return patients.map(p => ({
      'Patient ID': p.patientCode,
      'First Name': p.firstName,
      'Last Name': p.lastName,
      'Email': p.email || 'N/A',
      'Gender': p.gender,
      'Phone': p.phone || 'N/A',
      'Blood Group': p.bloodGroup || 'N/A',
      'Status': p.status
    }));
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map(obj => Object.values(obj));
    exportToPDF('Patient Directory Report', headers, rows, 'Patients_Report');
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map(obj => Object.values(obj));
    exportToExcel(headers, rows, 'Patients_Report');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      INPATIENT: 'default',
      OUTPATIENT: 'secondary',
      DISCHARGED: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'patientCode',
      header: 'Patient ID',
    },
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="font-medium text-teal-600">
              {row.original.firstName.charAt(0)}
              {row.original.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-sm text-gray-500">{row.original.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'bloodGroup',
      header: 'Blood Group',
      cell: ({ row }) => row.original.bloodGroup || 'N/A',
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
            <DropdownMenuItem onClick={() => navigate(`/patients/${row.original.patientId}`)}>
              <User className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/patients/${row.original.patientId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/appointments/new?patientId=${row.original.patientId}`)}>
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-500">Manage patient records and information</p>
        </motion.div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user?.role?.roleName || '') && (
            <Button
              onClick={() => navigate('/patients/new')}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </form>
        <Button variant="outline" onClick={() => handleSearch()}>
          Search
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DataTable
          columns={columns}
          data={patients}
          isLoading={isLoading}
          pagination={{
            page: currentPage,
            limit: 10,
            total: totalPatients,
            totalPages,
          }}
          onPageChange={(page: number) =>
            dispatch(setPatients({ patients, total: totalPatients, page, totalPages }))
          }
        />
      </motion.div>
    </div>
  );
};

export default Patients;
