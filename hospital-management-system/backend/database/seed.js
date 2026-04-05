/**
 * Database Seed Script
 * Populates the database with sample hospital data (PostgreSQL version)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { executeQuery, initializePool, closePool } = require('../config/database');

// Sample data
const roles = [
  { role_name: 'ADMIN', description: 'System Administrator with full access', permissions: JSON.stringify(['all']) },
  { role_name: 'DOCTOR', description: 'Medical Doctor', permissions: JSON.stringify(['patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'medical_history:read', 'medical_history:write', 'prescriptions:write']) },
  { role_name: 'NURSE', description: 'Nursing Staff', permissions: JSON.stringify(['patients:read', 'patients:write', 'appointments:read', 'beds:read', 'beds:write']) },
  { role_name: 'RECEPTIONIST', description: 'Front Desk Receptionist', permissions: JSON.stringify(['patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'billing:read', 'billing:write']) }
];

const departments = [
  { dept_name: 'Cardiology', dept_code: 'CARD', description: 'Heart and cardiovascular care', location: 'Building A, Floor 2' },
  { dept_name: 'Neurology', dept_code: 'NEUR', description: 'Brain and nervous system', location: 'Building A, Floor 3' },
  { dept_name: 'Pediatrics', dept_code: 'PEDS', description: 'Children healthcare', location: 'Building B, Floor 1' },
  { dept_name: 'Orthopedics', dept_code: 'ORTH', description: 'Bone and joint care', location: 'Building B, Floor 2' },
  { dept_name: 'Emergency', dept_code: 'ER', description: 'Emergency services', location: 'Building A, Floor 1' },
  { dept_name: 'General Medicine', dept_code: 'GENM', description: 'General healthcare', location: 'Building A, Floor 1' },
  { dept_name: 'Oncology', dept_code: 'ONCO', description: 'Cancer treatment', location: 'Building C, Floor 2' },
  { dept_name: 'Dermatology', dept_code: 'DERM', description: 'Skin care', location: 'Building B, Floor 3' }
];

const users = [
  { username: 'admin', email: 'admin@hospital.com', password: 'admin123', first_name: 'System', last_name: 'Administrator', phone: '555-0100', role_name: 'ADMIN' },
  { username: 'dr.smith', email: 'smith@hospital.com', password: 'doctor123', first_name: 'John', last_name: 'Smith', phone: '555-0101', role_name: 'DOCTOR' },
  { username: 'dr.johnson', email: 'johnson@hospital.com', password: 'doctor123', first_name: 'Sarah', last_name: 'Johnson', phone: '555-0102', role_name: 'DOCTOR' },
  { username: 'dr.williams', email: 'williams@hospital.com', password: 'doctor123', first_name: 'Michael', last_name: 'Williams', phone: '555-0103', role_name: 'DOCTOR' },
  { username: 'dr.brown', email: 'brown@hospital.com', password: 'doctor123', first_name: 'Emily', last_name: 'Brown', phone: '555-0104', role_name: 'DOCTOR' },
  { username: 'dr.davis', email: 'davis@hospital.com', password: 'doctor123', first_name: 'Robert', last_name: 'Davis', phone: '555-0105', role_name: 'DOCTOR' },
  { username: 'nurse.wilson', email: 'wilson@hospital.com', password: 'nurse123', first_name: 'Jennifer', last_name: 'Wilson', phone: '555-0201', role_name: 'NURSE' },
  { username: 'nurse.martinez', email: 'martinez@hospital.com', password: 'nurse123', first_name: 'David', last_name: 'Martinez', phone: '555-0202', role_name: 'NURSE' },
  { username: 'recep.taylor', email: 'taylor@hospital.com', password: 'recep123', first_name: 'Lisa', last_name: 'Taylor', phone: '555-0301', role_name: 'RECEPTIONIST' },
  { username: 'recep.anderson', email: 'anderson@hospital.com', password: 'recep123', first_name: 'James', last_name: 'Anderson', phone: '555-0302', role_name: 'RECEPTIONIST' }
];

const doctors = [
  { employee_id: 'DOC-001', specialization: 'Cardiology', dept_code: 'CARD', qualification: 'MD, FACC', experience_years: 15, consultation_fee: 200, license_number: 'LIC-001', joining_date: '2019-01-15', username: 'dr.smith', bio: 'Expert in interventional cardiology with 15 years of experience.' },
  { employee_id: 'DOC-002', specialization: 'Neurology', dept_code: 'NEUR', qualification: 'MD, PhD', experience_years: 12, consultation_fee: 250, license_number: 'LIC-002', joining_date: '2020-03-20', username: 'dr.johnson', bio: 'Specialized in stroke treatment and neurodegenerative diseases.' },
  { employee_id: 'DOC-003', specialization: 'Pediatrics', dept_code: 'PEDS', qualification: 'MD, FAAP', experience_years: 10, consultation_fee: 150, license_number: 'LIC-003', joining_date: '2018-06-10', username: 'dr.williams', bio: 'Dedicated pediatrician with focus on child development.' },
  { employee_id: 'DOC-004', specialization: 'Orthopedics', dept_code: 'ORTH', qualification: 'MD, FAAOS', experience_years: 18, consultation_fee: 220, license_number: 'LIC-004', joining_date: '2017-09-05', username: 'dr.brown', bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement.' },
  { employee_id: 'DOC-005', specialization: 'General Medicine', dept_code: 'GENM', qualification: 'MD', experience_years: 8, consultation_fee: 120, license_number: 'LIC-005', joining_date: '2021-01-20', username: 'dr.davis', bio: 'Family medicine practitioner with holistic approach to healthcare.' }
];

const doctorSchedules = [
  {
    username: 'dr.smith', schedules: [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', max_patients: 12 },
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', max_patients: 12 },
      { day_of_week: 3, start_time: '09:00', end_time: '17:00', max_patients: 12 },
      { day_of_week: 4, start_time: '09:00', end_time: '17:00', max_patients: 12 },
      { day_of_week: 5, start_time: '09:00', end_time: '15:00', max_patients: 8 }
    ]
  },
  {
    username: 'dr.johnson', schedules: [
      { day_of_week: 1, start_time: '10:00', end_time: '18:00', max_patients: 10 },
      { day_of_week: 2, start_time: '10:00', end_time: '18:00', max_patients: 10 },
      { day_of_week: 4, start_time: '10:00', end_time: '18:00', max_patients: 10 },
      { day_of_week: 5, start_time: '10:00', end_time: '16:00', max_patients: 8 }
    ]
  },
  {
    username: 'dr.williams', schedules: [
      { day_of_week: 1, start_time: '08:00', end_time: '16:00', max_patients: 15 },
      { day_of_week: 2, start_time: '08:00', end_time: '16:00', max_patients: 15 },
      { day_of_week: 3, start_time: '08:00', end_time: '16:00', max_patients: 15 },
      { day_of_week: 4, start_time: '08:00', end_time: '16:00', max_patients: 15 },
      { day_of_week: 5, start_time: '08:00', end_time: '14:00', max_patients: 10 }
    ]
  }
];

const patients = [
  { first_name: 'James', last_name: 'Anderson', dob: '1985-03-15', gender: 'MALE', blood_group: 'O+', phone: '555-1001', email: 'james.a@email.com', address: '123 Main St', city: 'New York', state: 'NY', zip: '10001', emergency_name: 'Mary Anderson', emergency_phone: '555-1002', insurance_provider: 'Blue Cross', insurance_number: 'BC123456', username: 'dr.smith' },
  { first_name: 'Maria', last_name: 'Garcia', dob: '1990-07-22', gender: 'FEMALE', blood_group: 'A+', phone: '555-1003', email: 'maria.g@email.com', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zip: '90001', emergency_name: 'Carlos Garcia', emergency_phone: '555-1004', insurance_provider: 'Aetna', insurance_number: 'AE789012', username: 'dr.johnson' },
  { first_name: 'Robert', last_name: 'Chen', dob: '1978-11-08', gender: 'MALE', blood_group: 'B+', phone: '555-1005', email: 'robert.c@email.com', address: '789 Pine Rd', city: 'Chicago', state: 'IL', zip: '60601', emergency_name: 'Linda Chen', emergency_phone: '555-1006', insurance_provider: 'United Health', insurance_number: 'UH345678', username: 'dr.williams' },
  { first_name: 'Emily', last_name: 'Davis', dob: '1995-01-30', gender: 'FEMALE', blood_group: 'AB+', phone: '555-1007', email: 'emily.d@email.com', address: '321 Elm St', city: 'Houston', state: 'TX', zip: '77001', emergency_name: 'Thomas Davis', emergency_phone: '555-1008', insurance_provider: 'Cigna', insurance_number: 'CG901234', username: 'dr.brown' },
  { first_name: 'William', last_name: 'Wilson', dob: '1965-09-12', gender: 'MALE', blood_group: 'O-', phone: '555-1009', email: 'william.w@email.com', address: '654 Maple Dr', city: 'Phoenix', state: 'AZ', zip: '85001', emergency_name: 'Patricia Wilson', emergency_phone: '555-1010', insurance_provider: 'Humana', insurance_number: 'HM567890', username: 'dr.davis' },
  { first_name: 'Sophia', last_name: 'Martinez', dob: '1988-05-25', gender: 'FEMALE', blood_group: 'A-', phone: '555-1011', email: 'sophia.m@email.com', address: '987 Cedar Ln', city: 'Philadelphia', state: 'PA', zip: '19101', emergency_name: 'Jose Martinez', emergency_phone: '555-1012', insurance_provider: 'Kaiser', insurance_number: 'KP123789', username: 'dr.smith' },
  { first_name: 'David', last_name: 'Taylor', dob: '1972-12-03', gender: 'MALE', blood_group: 'B-', phone: '555-1013', email: 'david.t@email.com', address: '147 Birch St', city: 'San Antonio', state: 'TX', zip: '78201', emergency_name: 'Susan Taylor', emergency_phone: '555-1014', insurance_provider: 'Blue Cross', insurance_number: 'BC456123', username: 'dr.johnson' },
  { first_name: 'Olivia', last_name: 'Brown', dob: '2000-04-18', gender: 'FEMALE', blood_group: 'O+', phone: '555-1015', email: 'olivia.b@email.com', address: '258 Spruce Ave', city: 'San Diego', state: 'CA', zip: '92101', emergency_name: 'Michael Brown', emergency_phone: '555-1016', insurance_provider: 'Aetna', insurance_number: 'AE789456', username: 'dr.williams' },
  { first_name: 'Daniel', last_name: 'Lee', dob: '1983-08-07', gender: 'MALE', blood_group: 'AB-', phone: '555-1017', email: 'daniel.l@email.com', address: '369 Willow Rd', city: 'Dallas', state: 'TX', zip: '75201', emergency_name: 'Jennifer Lee', emergency_phone: '555-1018', insurance_provider: 'United Health', insurance_number: 'UH321654', username: 'dr.brown' },
  { first_name: 'Ava', last_name: 'Johnson', dob: '1992-10-14', gender: 'FEMALE', blood_group: 'A+', phone: '555-1019', email: 'ava.j@email.com', address: '741 Ash St', city: 'San Jose', state: 'CA', zip: '95101', emergency_name: 'Christopher Johnson', emergency_phone: '555-1020', insurance_provider: 'Cigna', insurance_number: 'CG987321', username: 'dr.davis' }
];

const rooms = [
  { room_number: '101', room_type: 'GENERAL', dept_code: 'GENM', floor: 1, capacity: 4, rent_per_day: 100, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom']) },
  { room_number: '102', room_type: 'GENERAL', dept_code: 'GENM', floor: 1, capacity: 4, rent_per_day: 100, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom']) },
  { room_number: '201', room_type: 'SEMI_PRIVATE', dept_code: 'CARD', floor: 2, capacity: 2, rent_per_day: 200, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom', 'Refrigerator']) },
  { room_number: '202', room_type: 'SEMI_PRIVATE', dept_code: 'CARD', floor: 2, capacity: 2, rent_per_day: 200, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom', 'Refrigerator']) },
  { room_number: '301', room_type: 'PRIVATE', dept_code: 'NEUR', floor: 3, capacity: 1, rent_per_day: 350, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom', 'Refrigerator', 'Sofa Bed']) },
  { room_number: '302', room_type: 'PRIVATE', dept_code: 'NEUR', floor: 3, capacity: 1, rent_per_day: 350, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom', 'Refrigerator', 'Sofa Bed']) },
  { room_number: 'ICU-01', room_type: 'ICU', dept_code: 'ER', floor: 1, capacity: 1, rent_per_day: 800, facilities: JSON.stringify(['Ventilator', 'Cardiac Monitor', 'Infusion Pumps']) },
  { room_number: 'ICU-02', room_type: 'ICU', dept_code: 'ER', floor: 1, capacity: 1, rent_per_day: 800, facilities: JSON.stringify(['Ventilator', 'Cardiac Monitor', 'Infusion Pumps']) },
  { room_number: 'OP-01', room_type: 'OPERATION', dept_code: 'ORTH', floor: 2, capacity: 1, rent_per_day: 500, facilities: JSON.stringify(['Surgical Equipment', 'Anesthesia Machine']) },
  { room_number: 'PED-01', room_type: 'PRIVATE', dept_code: 'PEDS', floor: 1, capacity: 1, rent_per_day: 250, facilities: JSON.stringify(['TV', 'WiFi', 'Attached Bathroom', 'Play Area']) }
];

async function seedRoles() {
  console.log('Seeding roles...');
  for (const role of roles) {
    try {
      const existing = await executeQuery('SELECT * FROM ROLES WHERE ROLE_NAME = $1', [role.role_name]);
      if (existing.rows.length === 0) {
        await executeQuery(
          `INSERT INTO ROLES (ROLE_NAME, DESCRIPTION, PERMISSIONS) 
           VALUES ($1, $2, $3)`,
          [role.role_name, role.description, role.permissions]
        );
        console.log(`  Created role: ${role.role_name}`);
      } else {
        console.log(`  Role ${role.role_name} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating role ${role.role_name}:`, error.message);
    }
  }
}

async function seedDepartments() {
  console.log('Seeding departments...');
  for (const dept of departments) {
    try {
      const existing = await executeQuery('SELECT * FROM DEPARTMENTS WHERE DEPT_NAME = $1 OR DEPT_CODE = $2', [dept.dept_name, dept.dept_code]);
      if (existing.rows.length === 0) {
        await executeQuery(
          `INSERT INTO DEPARTMENTS (DEPT_NAME, DEPT_CODE, DESCRIPTION, LOCATION) 
           VALUES ($1, $2, $3, $4)`,
          [dept.dept_name, dept.dept_code, dept.description, dept.location]
        );
        console.log(`  Created department: ${dept.dept_name}`);
      } else {
        console.log(`  Department ${dept.dept_name} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating department ${dept.dept_name}:`, error.message);
    }
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  for (const user of users) {
    try {
      const existing = await executeQuery('SELECT * FROM USERS WHERE USERNAME = $1 OR EMAIL = $2', [user.username, user.email]);
      if (existing.rows.length === 0) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        const roleResult = await executeQuery(
          'SELECT ROLE_ID FROM ROLES WHERE ROLE_NAME = $1',
          [user.role_name]
        );

        if (roleResult.rows.length === 0) {
          console.log(`  Role ${user.role_name} not found, skipping user ${user.username}`);
          continue;
        }

        const roleId = roleResult.rows[0].ROLE_ID;

        await executeQuery(
          `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME, PHONE, ROLE_ID) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.username, user.email, passwordHash, user.first_name, user.last_name, user.phone, roleId]
        );
        console.log(`  Created user: ${user.username}`);
      } else {
        console.log(`  User ${user.username} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating user ${user.username}:`, error.message);
    }
  }
}

async function seedDoctors() {
  console.log('Seeding doctors...');
  for (const doctor of doctors) {
    try {
      const existing = await executeQuery('SELECT * FROM DOCTORS WHERE EMPLOYEE_ID = $1', [doctor.employee_id]);
      if (existing.rows.length === 0) {
        const userResult = await executeQuery(
          'SELECT USER_ID FROM USERS WHERE USERNAME = $1',
          [doctor.username]
        );

        if (userResult.rows.length === 0) {
          console.log(`  User ${doctor.username} not found, skipping doctor`);
          continue;
        }

        const userId = userResult.rows[0].USER_ID;

        const deptResult = await executeQuery(
          'SELECT DEPT_ID FROM DEPARTMENTS WHERE DEPT_CODE = $1',
          [doctor.dept_code]
        );

        const deptId = deptResult.rows.length > 0 ? deptResult.rows[0].DEPT_ID : null;

        await executeQuery(
          `INSERT INTO DOCTORS (USER_ID, EMPLOYEE_ID, SPECIALIZATION, DEPT_ID, QUALIFICATION, 
            EXPERIENCE_YEARS, CONSULTATION_FEE, LICENSE_NUMBER, JOINING_DATE, BIO) 
           VALUES ($1, $2, $3, $4, $5, 
            $6, $7, $8, $9::date, $10)`,
          [
            userId, doctor.employee_id, doctor.specialization, deptId, doctor.qualification,
            doctor.experience_years, doctor.consultation_fee, doctor.license_number, doctor.joining_date, doctor.bio
          ]
        );
        console.log(`  Created doctor: ${doctor.employee_id}`);
      } else {
        console.log(`  Doctor ${doctor.employee_id} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating doctor ${doctor.employee_id}:`, error.message);
    }
  }
}

async function seedDoctorSchedules() {
  console.log('Seeding doctor schedules...');
  for (const docSchedule of doctorSchedules) {
    try {
      const doctorResult = await executeQuery(
        `SELECT D.DOCTOR_ID FROM DOCTORS D 
         JOIN USERS U ON D.USER_ID = U.USER_ID 
         WHERE U.USERNAME = $1`,
        [docSchedule.username]
      );

      if (doctorResult.rows.length === 0) {
        console.log(`  Doctor ${docSchedule.username} not found, skipping schedules`);
        continue;
      }

      const doctorId = doctorResult.rows[0].DOCTOR_ID;

      for (const schedule of docSchedule.schedules) {
        try {
          const existing = await executeQuery(
            'SELECT * FROM DOCTOR_SCHEDULES WHERE DOCTOR_ID = $1 AND DAY_OF_WEEK = $2',
            [doctorId, schedule.day_of_week]
          );
          if (existing.rows.length === 0) {
            await executeQuery(
              `INSERT INTO DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, MAX_PATIENTS) 
               VALUES ($1, $2, $3, $4, $5)`,
              [doctorId, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.max_patients]
            );
          } else {
            console.log(`  Schedule already exists for doctor ${docSchedule.username}, day ${schedule.day_of_week}`);
          }
        } catch (error) {
          console.error(`  Error creating schedule for doctor ${docSchedule.username}, day ${schedule.day_of_week}:`, error.message);
        }
      }
      console.log(`  Created schedules for doctor: ${docSchedule.username}`);
    } catch (error) {
      console.error(`  Error creating schedules for ${docSchedule.username}:`, error.message);
    }
  }
}

async function seedPatients() {
  console.log('Seeding patients...');
  let counter = 70001;

  for (const patient of patients) {
    try {
      const existing = await executeQuery('SELECT * FROM PATIENTS WHERE EMAIL = $1 OR PHONE = $2', [patient.email, patient.phone]);
      if (existing.rows.length === 0) {
        const doctorResult = await executeQuery(
          `SELECT D.DOCTOR_ID FROM DOCTORS D 
           JOIN USERS U ON D.USER_ID = U.USER_ID 
           WHERE U.USERNAME = $1`,
          [patient.username]
        );

        const doctorId = doctorResult.rows.length > 0 ? doctorResult.rows[0].DOCTOR_ID : null;

        // Let sequence generate nextval, but pad it like 'P0000X' or so, matching Oracle setup.
        const seqResult = await executeQuery(`SELECT 'P' || LPAD(nextval('SEQ_PATIENTS')::text, 5, '0') as PATIENT_CODE`);
        const patientCode = seqResult.rows[0].PATIENT_CODE;

        await executeQuery(
          `INSERT INTO PATIENTS (PATIENT_CODE, FIRST_NAME, LAST_NAME, DATE_OF_BIRTH, GENDER, 
            BLOOD_GROUP, PHONE, EMAIL, ADDRESS, CITY, STATE, ZIP_CODE, 
            EMERGENCY_CONTACT_NAME, EMERGENCY_CONTACT_PHONE, INSURANCE_PROVIDER, INSURANCE_NUMBER,
            ASSIGNED_DOCTOR_ID) 
           VALUES ($1, $2, $3, $4::date, $5, 
            $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16,
            $17)`,
          [
            patientCode, patient.first_name, patient.last_name, patient.dob, patient.gender,
            patient.blood_group, patient.phone, patient.email, patient.address, patient.city, patient.state, patient.zip,
            patient.emergency_name, patient.emergency_phone, patient.insurance_provider, patient.insurance_number,
            doctorId
          ]
        );
        console.log(`  Created patient: ${patientCode} - ${patient.first_name} ${patient.last_name}`);
      } else {
        console.log(`  Patient ${patient.first_name} ${patient.last_name} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating patient ${patient.first_name} ${patient.last_name}:`, error.message);
    }
  }
}

async function seedRooms() {
  console.log('Seeding rooms and beds...');

  for (const room of rooms) {
    try {
      const existing = await executeQuery('SELECT * FROM ROOMS WHERE ROOM_NUMBER = $1', [room.room_number]);
      if (existing.rows.length === 0) {
        const deptResult = await executeQuery(
          'SELECT DEPT_ID FROM DEPARTMENTS WHERE DEPT_CODE = $1',
          [room.dept_code]
        );

        const deptId = deptResult.rows.length > 0 ? deptResult.rows[0].DEPT_ID : null;

        const roomResult = await executeQuery(
          `INSERT INTO ROOMS (ROOM_NUMBER, ROOM_TYPE, DEPT_ID, FLOOR, CAPACITY, RENT_PER_DAY, FACILITIES) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING ROOM_ID`,
          [room.room_number, room.room_type, deptId, room.floor, room.capacity, room.rent_per_day, room.facilities]
        );

        const roomId = roomResult.rows[0].ROOM_ID;
        console.log(`  Created room: ${room.room_number}`);

        // Create beds for the room
        for (let i = 1; i <= room.capacity; i++) {
          const bedNumber = `${room.room_number}-B${i}`;
          try {
            await executeQuery(
              `INSERT INTO BEDS (BED_NUMBER, ROOM_ID) VALUES ($1, $2)`,
              [bedNumber, roomId]
            );
            console.log(`    Created bed: ${bedNumber}`);
          } catch (error) {
            console.log(`    Bed ${bedNumber} already exists`);
          }
        }
      } else {
        console.log(`  Room ${room.room_number} already exists`);
      }
    } catch (error) {
      console.error(`  Error creating room ${room.room_number}:`, error.message);
    }
  }
}

async function seedAppointments() {
  console.log('Seeding appointments...');

  try {
    const patientsResult = await executeQuery('SELECT PATIENT_ID FROM PATIENTS LIMIT 5');
    const doctorsResult = await executeQuery('SELECT DOCTOR_ID FROM DOCTORS LIMIT 3');

    if (patientsResult.rows.length === 0 || doctorsResult.rows.length === 0) {
      console.log('  No patients or doctors found, skipping appointments');
      return;
    }

    const appointmentTypes = ['CONSULTATION', 'FOLLOW_UP', 'CHECKUP'];
    const statuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED'];

    let counter = 1;
    for (let i = 0; i < 10; i++) {
      const patientId = patientsResult.rows[i % patientsResult.rows.length].PATIENT_ID;
      const doctorId = doctorsResult.rows[i % doctorsResult.rows.length].DOCTOR_ID;
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + (i % 7));

      const appointmentCode = `APT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(counter).padStart(4, '0')}`;
      counter++;

      try {
        const existing = await executeQuery('SELECT * FROM APPOINTMENTS WHERE APPOINTMENT_CODE = $1', [appointmentCode]);
        if (existing.rows.length === 0) {
          await executeQuery(
            `INSERT INTO APPOINTMENTS (APPOINTMENT_CODE, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, 
              APPOINTMENT_TIME, TYPE, STATUS, REASON) 
             VALUES ($1, $2, $3, $4::date, 
              $5, $6, $7, $8)`,
            [
              appointmentCode, patientId, doctorId, appointmentDate,
              `${9 + (i % 8)}:00`, appointmentTypes[i % appointmentTypes.length],
              statuses[i % statuses.length], 'Regular checkup'
            ]
          );
          console.log(`  Created appointment: ${appointmentCode}`);
        } else {
          console.log(`  Appointment ${appointmentCode} already exists`);
        }
      } catch (error) {
        console.log(`  Appointment ${appointmentCode} error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('  Error seeding appointments:', error.message);
  }
}

async function seedDatabase() {
  console.log('==============================================');
  console.log('Hospital Management System - Database Seeding');
  console.log('==============================================\\n');

  try {
    await initializePool();

    await seedRoles();
    await seedDepartments();
    await seedUsers();
    await seedDoctors();
    await seedDoctorSchedules();
    await seedPatients();
    await seedRooms();
    await seedAppointments();

    console.log('\\n==============================================');
    console.log('Database seeding completed successfully!');
    console.log('==============================================');
    console.log('\\nDefault login credentials:');
    console.log('  Admin:     admin@hospital.com / admin123');
    console.log('  Doctor:    smith@hospital.com / doctor123');
    console.log('  Nurse:     wilson@hospital.com / nurse123');
    console.log('  Reception: taylor@hospital.com / recep123');

  } catch (error) {
    console.error('\\nError seeding database:', error);
  } finally {
    await closePool();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
