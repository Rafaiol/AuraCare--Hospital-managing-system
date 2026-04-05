const http = require('http');

function makeRequest(options, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  try {
    // 1. Login
    const loginPayload = JSON.stringify({ email: 'admin@hospital.com', password: 'admin123' });
    const loginRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': loginPayload.length }
    }, loginPayload);

    if (!loginRes.data.success) {
      console.error('Login failed', loginRes.data);
      return;
    }
    const token = loginRes.data.data.tokens.accessToken;
    const authHeaders = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };

    console.log('--- LOGIN SUCCESS ---');

    // 2. Create Patient
    const patientPayload = JSON.stringify({
      firstName: "Test",
      lastName: "Patient",
      email: "test.patient@example.com",
      phone: "555-1234",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      bloodGroup: "O+",
      address: "123 Test St",
      status: "ACTIVE"
    });
    authHeaders['Content-Length'] = patientPayload.length;
    const patientRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/patients', method: 'POST', headers: authHeaders
    }, patientPayload);
    console.log('Create Patient:', patientRes.status, patientRes.data);

    let patientId = 1;
    if (patientRes.data.success) {
      patientId = patientRes.data.data.patientId;
    }

    // 3. Create Doctor
    const doctorPayload = JSON.stringify({
      firstName: "Test",
      lastName: "Doctor",
      email: "test.doc" + Date.now() + "@example.com",
      phone: "555-5678",
      specialization: "General",
      status: "ACTIVE"
    });
    authHeaders['Content-Length'] = doctorPayload.length;
    const doctorRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/doctors', method: 'POST', headers: authHeaders
    }, doctorPayload);
    console.log('Create Doctor:', doctorRes.status, doctorRes.data);

    // 4. Create Room
    const roomPayload = JSON.stringify({
      roomNumber: "R" + Math.floor(Math.random() * 1000),
      roomType: "GENERAL",
      floor: "1",
      capacity: "2"
    });
    authHeaders['Content-Length'] = roomPayload.length;
    const roomRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/rooms', method: 'POST', headers: authHeaders
    }, roomPayload);
    console.log('Create Room:', roomRes.status, roomRes.data);

    // 5. Create Invoice
    const invoicePayload = JSON.stringify({
      patientId: patientId,
      dueDate: "2026-12-31",
      notes: "Test invoice",
      items: [
        { itemType: "CONSULTATION", description: "General checkup", quantity: 1, unitPrice: 150.00 }
      ]
    });
    authHeaders['Content-Length'] = invoicePayload.length;
    const invoiceRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/billing/invoices', method: 'POST', headers: authHeaders
    }, invoicePayload);
    console.log('Create Invoice:', invoiceRes.status, invoiceRes.data);

  } catch (error) {
    console.error('Test Error:', error);
  }
}

runTests();
