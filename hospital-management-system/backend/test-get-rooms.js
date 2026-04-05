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
    const loginPayload = JSON.stringify({ email: 'admin@hospital.com', password: 'admin123' });
    const loginRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': loginPayload.length }
    }, loginPayload);

    const token = loginRes.data.data.tokens.accessToken;
    const authHeaders = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };

    console.log('--- GET ROOMS ---');
    const roomsRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/rooms?page=1&limit=10', method: 'GET', headers: authHeaders
    });
    console.log('Get Rooms:', roomsRes.status, JSON.stringify(roomsRes.data, null, 2));

  } catch (error) {
    console.error('Test Error:', error);
  }
}

runTests();
