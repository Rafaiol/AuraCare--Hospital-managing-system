/**
 * Dashboard Controller
 * Handles dashboard statistics and analytics
 */
const { executeQuery } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // Use the view for efficient stats retrieval
  let stats;
  try {
    const statsResult = await executeQuery('SELECT * FROM V_DASHBOARD_STATS');
    stats = statsResult.rows[0];
  } catch (e) {
    // If view does not exist yet handle fallback
    stats = {
      TOTAL_PATIENTS: 0, TOTAL_DOCTORS: 0, TODAY_APPOINTMENTS: 0,
      TOTAL_APPOINTMENTS: 0, TODAY_REVENUE: 0, MONTH_REVENUE: 0,
      TOTAL_BEDS: 0, OCCUPIED_BEDS: 0
    };
  }

  // Calculate bed occupancy rate manually as the VIEW doesn't include the percentage
  stats.BED_OCCUPANCY_RATE = stats.TOTAL_BEDS > 0
    ? Math.round((stats.OCCUPIED_BEDS / stats.TOTAL_BEDS) * 100 * 100) / 100
    : 0;

  // Get additional stats
  const inpatientResult = await executeQuery(
    `SELECT COUNT(*) as count FROM PATIENTS WHERE STATUS = 'INPATIENT'`
  );

  const outpatientResult = await executeQuery(
    `SELECT COUNT(*) as count FROM PATIENTS WHERE STATUS = 'OUTPATIENT'`
  );

  const pendingBillsResult = await executeQuery(
    `SELECT COUNT(*) as count, COALESCE(SUM(BALANCE_AMOUNT), 0) as total FROM INVOICES WHERE STATUS IN ('PENDING', 'OVERDUE')`
  );

  res.json({
    success: true,
    data: {
      totalPatients: stats.TOTAL_PATIENTS || 0,
      totalDoctors: stats.TOTAL_DOCTORS || 0,
      todayAppointments: stats.TODAY_APPOINTMENTS || 0,
      totalAppointments: stats.TOTAL_APPOINTMENTS || 0,
      todayRevenue: Number(stats.TODAY_REVENUE) || 0,
      monthRevenue: Number(stats.MONTH_REVENUE) || 0,
      bedOccupancyRate: stats.BED_OCCUPANCY_RATE || 0,
      inpatients: inpatientResult.rows[0] ? inpatientResult.rows[0].COUNT : 0,
      outpatients: outpatientResult.rows[0] ? outpatientResult.rows[0].COUNT : 0,
      pendingBills: {
        count: pendingBillsResult.rows[0] ? pendingBillsResult.rows[0].COUNT : 0,
        totalAmount: pendingBillsResult.rows[0] ? pendingBillsResult.rows[0].TOTAL : 0
      }
    }
  });
});

/**
 * @desc    Get appointments per month for chart
 * @route   GET /api/dashboard/appointments-chart
 * @access  Private
 */
const getAppointmentsChart = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const result = await executeQuery(
    `SELECT 
      EXTRACT(MONTH FROM APPOINTMENT_DATE) as month,
      COUNT(*) as appointments,
      COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN STATUS = 'CANCELLED' THEN 1 END) as cancelled
     FROM APPOINTMENTS
     WHERE EXTRACT(YEAR FROM APPOINTMENT_DATE) = $1
     GROUP BY EXTRACT(MONTH FROM APPOINTMENT_DATE)
     ORDER BY month`,
    [parseInt(year)]
  );

  // Format data for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = months.map((month, index) => {
    const monthData = result.rows.find(r => parseInt(r.MONTH) === index + 1);
    return {
      month,
      appointments: monthData ? Number(monthData.APPOINTMENTS) : 0,
      completed: monthData ? Number(monthData.COMPLETED) : 0,
      cancelled: monthData ? Number(monthData.CANCELLED) : 0
    };
  });

  res.json({
    success: true,
    data: chartData
  });
});

/**
 * @desc    Get revenue trend for chart
 * @route   GET /api/dashboard/revenue-chart
 * @access  Private
 */
const getRevenueChart = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const result = await executeQuery(
    `SELECT 
      EXTRACT(MONTH FROM ISSUE_DATE) as month,
      COALESCE(SUM(TOTAL_AMOUNT), 0) as revenue,
      COALESCE(SUM(PAID_AMOUNT), 0) as collected
     FROM INVOICES
     WHERE EXTRACT(YEAR FROM ISSUE_DATE) = $1
     GROUP BY EXTRACT(MONTH FROM ISSUE_DATE)
     ORDER BY month`,
    [parseInt(year)]
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = months.map((month, index) => {
    const monthData = result.rows.find(r => parseInt(r.MONTH) === index + 1);
    return {
      month,
      revenue: monthData ? Number(monthData.REVENUE) : 0,
      collected: monthData ? Number(monthData.COLLECTED) : 0
    };
  });

  res.json({
    success: true,
    data: chartData
  });
});

/**
 * @desc    Get patients by department for chart
 * @route   GET /api/dashboard/patients-by-department
 * @access  Private
 */
const getPatientsByDepartment = asyncHandler(async (req, res) => {
  const result = await executeQuery(
    `SELECT 
      D.DEPT_NAME as department,
      COUNT(P.PATIENT_ID) as patient_count
     FROM DEPARTMENTS D
     LEFT JOIN DOCTORS DOC ON D.DEPT_ID = DOC.DEPT_ID
     LEFT JOIN PATIENTS P ON DOC.DOCTOR_ID = P.ASSIGNED_DOCTOR_ID
     WHERE D.STATUS = 'ACTIVE'
     GROUP BY D.DEPT_ID, D.DEPT_NAME
     ORDER BY patient_count DESC`
  );

  const chartData = result.rows.map(row => ({
    department: row.DEPARTMENT,
    count: Number(row.PATIENT_COUNT)
  }));

  res.json({
    success: true,
    data: chartData
  });
});

/**
 * @desc    Get doctor performance metrics
 * @route   GET /api/dashboard/doctor-performance
 * @access  Private
 */
const getDoctorPerformance = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const result = await executeQuery(
    `SELECT 
      D.DOCTOR_ID,
      U.FIRST_NAME || ' ' || U.LAST_NAME as doctor_name,
      D.SPECIALIZATION as specialty,
      DEPT.DEPT_NAME as department,
      D.RATING,
      D.PATIENTS_SEEN,
      (SELECT COUNT(*) FROM PATIENTS P WHERE P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID) as assigned_patients,
      (SELECT COUNT(*) FROM APPOINTMENTS A WHERE A.DOCTOR_ID = D.DOCTOR_ID AND A.STATUS = 'COMPLETED') as completed_appointments
     FROM DOCTORS D
     JOIN USERS U ON D.USER_ID = U.USER_ID
     LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
     WHERE D.STATUS = 'ACTIVE'
     ORDER BY D.PATIENTS_SEEN DESC
     LIMIT $1`,
    [parseInt(limit)]
  );

  const performanceData = result.rows.map(row => ({
    doctorId: row.DOCTOR_ID,
    doctorName: row.DOCTOR_NAME,
    specialty: row.SPECIALTY,
    department: row.DEPARTMENT,
    rating: Number(row.RATING) || 0,
    patientsSeen: Number(row.PATIENTS_SEEN) || 0,
    assignedPatients: Number(row.ASSIGNED_PATIENTS) || 0,
    completedAppointments: Number(row.COMPLETED_APPOINTMENTS) || 0
  }));

  res.json({
    success: true,
    data: performanceData
  });
});

/**
 * @desc    Get today's appointments
 * @route   GET /api/dashboard/today-appointments
 * @access  Private
 */
const getTodayAppointments = asyncHandler(async (req, res) => {
  const result = await executeQuery(
    `SELECT 
      A.APPOINTMENT_ID,
      A.APPOINTMENT_CODE,
      A.APPOINTMENT_TIME,
      A.TYPE,
      A.STATUS,
      A.REASON,
      P.PATIENT_ID,
      P.PATIENT_CODE,
      P.FIRST_NAME || ' ' || P.LAST_NAME as patient_name,
      P.PHONE as patient_phone,
      U.FIRST_NAME || ' ' || U.LAST_NAME as doctor_name,
      D.SPECIALIZATION
     FROM APPOINTMENTS A
     JOIN PATIENTS P ON A.PATIENT_ID = P.PATIENT_ID
     JOIN DOCTORS DOC ON A.DOCTOR_ID = DOC.DOCTOR_ID
     JOIN USERS U ON DOC.USER_ID = U.USER_ID
     JOIN DOCTORS D ON A.DOCTOR_ID = D.DOCTOR_ID
     WHERE A.APPOINTMENT_DATE::date = CURRENT_DATE
     ORDER BY A.APPOINTMENT_TIME`,
    []
  );

  const appointments = result.rows.map(row => ({
    appointmentId: row.APPOINTMENT_ID,
    appointmentCode: row.APPOINTMENT_CODE,
    appointmentTime: row.APPOINTMENT_TIME,
    type: row.TYPE,
    status: row.STATUS,
    reason: row.REASON,
    patient: {
      patientId: row.PATIENT_ID,
      patientCode: row.PATIENT_CODE,
      name: row.PATIENT_NAME,
      phone: row.PATIENT_PHONE
    },
    doctor: {
      name: row.DOCTOR_NAME,
      specialization: row.SPECIALIZATION
    }
  }));

  res.json({
    success: true,
    data: appointments
  });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/recent-activities
 * @access  Private
 */
const getRecentActivities = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Combine recent activities from different tables
  const recentPatients = await executeQuery(
    `SELECT 
      'PATIENT_REGISTERED' as activity_type,
      P.FIRST_NAME || ' ' || P.LAST_NAME as description,
      P.CREATED_AT as activity_time
     FROM PATIENTS P
     ORDER BY P.CREATED_AT DESC
     LIMIT $1`,
    [parseInt(limit)]
  );

  const recentAppointments = await executeQuery(
    `SELECT 
      'APPOINTMENT_' || A.STATUS as activity_type,
      'Appointment for ' || P.FIRST_NAME || ' ' || P.LAST_NAME as description,
      A.CREATED_AT as activity_time
     FROM APPOINTMENTS A
     JOIN PATIENTS P ON A.PATIENT_ID = P.PATIENT_ID
     ORDER BY A.CREATED_AT DESC
     LIMIT $1`,
    [parseInt(limit)]
  );

  const recentPayments = await executeQuery(
    `SELECT 
      'PAYMENT_RECEIVED' as activity_type,
      'Payment of $' || PAY.PAYMENT_AMOUNT || ' from ' || P.FIRST_NAME || ' ' || P.LAST_NAME as description,
      PAY.CREATED_AT as activity_time
     FROM BILLING_PAYMENTS PAY
     JOIN INVOICES I ON PAY.INVOICE_ID = I.INVOICE_ID
     JOIN PATIENTS P ON I.PATIENT_ID = P.PATIENT_ID
     ORDER BY PAY.CREATED_AT DESC
     LIMIT $1`,
    [parseInt(limit)]
  );

  // Combine and sort all activities
  const allActivities = [
    ...recentPatients.rows.map(r => ({ ...r, icon: 'User' })),
    ...recentAppointments.rows.map(r => ({ ...r, icon: 'Calendar' })),
    ...recentPayments.rows.map(r => ({ ...r, icon: 'DollarSign' }))
  ]
    .sort((a, b) => new Date(b.ACTIVITY_TIME) - new Date(a.ACTIVITY_TIME))
    .slice(0, parseInt(limit));

  const activities = allActivities.map(activity => ({
    type: activity.ACTIVITY_TYPE,
    description: activity.DESCRIPTION,
    time: activity.ACTIVITY_TIME,
    icon: activity.icon
  }));

  res.json({
    success: true,
    data: activities
  });
});

module.exports = {
  getDashboardStats,
  getAppointmentsChart,
  getRevenueChart,
  getPatientsByDepartment,
  getDoctorPerformance,
  getTodayAppointments,
  getRecentActivities
};
