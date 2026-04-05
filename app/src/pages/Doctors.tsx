import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type RootState, type AppDispatch } from '@/store';
import { setDoctors, setSelectedDoctor } from '@/store/slices/doctorSlice';
import { doctorService } from '@/services/doctorService';
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
import { Plus, Search, MoreVertical, Edit, Calendar, Users } from 'lucide-react';
import type { Doctor } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const Doctors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useToast();
  const { doctors, totalDoctors, currentPage, totalPages, isLoading } = useSelector(
    (state: RootState) => state.doctors
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const fetchDoctors = async () => {
    try {
      const result = await doctorService.getDoctors({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      });
      dispatch(
        setDoctors({
          doctors: result.doctors,
          total: result.pagination.total,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        })
      );
    } catch (_error) {
      showError('Failed to load doctors');
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchDoctors();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      ON_LEAVE: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns: ColumnDef<Doctor>[] = [
    {
      accessorKey: 'employeeId',
      header: 'Employee ID',
    },
    {
      accessorKey: 'user.fullName',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return <span className="text-gray-500">System Doctor</span>;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="font-medium text-teal-600">
                {user.firstName?.charAt(0) || ''}
                {user.lastName?.charAt(0) || ''}
              </span>
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
    },
    {
      accessorKey: 'department.deptName',
      header: 'Department',
      cell: ({ row }) => row.original.department?.deptName || 'N/A',
    },
    {
      accessorKey: 'experienceYears',
      header: 'Experience',
      cell: ({ row }) => `${row.original.experienceYears} years`,
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
            <DropdownMenuItem onClick={() => {
              dispatch(setSelectedDoctor(row.original));
              navigate(`/doctors/${row.original.doctorId}`);
            }}>
              <Users className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/doctors/${row.original.doctorId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/doctors/${row.original.doctorId}/schedule`)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctors</h1>
          <p className="text-gray-500">Manage doctor profiles and schedules</p>
        </motion.div>
        {user?.role?.roleName === 'ADMIN' && (
          <Button
            onClick={() => navigate('/doctors/new')}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        )}
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
            placeholder="Search doctors by name, specialty or ID..."
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
          data={doctors}
          isLoading={isLoading}
          pagination={{
            page: currentPage,
            limit: 10,
            total: totalDoctors,
            totalPages,
          }}
          onPageChange={(page: number) =>
            dispatch(setDoctors({ doctors, total: totalDoctors, page, totalPages }))
          }
        />
      </motion.div>
    </div>
  );
};

export default Doctors;
