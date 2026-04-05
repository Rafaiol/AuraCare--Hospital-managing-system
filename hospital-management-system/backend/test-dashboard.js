const http = require('http');

const data = JSON.stringify({
  email: 'admin@hospital.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(loginOptions, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    if (!json.data || !json.data.tokens || !json.data.tokens.accessToken) {
      console.log('Login failed', json);
      return;
    }
    const token = json.data.tokens.accessToken;

    const endpoints = [
      '/api/dashboard/stats',
      '/api/dashboard/appointments-chart',
      '/api/dashboard/revenue-chart',
      '/api/dashboard/patients-by-department',
      '/api/dashboard/doctor-performance',
      '/api/dashboard/today-appointments',
      '/api/dashboard/recent-activities'
    ];

    let cur = 0;
    function testNext() {
      if (cur >= endpoints.length) return;
      const tpath = endpoints[cur++];
      const opt = {
        hostname: 'localhost',
        port: 5000,
        path: tpath,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const rq = http.request(opt, r => {
        let b = '';
        r.on('data', c => b += c);
        r.on('end', () => {
          console.log(`[${r.statusCode}] ${tpath}`);
          if (r.statusCode !== 200) {
            console.log('  ERROR BODY:', b);
          }
          testNext();
        });
      });
      rq.on('error', e => console.error(e));
      rq.end();
    }

    testNext();
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
