import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type RootState } from '@/store';
import { motion } from 'framer-motion';
import { roomService } from '@/services/roomService';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Bed, Users, CheckCircle, Search, User } from 'lucide-react';
import type { Room } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const Rooms = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedBedToAssign, setSelectedBedToAssign] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [assigningPatient, setAssigningPatient] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBedForDetail, setSelectedBedForDetail] = useState<any>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [allBeds, setAllBeds] = useState<any[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [bedSearchQuery, setBedSearchQuery] = useState('');

  const fetchAllBeds = async () => {
    try {
      const result = await roomService.getBeds({ limit: 500 });
      setAllBeds(result.beds);
    } catch {
      console.error('Failed to load all beds');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStatistics();
    fetchPatients();
    fetchAllBeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchPatients = async () => {
    try {
      // Import patientService dynamically or ensure it's imported at top
      const { patientService } = await import('@/services/patientService');
      const result = await patientService.getPatients({ limit: 100, status: 'OUTPATIENT' });
      setPatients(result.patients);
    } catch {
      console.error('Failed to fetch patients for assignment');
    }
  };

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const result = await roomService.getRooms({
        page: pagination.page,
        limit: 10,
      });
      setRooms(result.rooms);
      setPagination(result.pagination);
    } catch {
      showError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatientId || !selectedBedToAssign) {
      showError('Please select a patient to assign');
      return;
    }
    setAssigningPatient(true);
    try {
      // Use the correct method name from roomService
      await roomService.assignBed(selectedBedToAssign.bedId, Number(selectedPatientId));
      showSuccess('Patient assigned successfully!');
      setAssignDialogOpen(false);
      setSelectedPatientId('');
      fetchRooms();
      fetchStatistics();
      fetchAllBeds();
      fetchPatients();
      // Update selected room state to reflect the change
      const updatedRoom = await roomService.getRoomById(selectedRoom!.roomId);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom as any);
        // Also update the detail view if it was the same bed
        const freshBed = updatedRoom.beds?.find(b => b.bedId === selectedBedToAssign?.bedId);
        if (freshBed) setSelectedBedForDetail(freshBed);
      }
    } catch {
      showError('Failed to assign patient');
    } finally {
      setAssigningPatient(false);
    }
  };

  const handleDischargePatient = async (bed: any) => {
    if (!window.confirm(`Are you sure you want to discharge the patient from Bed ${bed.bedNumber}?`)) {
      return;
    }

    try {
      await roomService.dischargePatient(bed.bedId);
      showSuccess('Patient discharged successfully!');
      fetchRooms();
      fetchStatistics();
      fetchAllBeds();
      fetchPatients();

      const updatedRoom = await roomService.getRoomById(selectedRoom!.roomId);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom as any);
        // Also update the detail view
        const freshBed = updatedRoom.beds?.find(b => b.bedId === bed.bedId);
        if (freshBed) setSelectedBedForDetail(freshBed);
      }
    } catch {
      showError('Failed to discharge patient');
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await roomService.getRoomStatistics();
      setStatistics(stats);
    } catch {
      console.error('Failed to load statistics');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      AVAILABLE: 'default',
      OCCUPIED: 'secondary',
      MAINTENANCE: 'destructive',
      RESERVED: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'roomNumber',
      header: 'Room #',
    },
    {
      accessorKey: 'roomType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.roomType.toLowerCase().replace('_', ' ')}</span>
      ),
    },
    {
      accessorKey: 'floor',
      header: 'Floor',
    },
    {
      accessorKey: 'department.deptName',
      header: 'Department',
      cell: ({ row }) => row.original.department?.deptName || 'N/A',
    },
    {
      accessorKey: 'bedStats',
      header: 'Occupancy',
      cell: ({ row }) => {
        const { total, occupied } = row.original.bedStats;
        const percentage = total > 0 ? (occupied / total) * 100 : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-sm mb-1">
              <span>{occupied}/{total}</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      },
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
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const roomDetails = await roomService.getRoomById(row.original.roomId);
                  setSelectedRoom(roomDetails as any);
                  if (roomDetails.beds && roomDetails.beds.length > 0) {
                    setSelectedBedForDetail(roomDetails.beds[0]);
                  } else {
                    setSelectedBedForDetail(null);
                  }
                  setRoomDialogOpen(true);
                } catch (error) {
                  showError('Failed to load room details');
                }
              }}
            >
              <Bed className="w-4 h-4 mr-2" />
              View Beds
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const renderPremiumBedCard = (bed: any) => (
    <div
      key={bed.bedId}
      className={cn(
        "p-6 rounded-2xl border flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group",
        bed.status === 'AVAILABLE' ? "border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-900/40 dark:to-gray-900 dark:border-green-800" :
          bed.status === 'OCCUPIED' ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/40 dark:to-gray-900 dark:border-blue-800" :
            "border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 dark:border-gray-700"
      )}
    >
      {/* Decorative background circle */}
      <div className={cn(
        "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150",
        bed.status === 'AVAILABLE' ? 'bg-green-500' : bed.status === 'OCCUPIED' ? 'bg-blue-500' : 'bg-gray-500'
      )} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Bed className={cn("w-6 h-6", bed.status === 'OCCUPIED' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400')} />
            <span className="font-extrabold text-2xl text-gray-900 dark:text-gray-100 tracking-tight">{bed.bedNumber}</span>
          </div>
          {bed.room && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">Room: {bed.room.roomNumber}</p>}
        </div>
        <Badge className={cn(
          "px-3 py-1 shadow-sm font-semibold rounded-full",
          bed.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 border focus:ring-0 border-green-200' :
            bed.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800 border focus:ring-0 border-blue-200' :
              'bg-gray-100 text-gray-800 border focus:ring-0 border-gray-200'
        )}>
          {bed.status}
        </Badge>
      </div>

      {bed.bedType && <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-4 relative z-10">{bed.bedType.toLowerCase()} Bed</p>}

      <div className="flex-1 relative z-10 flex flex-col justify-end mt-2">
        {bed.patient ? (
          <div className="mb-5 p-4 bg-white/60 backdrop-blur-md dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full flex-shrink-0">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <p className="text-base font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                {bed.patient.name || 'Unknown Patient'}
              </p>
            </div>
            {bed.patient.assignedDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 ml-10">
                Admitted: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(bed.patient.assignedDate).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="mb-5 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center bg-white/40 dark:bg-gray-800/30 min-h-[90px]">
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 flex items-center gap-2">
              Empty Bed
            </p>
          </div>
        )}

        <div className="mt-auto">
          {bed.status === 'AVAILABLE' && (
            <Button
              variant="outline"
              className="w-full bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-800 shadow-sm transition-colors rounded-lg font-semibold"
              onClick={() => {
                setSelectedBedToAssign(bed);
                setAssignDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Assign Patient
            </Button>
          )}
          {bed.status === 'OCCUPIED' && (
            <Button
              variant="outline"
              className="w-full bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 shadow-sm transition-colors rounded-lg font-semibold"
              onClick={() => handleDischargePatient(bed)}
            >
              Discharge Patient
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room & Bed Management</h1>
          <p className="text-gray-500">Manage hospital rooms and bed assignments</p>
        </div>
        <div className="flex gap-2 items-center">
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="overview">Rooms View</TabsTrigger>
            <TabsTrigger value="beds">All Beds</TabsTrigger>
          </TabsList>
          {user?.role?.roleName === 'ADMIN' && (
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={() => navigate('/rooms/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          )}
        </div>
      </motion.div>

      <TabsContent value="overview" className="space-y-6 outline-none !mt-0">

        {/* Statistics */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Beds</p>
                  <p className="text-2xl font-bold">{statistics.overall.TOTAL_BEDS}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-2xl font-bold">{statistics.overall.AVAILABLE_BEDS}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupied</p>
                  <p className="text-2xl font-bold">{statistics.overall.OCCUPIED_BEDS}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bed className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Inpatients</p>
                  <p className="text-2xl font-bold">{statistics.overall.TOTAL_INPATIENTS}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DataTable
            columns={columns}
            data={rooms}
            pagination={pagination}
            onPageChange={(page) => setPagination({ ...pagination, page })}
            isLoading={isLoading}
          />
        </motion.div>

      </TabsContent>

      <TabsContent value="beds" className="space-y-6 outline-none !mt-0">
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search beds or patient name..."
              value={bedSearchQuery}
              onChange={(e) => setBedSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allBeds
            .filter(bed => {
              if (!bedSearchQuery) return true;
              const term = bedSearchQuery.toLowerCase();
              const matchBed = bed.bedNumber.toLowerCase().includes(term);
              const matchPatient = bed.patient ?
                (bed.patient.name || '').toLowerCase().includes(term) : false;
              return matchBed || matchPatient;
            })
            .map(bed => renderPremiumBedCard(bed))}
        </div>
      </TabsContent>

      {/* Room Details Dialog (Master-Detail View) */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[500px] flex flex-col p-0 overflow-hidden rounded-xl border-gray-200 dark:border-gray-800">
          <div className="flex h-full">
            {/* Sidebar List */}
            <div className="w-96 bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Room {selectedRoom?.roomNumber}</span>
                <Badge variant="outline" className="text-[10px] bg-white dark:bg-gray-800">{selectedRoom?.roomType}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {selectedRoom?.beds?.map((bed) => {
                  const isSelected = selectedBedForDetail?.bedId === bed.bedId;
                  const isOccupied = bed.status === 'OCCUPIED';
                  return (
                    <button
                      key={bed.bedId}
                      onClick={() => setSelectedBedForDetail(bed)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                        isSelected
                          ? "bg-white shadow-sm ring-1 ring-gray-200 text-gray-900 dark:bg-gray-800 dark:ring-gray-700 dark:text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{bed.bedNumber}</span>
                        <span className="text-[11px] text-gray-500 truncate w-48">
                          {isOccupied && bed.patient ? bed.patient.name : bed.status}
                        </span>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isOccupied ? "bg-blue-500" : bed.status === 'AVAILABLE' ? "bg-green-500" : "bg-gray-300"
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-gray-950 flex flex-col relative">
              {selectedBedForDetail ? (
                <div className="flex-1 overflow-y-auto p-8 border-l-0">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        selectedBedForDetail.status === 'OCCUPIED' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30" :
                          selectedBedForDetail.status === 'AVAILABLE' ? "bg-green-50 text-green-600 dark:bg-green-900/30" : "bg-gray-100 text-gray-500"
                      )}>
                        <Bed className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBedForDetail.bedNumber}</h2>
                        <p className="text-sm text-gray-500 capitalize">{selectedBedForDetail.bedType?.toLowerCase()} Type</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "px-3 py-1 font-medium",
                      selectedBedForDetail.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        selectedBedForDetail.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    )}>
                      {selectedBedForDetail.status}
                    </Badge>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-8" />

                  {/* Body Content */}
                  {selectedBedForDetail.patient ? (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Patient Details</h3>

                      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Full Name</span>
                          <span className="text-base font-semibold text-gray-900 dark:text-white">
                            {selectedBedForDetail.patient.name || 'Unknown Patient'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Patient ID</span>
                          <span className="text-base font-semibold text-gray-900 dark:text-white">
                            {selectedBedForDetail.patient.patientCode || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Admission Date</span>
                          <span className="text-base font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedBedForDetail.patient.assignedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Status</span>
                          <span className="text-base font-semibold text-teal-600">INPATIENT</span>
                        </div>
                      </div>

                      <div className="mt-12 flex justify-start">
                        <Button
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto mt-4"
                          onClick={() => handleDischargePatient(selectedBedForDetail)}
                        >
                          Discharge Patient
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-64 text-center mt-12">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200 dark:border-gray-800">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Bed is Available</h3>
                      <p className="text-gray-500 text-sm max-w-sm mt-2 mb-6">
                        There is currently no patient assigned to this bed. You can assign one from the outpatient list.
                      </p>
                      {selectedBedForDetail.status === 'AVAILABLE' && (
                        <Button
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => {
                            setSelectedBedToAssign(selectedBedForDetail);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Assign Patient
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                  <Bed className="w-12 h-12 mb-4 opacity-50" />
                  <p>Select a bed to view details</p>
                </div>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">Room bed details master-detail view.</DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Assign Patient Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Patient to Bed {selectedBedToAssign?.bedNumber}</DialogTitle>
            <DialogDescription className="sr-only">Search and assign an outpatient to the selected bed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Outpatients</label>
              <Input
                placeholder="Search patient by name or ID..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="mb-2"
              />
              <select
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                size={5}
              >
                <option value="">-- Choose a Patient --</option>
                {patients
                  .filter(p => !patientSearchQuery ||
                    (p.firstName || '').toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                    (p.lastName || '').toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                    (p.patientCode || '').toLowerCase().includes(patientSearchQuery.toLowerCase())
                  )
                  .map(p => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.patientCode} - {p.firstName} {p.lastName}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigningPatient}>
                Cancel
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleAssignPatient} disabled={assigningPatient}>
                {assigningPatient ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default Rooms;
