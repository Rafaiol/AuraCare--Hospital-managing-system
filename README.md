# 🏥 Hospital Management System (HMS)

A modern, full-stack hospital management solution designed to streamline healthcare operations, enhance patient care, and automate administrative tasks. Built with a robust **PERN** stack (PostgreSQL, Express, React, Node.js) and styled with **Tailwind CSS**.

---

## 🌟 Key Features

- **📊 Dynamic Dashboard**: Real-time analytics, revenue tracking, and patient distribution visualization.
- **👩‍⚕️ Doctor & Patient Management**: Comprehensive profiles, medical history tracking, and schedule management.
- **📅 Advanced Appointment System**: Intuitive calendar views, conflict-free scheduling, and status tracking.
- **💳 Billing & Invoicing**: Automated invoice generation, payment processing, and multi-format exports (PDF/Excel).
- **🛏️ Room & Bed Occupancy**: Real-time tracking of ward availability and patient assignments.
- **📈 Professional Reporting**: Detailed data exports for administrative analysis and financial audits.
- **🔐 Role-Based Access Control (RBAC)**: Secure access for Admins, Doctors, Nurses, and Receptionists.
- **🔔 Notifications System**: Internal alerts and communication channels for staff coordination.

---

### Frontend

- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) Primitives, [Lucide React](https://lucide.dev/) (Icons)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Data Tables**: [TanStack Table v8](https://tanstack.com/table/v8)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Exports**: [jsPDF](https://github.com/parallax/jsPDF), [SheetJS (XLSX)](https://sheetjs.com/)

### Backend

- **Runtime**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via `node-postgres`)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/), [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **Security**: [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Express Rate Limit](https://github.com/n67/express-rate-limit)
- **Documentation**: [Swagger / OpenAPI 3.0](https://swagger.io/)
- **Logging**: [Winston](https://github.com/winstonjs/winston), [Morgan](https://github.com/expressjs/morgan)

---

## 🏗️ Architecture Overview

The project follows a decoupled client-server architecture:
- **`app/`**: A high-performance React SPA served by Vite.
- **`hospital-management-system/backend/`**: A scalable RESTful API with PostgreSQL database persistence.

---

## 🔧 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- npm / yarn

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd hospital-manager
   ```

2. **Backend Setup**:

   ```bash
   cd hospital-management-system/backend
   npm install
   cp .env.example .env
   # Update .env with your PostgreSQL credentials
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**:

   ```bash
   cd app
   npm install
   npm run dev
   ```

---

## ✨ What Can Be Improved?

Looking to take this project to the next level? Here are some top recommendations:

1. **🛜 Real-Time Updates**: Integrate **Socket.io** for live synchronization of bed occupancy and appointment status across all active staff terminals.
2. **🤖 AI Diagnostics**: Implement a machine learning module to suggest possible diagnoses based on historical patient symptoms and medical records.
3. **📹 Telemedicine Suite**: Add WebRTC-powered video consultations to allow doctors to see patients remotely.
4. **📱 Mobile Companion WebApp**: Optimize the UI for mobile/tablet usage or build a Progressive Web App (PWA) for doctors on rotations.
5. **🌐 Internationalization (i18n)**: Support multiple languages to make the healthcare system accessible to diverse patient demographics.
6. **💊 Pharmacy Integration**: Build an inventory management module for medications, tracking stock levels, and expiration dates.

---

## 📄 License

This project is licensed under the MIT License.
