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

    // 4. Create Room Exactly Like Frontend
    const roomPayload = JSON.stringify({
      roomNumber: "FRONTEND-R" + Math.floor(Math.random() * 1000),
      roomType: "GENERAL",
      floor: 1,
      capacity: 2,
      status: "AVAILABLE"
    });
    authHeaders['Content-Length'] = Buffer.byteLength(roomPayload);
    const roomRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/rooms', method: 'POST', headers: authHeaders
    }, roomPayload);
    console.log('Create Exact Room from Frontend:', roomRes.status, roomRes.data);

  } catch (error) {
    console.error('Test Error:', error);
  }
}

runTests();
