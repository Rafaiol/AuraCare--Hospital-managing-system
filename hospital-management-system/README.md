# AuraCare Hospital Management System

A comprehensive, full-stack Hospital Management System built with modern technologies. This system provides complete management of hospital operations including patient records, doctor schedules, appointments, billing, room management, and detailed analytics.

![Dashboard Preview](https://via.placeholder.com/800x400?text=AuraCare+Dashboard)

## Features

### Core Modules

- **Authentication & Authorization**
  - JWT-based secure authentication
  - Role-based access control (Admin, Doctor, Nurse, Receptionist)
  - Password encryption with bcrypt

- **Dashboard**
  - Real-time statistics and KPIs
  - Interactive charts (Revenue, Appointments, Patient demographics)
  - Doctor performance metrics
  - Today's appointments overview

- **Patient Management**
  - Complete patient records with medical history
  - Admission and discharge tracking
  - Advanced search and filtering
  - Export to PDF

- **Doctor Management**
  - Doctor profiles and specializations
  - Availability schedules
  - Performance tracking
  - Patient assignments

- **Appointment System**
  - Online booking with availability check
  - Calendar view
  - Status tracking (Scheduled, Confirmed, Completed, Cancelled)
  - Automated notifications

- **Billing & Payments**
  - Invoice generation
  - Payment processing
  - Revenue reports
  - Outstanding balance tracking

- **Room & Bed Management**
  - Real-time bed occupancy tracking
  - Room assignments
  - Bed type management
  - Occupancy analytics

- **Reports & Analytics**
  - Comprehensive reporting
  - Export to PDF
  - Date range filtering
  - Department-wise analytics

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: Oracle Database (with connection pooling)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, cors, express-rate-limit
- **Documentation**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Redux Toolkit
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # API controllers
│   ├── database/         # Database schema and seed scripts
│   ├── middlewares/      # Express middlewares
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Layout components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Redux store
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   ├── index.html
│   └── package.json
└── README.md
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Oracle Database** (19c or higher, or Oracle XE)
3. **Oracle Instant Client** (for local development)
4. **npm** or **yarn**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hospital-management-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# ORACLE_USER=system
# ORACLE_PASSWORD=your_password
# ORACLE_CONNECTION_STRING=localhost:1521/XEPDB1
# JWT_SECRET=your_super_secret_key

# Initialize database (run schema.sql in Oracle)
sqlplus username/password@database @database/schema.sql

# Seed the database with sample data
npm run seed

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | smith@hospital.com | doctor123 |
| Nurse | wilson@hospital.com | nurse123 |
| Receptionist | taylor@hospital.com | recep123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/appointments-chart` - Appointments chart data
- `GET /api/dashboard/revenue-chart` - Revenue chart data
- `GET /api/dashboard/doctor-performance` - Doctor performance metrics

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - List doctors
- `POST /api/doctors` - Create doctor
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/:id/schedule` - Get doctor schedule

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Complete appointment

### Billing
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/invoices` - Create invoice
- `POST /api/billing/payments` - Process payment

### Rooms
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `POST /api/rooms/beds/:bedId/assign` - Assign bed to patient

### Reports
- `GET /api/reports/summary` - Summary report
- `GET /api/reports/patients` - Patient report
- `GET /api/reports/revenue` - Revenue report

## Database Schema

The system uses Oracle Database with the following main tables:

- **USERS** - System users and authentication
- **ROLES** - User roles and permissions
- **DOCTORS** - Doctor profiles
- **PATIENTS** - Patient records
- **APPOINTMENTS** - Appointment scheduling
- **INVOICES** - Billing invoices
- **ROOMS** - Hospital rooms
- **BEDS** - Room beds
- **MEDICAL_HISTORY** - Patient medical records

## Performance Optimizations

### Backend
- Database connection pooling
- Optimized SQL queries with indexes
- Stored procedures for complex operations
- Pagination for large datasets
- Database views for reporting

### Frontend
- Code splitting and lazy loading
- Redux for state management
- Memoization with React.memo and useMemo
- Optimized re-renders
- Responsive design

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- SQL injection prevention
- Input validation

## Environment Variables

### Backend (.env)
```
ORACLE_USER=system
ORACLE_PASSWORD=your_password
ORACLE_CONNECTION_STRING=localhost:1521/XEPDB1
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@auracare.com or open an issue in the repository.

---

Built with ❤️ by the AuraCare Team
