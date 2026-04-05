// User & Authentication Types
export interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  profileImage?: string;
  role: Role;
}

export interface Role {
  roleId: number;
  roleName: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Patient Types
export interface Patient {
  patientId: number;
  patientCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  insurance?: {
    provider?: string;
    number?: string;
  };
  medicalInfo?: {
    allergies?: string;
    chronicConditions?: string;
  };
  status: 'INPATIENT' | 'OUTPATIENT' | 'DISCHARGED';
  admissionDate?: string;
  dischargeDate?: string;
  assignedDoctor?: {
    doctorId: number;
    name: string;
    specialization: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Doctor Types
export interface Doctor {
  doctorId: number;
  employeeId: string;
  user: {
    userId: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone?: string;
    profileImage?: string;
  };
  specialization: string;
  qualification?: string;
  experienceYears: number;
  consultationFee: number;
  licenseNumber: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  rating: number;
  patientsSeen: number;
  bio?: string;
  department?: {
    deptId: number;
    deptName: string;
    deptCode: string;
  } | null;
  schedule?: DoctorSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  scheduleId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
  isAvailable: boolean;
}

// Appointment Types
export interface Appointment {
  appointmentId: number;
  appointmentCode: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'SURGERY' | 'CHECKUP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  patient: {
    patientId: number;
    patientCode: string;
    name: string;
    phone?: string;
    gender?: string;
  };
  doctor: {
    doctorId: number;
    name: string;
    specialization: string;
    department?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Billing Types
export interface Invoice {
  invoiceId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amounts: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid: number;
    balance: number;
  };
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  patient: {
    patientId: number;
    patientCode: string;
    name: string;
    phone?: string;
  };
  appointment?: {
    appointmentId: number;
    appointmentCode: string;
  } | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  itemId: number;
  itemType: 'CONSULTATION' | 'PROCEDURE' | 'MEDICATION' | 'ROOM_CHARGE' | 'LAB_TEST' | 'OTHER';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  paymentId: number;
  paymentDate: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'CHECK' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE';
  transactionId?: string;
  notes?: string;
  createdBy?: string;
}

// Room Types
export interface Room {
  roomId: number;
  roomNumber: string;
  roomType: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU' | 'OPERATION' | 'EMERGENCY';
  floor: number;
  capacity: number;
  rentPerDay: number;
  facilities: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  department?: {
    deptId: number;
    deptName: string;
    deptCode: string;
  } | null;
  bedStats: {
    total: number;
    occupied: number;
    available: number;
  };
  beds?: Bed[];
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  bedId: number;
  bedNumber: string;
  bedType: 'STANDARD' | 'ELECTRIC' | 'ICU' | 'PEDIATRIC';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  room?: {
    roomId: number;
    roomNumber: string;
    roomType: string;
    floor: number;
  };
  patient?: {
    patientId: number;
    patientCode: string;
    name: string;
    assignedDate: string;
    status: string;
  } | null;
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  totalAppointments: number;
  todayRevenue: number;
  monthRevenue: number;
  bedOccupancyRate: number;
  inpatients: number;
  outpatients: number;
  pendingBills: {
    count: number;
    totalAmount: number;
  };
}

export interface ChartData {
  month: string;
  appointments?: number;
  completed?: number;
  cancelled?: number;
  revenue?: number;
  collected?: number;
}

export interface DoctorPerformance {
  doctorId: number;
  doctorName: string;
  specialty: string;
  department?: string;
  patientsSeen: number;
  assignedPatients: number;
  completedAppointments: number;
  totalRevenue: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter Types
export interface PatientFilter extends PaginationParams {
  search?: string;
  status?: string;
  doctorId?: string;
}

export interface AppointmentFilter extends PaginationParams {
  patientId?: string;
  doctorId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceFilter extends PaginationParams {
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
