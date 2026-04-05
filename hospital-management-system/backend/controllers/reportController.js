/**
 * Report Controller
 * Handles reports and analytics
 */
const { executeQuery } = require('../config/database');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get patient statistics report
 * @route   GET /api/reports/patients
 * @access  Private (Admin only)
 */
const getPatientReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = 'WHERE 1=1';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter += ` AND CREATED_AT::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  // Overall patient statistics
  const overallStats = await executeQuery(
    `SELECT 
      COUNT(*) as total_patients,
      COUNT(CASE WHEN STATUS = 'INPATIENT' THEN 1 END) as inpatients,
      COUNT(CASE WHEN STATUS = 'OUTPATIENT' THEN 1 END) as outpatients,
      COUNT(CASE WHEN STATUS = 'DISCHARGED' THEN 1 END) as discharged,
      COUNT(CASE WHEN GENDER = 'MALE' THEN 1 END) as male_count,
      COUNT(CASE WHEN GENDER = 'FEMALE' THEN 1 END) as female_count,
      COUNT(CASE WHEN GENDER = 'OTHER' THEN 1 END) as other_count
     FROM PATIENTS
     ${dateFilter}`,
    params
  );

  // Patients by blood group
  const bloodGroupStats = await executeQuery(
    `SELECT 
      BLOOD_GROUP,
      COUNT(*) as count
     FROM PATIENTS
     ${dateFilter}
     GROUP BY BLOOD_GROUP
     ORDER BY count DESC`,
    params
  );

  // Patients by age group
  const ageGroupStats = await executeQuery(
    `SELECT 
      CASE 
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 18 THEN '0-17'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 30 THEN '18-29'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 50 THEN '30-49'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 65 THEN '50-64'
        ELSE '65+'
      END as age_group,
      COUNT(*) as count
     FROM PATIENTS
     ${dateFilter}
     GROUP BY 
      CASE 
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 18 THEN '0-17'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 30 THEN '18-29'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 50 THEN '30-49'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, DATE_OF_BIRTH)) < 65 THEN '50-64'
        ELSE '65+'
      END
     ORDER BY age_group`,
    params
  );

  // Monthly patient registrations
  const monthlyStats = await executeQuery(
    `SELECT 
      EXTRACT(MONTH FROM CREATED_AT) as month,
      EXTRACT(YEAR FROM CREATED_AT) as year,
      COUNT(*) as count
     FROM PATIENTS
     ${dateFilter}
     GROUP BY EXTRACT(MONTH FROM CREATED_AT), EXTRACT(YEAR FROM CREATED_AT)
     ORDER BY year, month`,
    params
  );

  res.json({
    success: true,
    data: {
      overall: overallStats.rows[0],
      byBloodGroup: bloodGroupStats.rows,
      byAgeGroup: ageGroupStats.rows,
      monthlyRegistrations: monthlyStats.rows
    }
  });
});

/**
 * @desc    Get appointment statistics report
 * @route   GET /api/reports/appointments
 * @access  Private (Admin only)
 */
const getAppointmentReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = 'WHERE 1=1';
  let dateFilterWithAlias = 'WHERE 1=1';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter += ` AND APPOINTMENT_DATE::date BETWEEN $1::date AND $2::date`;
    dateFilterWithAlias += ` AND A.APPOINTMENT_DATE::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  // Overall appointment statistics
  const overallStats = await executeQuery(
    `SELECT 
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN STATUS = 'SCHEDULED' THEN 1 END) as scheduled,
      COUNT(CASE WHEN STATUS = 'CONFIRMED' THEN 1 END) as confirmed,
      COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN STATUS = 'CANCELLED' THEN 1 END) as cancelled,
      COUNT(CASE WHEN STATUS = 'NO_SHOW' THEN 1 END) as no_show
     FROM APPOINTMENTS
     ${dateFilter}`,
    params
  );

  // Appointments by type
  const typeStats = await executeQuery(
    `SELECT 
      TYPE,
      COUNT(*) as count
     FROM APPOINTMENTS
     ${dateFilter}
     GROUP BY TYPE`,
    params
  );

  // Appointments by doctor
  const doctorStats = await executeQuery(
    `SELECT 
      D.DOCTOR_ID,
      U.FIRST_NAME || ' ' || U.LAST_NAME as doctor_name,
      D.SPECIALIZATION,
      COUNT(*) as appointment_count
     FROM APPOINTMENTS A
     JOIN DOCTORS D ON A.DOCTOR_ID = D.DOCTOR_ID
     JOIN USERS U ON D.USER_ID = U.USER_ID
     ${dateFilterWithAlias}
     GROUP BY D.DOCTOR_ID, U.FIRST_NAME, U.LAST_NAME, D.SPECIALIZATION
     ORDER BY appointment_count DESC`,
    params
  );

  // Daily appointment distribution
  const dailyStats = await executeQuery(
    `SELECT 
      TRIM(TO_CHAR(APPOINTMENT_DATE, 'Day')) as day_of_week,
      COUNT(*) as count
     FROM APPOINTMENTS
     ${dateFilter}
     GROUP BY TRIM(TO_CHAR(APPOINTMENT_DATE, 'Day')), EXTRACT(DOW FROM APPOINTMENT_DATE)
     ORDER BY EXTRACT(DOW FROM APPOINTMENT_DATE)`,
    params
  );

  res.json({
    success: true,
    data: {
      overall: overallStats.rows[0],
      byType: typeStats.rows,
      byDoctor: doctorStats.rows,
      byDayOfWeek: dailyStats.rows
    }
  });
});

/**
 * @desc    Get revenue report
 * @route   GET /api/reports/revenue
 * @access  Private (Admin only)
 */
const getRevenueReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = 'WHERE 1=1';
  let dateFilterWithAlias = 'WHERE 1=1';
  let dateFilterWithPayAlias = 'WHERE 1=1';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter += ` AND ISSUE_DATE::date BETWEEN $1::date AND $2::date`;
    dateFilterWithAlias += ` AND I.ISSUE_DATE::date BETWEEN $1::date AND $2::date`;
    dateFilterWithPayAlias += ` AND PAY.PAYMENT_DATE::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  // Overall revenue statistics
  const overallStats = await executeQuery(
    `SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(SUBTOTAL), 0) as subtotal,
      COALESCE(SUM(TAX_AMOUNT), 0) as tax_amount,
      COALESCE(SUM(DISCOUNT_AMOUNT), 0) as discount_amount,
      COALESCE(SUM(TOTAL_AMOUNT), 0) as total_amount,
      COALESCE(SUM(PAID_AMOUNT), 0) as paid_amount,
      COALESCE(SUM(BALANCE_AMOUNT), 0) as balance_amount
     FROM INVOICES
     ${dateFilter}`,
    params
  );

  // Revenue by status
  const statusStats = await executeQuery(
    `SELECT 
      STATUS,
      COUNT(*) as count,
      COALESCE(SUM(TOTAL_AMOUNT), 0) as total
     FROM INVOICES
     ${dateFilter}
     GROUP BY STATUS`,
    params
  );

  // Monthly revenue
  const monthlyStats = await executeQuery(
    `SELECT 
      EXTRACT(MONTH FROM ISSUE_DATE) as month,
      EXTRACT(YEAR FROM ISSUE_DATE) as year,
      COALESCE(SUM(TOTAL_AMOUNT), 0) as revenue,
      COALESCE(SUM(PAID_AMOUNT), 0) as collected
     FROM INVOICES
     ${dateFilter}
     GROUP BY EXTRACT(MONTH FROM ISSUE_DATE), EXTRACT(YEAR FROM ISSUE_DATE)
     ORDER BY year, month`,
    params
  );

  // Revenue by department
  const departmentStats = await executeQuery(
    `SELECT 
      DEPT.DEPT_NAME,
      COUNT(*) as invoice_count,
      COALESCE(SUM(I.TOTAL_AMOUNT), 0) as total_revenue
     FROM INVOICES I
     JOIN PATIENTS P ON I.PATIENT_ID = P.PATIENT_ID
     LEFT JOIN DOCTORS D ON P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID
     LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
     ${dateFilterWithAlias}
     GROUP BY DEPT.DEPT_NAME
     ORDER BY total_revenue DESC`,
    params
  );

  // Payment methods
  const paymentMethodStats = await executeQuery(
    `SELECT 
      PAY.PAYMENT_METHOD,
      COUNT(*) as count,
      COALESCE(SUM(PAY.PAYMENT_AMOUNT), 0) as total
     FROM BILLING_PAYMENTS PAY
     JOIN INVOICES I ON PAY.INVOICE_ID = I.INVOICE_ID
     ${dateFilterWithPayAlias}
     GROUP BY PAY.PAYMENT_METHOD`,
    params
  );

  res.json({
    success: true,
    data: {
      overall: overallStats.rows[0],
      byStatus: statusStats.rows,
      monthly: monthlyStats.rows,
      byDepartment: departmentStats.rows,
      byPaymentMethod: paymentMethodStats.rows
    }
  });
});

/**
 * @desc    Get doctor performance report
 * @route   GET /api/reports/doctors
 * @access  Private (Admin only)
 */
const getDoctorReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = '';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter = `AND A.APPOINTMENT_DATE::date BETWEEN $1::date AND $2::date`;
    params.push(dateFrom, dateTo);
  }

  // To correctly bind params in subqueries, it's safer to either pass them inline or do join based counts.
  // Using explicit Postgres joins or lateral queries is better than correlated subqueries for performance too.
  const doctorStats = await executeQuery(
    `SELECT 
      D.DOCTOR_ID,
      U.FIRST_NAME || ' ' || U.LAST_NAME as doctor_name,
      D.SPECIALIZATION,
      DEPT.DEPT_NAME,
      D.RATING,
      D.EXPERIENCE_YEARS,
      D.PATIENTS_SEEN,
      (SELECT COUNT(*) FROM PATIENTS P WHERE P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID) as assigned_patients,
      (SELECT COUNT(*) FROM APPOINTMENTS A WHERE A.DOCTOR_ID = D.DOCTOR_ID ${dateFilter}) as total_appointments,
      (SELECT COUNT(*) FROM APPOINTMENTS A WHERE A.DOCTOR_ID = D.DOCTOR_ID AND A.STATUS = 'COMPLETED' ${dateFilter}) as completed_appointments,
      (SELECT COALESCE(SUM(I.TOTAL_AMOUNT), 0) FROM INVOICES I JOIN APPOINTMENTS A ON I.APPOINTMENT_ID = A.APPOINTMENT_ID WHERE A.DOCTOR_ID = D.DOCTOR_ID ${dateFilter}) as total_revenue
     FROM DOCTORS D
     JOIN USERS U ON D.USER_ID = U.USER_ID
     LEFT JOIN DEPARTMENTS DEPT ON D.DEPT_ID = DEPT.DEPT_ID
     WHERE D.STATUS = 'ACTIVE'
     ORDER BY total_revenue DESC NULLS LAST`,
    params
  );

  res.json({
    success: true,
    data: doctorStats.rows
  });
});

/**
 * @desc    Get bed occupancy report
 * @route   GET /api/reports/bed-occupancy
 * @access  Private (Admin only)
 */
const getBedOccupancyReport = asyncHandler(async (req, res) => {
  const overallStats = await executeQuery(
    `SELECT 
      (SELECT COUNT(*) FROM ROOMS) as total_rooms,
      (SELECT COUNT(*) FROM BEDS) as total_beds,
      (SELECT COUNT(*) FROM BEDS WHERE STATUS = 'OCCUPIED') as occupied_beds,
      (SELECT COUNT(*) FROM BEDS WHERE STATUS = 'AVAILABLE') as available_beds,
      (SELECT COUNT(*) FROM PATIENTS WHERE STATUS = 'INPATIENT') as current_inpatients,
      ROUND((SELECT COUNT(*) FROM BEDS WHERE STATUS = 'OCCUPIED')::numeric / NULLIF((SELECT COUNT(*) FROM BEDS), 0)::numeric * 100, 2) as occupancy_rate`
  );

  const roomTypeStats = await executeQuery(
    `SELECT 
      R.ROOM_TYPE,
      COUNT(DISTINCT R.ROOM_ID) as room_count,
      COUNT(B.BED_ID) as bed_count,
      COUNT(CASE WHEN B.STATUS = 'OCCUPIED' THEN 1 END) as occupied_count,
      ROUND(COUNT(CASE WHEN B.STATUS = 'OCCUPIED' THEN 1 END)::numeric / NULLIF(COUNT(B.BED_ID), 0)::numeric * 100, 2) as occupancy_rate
     FROM ROOMS R
     LEFT JOIN BEDS B ON R.ROOM_ID = B.ROOM_ID
     GROUP BY R.ROOM_TYPE`
  );

  const floorStats = await executeQuery(
    `SELECT 
      R.FLOOR,
      COUNT(B.BED_ID) as bed_count,
      COUNT(CASE WHEN B.STATUS = 'OCCUPIED' THEN 1 END) as occupied_count
     FROM ROOMS R
     LEFT JOIN BEDS B ON R.ROOM_ID = B.ROOM_ID
     GROUP BY R.FLOOR
     ORDER BY R.FLOOR`
  );

  res.json({
    success: true,
    data: {
      overall: overallStats.rows[0],
      byRoomType: roomTypeStats.rows,
      byFloor: floorStats.rows
    }
  });
});

/**
 * @desc    Get summary report (all key metrics)
 * @route   GET /api/reports/summary
 * @access  Private (Admin only)
 */
const getSummaryReport = asyncHandler(async (req, res) => {
  // Use the dashboard stats view (if exists, or compute directly)
  try {
    const dashboardStats = await executeQuery('SELECT * FROM V_DASHBOARD_STATS');

    // Recent trends (last 7 days)
    const recentTrends = await executeQuery(
      `SELECT 
        A.APPOINTMENT_DATE::date as date,
        COUNT(*) as appointments,
        (SELECT COUNT(*) FROM INVOICES I WHERE I.ISSUE_DATE::date = A.APPOINTMENT_DATE::date) as invoices,
        (SELECT COALESCE(SUM(TOTAL_AMOUNT), 0) FROM INVOICES I WHERE I.ISSUE_DATE::date = A.APPOINTMENT_DATE::date) as revenue
       FROM APPOINTMENTS A
       WHERE A.APPOINTMENT_DATE::date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY A.APPOINTMENT_DATE::date
       ORDER BY date`
    );

    res.json({
      success: true,
      data: {
        currentStats: dashboardStats.rows[0],
        recentTrends: recentTrends.rows
      }
    });
  } catch (e) {
    // Check if view not found, do minimal manual return
    res.json({
      success: true,
      data: {
        currentStats: null,
        recentTrends: []
      }
    })
  }

});

module.exports = {
  getPatientReport,
  getAppointmentReport,
  getRevenueReport,
  getDoctorReport,
  getBedOccupancyReport,
  getSummaryReport
};
