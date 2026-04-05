# Hospital Management System - Backend API

A comprehensive RESTful API for Hospital Management System built with Node.js, Express.js, and PostgreSQL Database.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Management**: Complete CRUD operations with medical history
- **Doctor Management**: Doctor profiles, schedules, and performance tracking
- **Appointment System**: Booking, scheduling, and calendar management
- **Billing & Payments**: Invoice generation and payment processing
- **Room & Bed Management**: Bed assignment and occupancy tracking
- **Reports & Analytics**: Comprehensive reporting with charts and statistics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL (with node-postgres/pg)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, cors, express-rate-limit
- **Documentation**: Swagger/OpenAPI 3.0

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd hospital-management-system/backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize the database**:

   ```bash
   # Run the initialization script
   node init-schema.js

   # Seed the database with sample data
   npm run seed
   ```

5. **Start the server**:

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PGUSER` | PostgreSQL database username | postgres |
| `PGPASSWORD` | PostgreSQL database password | - |
| `PGHOST` | PostgreSQL host | localhost |
| `PGPORT` | PostgreSQL port | 5432 |
| `PGDATABASE` | PostgreSQL database name | hospital_db |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## API Documentation

Once the server is running, access the Swagger documentation at:

```text
http://localhost:5000/api-docs
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/appointments-chart` - Get appointments chart data
- `GET /api/dashboard/revenue-chart` - Get revenue chart data
- `GET /api/dashboard/patients-by-department` - Get patients by department
- `GET /api/dashboard/doctor-performance` - Get doctor performance metrics
- `GET /api/dashboard/today-appointments` - Get today's appointments
- `GET /api/dashboard/recent-activities` - Get recent activities

### Patients

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/medical-history` - Get medical history
- `POST /api/patients/:id/medical-history` - Add medical history
- `GET /api/patients/:id/appointments` - Get patient appointments

### Doctors

- `GET /api/doctors` - List all doctors
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/specializations` - Get all specializations
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/:id/patients` - Get doctor's patients
- `GET /api/doctors/:id/schedule` - Get doctor's schedule
- `POST /api/doctors/:id/schedule` - Update doctor's schedule
- `GET /api/doctors/:id/available-slots` - Get available time slots

### Appointments

- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/calendar` - Get calendar data
- `GET /api/appointments/statistics` - Get appointment statistics
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Complete appointment

### Billing

- `GET /api/billing/invoices` - List all invoices
- `POST /api/billing/invoices` - Create new invoice
- `GET /api/billing/invoices/:id` - Get invoice details
- `GET /api/billing/payments` - List all payments
- `POST /api/billing/payments` - Process payment
- `GET /api/billing/statistics` - Get billing statistics

### Rooms

- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/statistics` - Get room statistics
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `GET /api/rooms/beds/all` - List all beds
- `POST /api/rooms/beds/:bedId/assign` - Assign bed to patient
- `POST /api/rooms/beds/:bedId/discharge` - Discharge patient from bed

### Reports

- `GET /api/reports/summary` - Get summary report
- `GET /api/reports/patients` - Get patient report
- `GET /api/reports/appointments` - Get appointment report
- `GET /api/reports/revenue` - Get revenue report
- `GET /api/reports/doctors` - Get doctor performance report
- `GET /api/reports/bed-occupancy` - Get bed occupancy report

## Database Schema

The database schema includes the following main tables:

- **ROLES** - User roles and permissions
- **DEPARTMENTS** - Hospital departments
- **USERS** - System users
- **DOCTORS** - Doctor profiles
- **DOCTOR_SCHEDULES** - Doctor availability schedules
- **PATIENTS** - Patient records
- **MEDICAL_HISTORY** - Patient medical history
- **ROOMS** - Hospital rooms
- **BEDS** - Room beds
- **PATIENT_BEDS** - Bed assignments
- **APPOINTMENTS** - Appointment records
- **INVOICES** - Billing invoices
- **INVOICE_ITEMS** - Invoice line items
- **BILLING_PAYMENTS** - Payment records

## Default Login Credentials

After running the seed script, you can log in with:

| Role | Email | Password |
|----------|-------------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | smith@hospital.com | doctor123 |
| Nurse | wilson@hospital.com | nurse123 |
| Receptionist | taylor@hospital.com | recep123 |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention (parameterized queries)

## Performance Optimizations

- Database connection pooling
- Optimized queries with indexes
- Pagination for large datasets
- Simplified query structures for PostgreSQL
- Efficient reporting calculations

## License

MIT
